from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from iva.models import Imputacion, Persona
from shared.models import Moneda
from tesoreria.models import Caja, Registro
from tesoreria.views.carga_caja import CargaCaja


class MovimientoEntreCuentasTests(TestCase):
    """
    Tests unitarios de CargaCaja.movimiento_entre_cuentas.
    """

    @classmethod
    def setUpTestData(cls):
        cls.real = Moneda.objects.get(nombre='R$')
        cls.dolar = Moneda.objects.get(nombre='U$D')
        cls.imputacion_mc = Imputacion.objects.get(imputacion='Mov. entre cuentas')
        cls.banco = Caja.objects.create(caja='Banco', moneda=cls.real)
        cls.efectivo = Caja.objects.create(caja='Efectivo', moneda=cls.real)
        cls.caja_usd = Caja.objects.create(caja='Caja USD', moneda=cls.dolar)

    def setUp(self):
        self.view = CargaCaja()

    def item(self, **kwargs):
        base = {
            'fecha': date(2026, 9, 1),
            'tipo_reg': 'MC',
            'observacion': 'Transferencia',
            'tipo_de_cambio': Decimal('1.0'),
        }
        base.update(kwargs)
        return base

    def test_crea_contrapartida_con_monto_invertido_y_cajas_cruzadas(self):
        registro = self.view.movimiento_entre_cuentas(self.item(), self.efectivo, self.banco, Decimal('-100'))

        self.assertIsNotNone(registro)
        registro.refresh_from_db()
        self.assertEqual(registro.caja, self.efectivo)
        self.assertEqual(registro.caja_contrapartida, self.banco)
        self.assertEqual(registro.monto_op_rec, Decimal('100'))
        self.assertEqual(registro.tipo_reg, 'MC')
        self.assertEqual(registro.imputacion, self.imputacion_mc)
        self.assertEqual(registro.moneda, self.real)
        self.assertEqual(registro.añomes_imputacion, 202609)
        self.assertEqual(registro.observacion, 'Transferencia')
        self.assertTrue(registro.activo)
        self.assertTrue(registro.realizado)

    def test_no_crea_nada_si_no_es_mc(self):
        for tipo_reg in ['OP', 'REC', 'PSF', 'ISF']:
            with self.subTest(tipo_reg=tipo_reg):
                registro = self.view.movimiento_entre_cuentas(
                    self.item(tipo_reg=tipo_reg), self.efectivo, self.banco, Decimal('-100'))
                self.assertIsNone(registro)
        self.assertEqual(Registro.objects.count(), 0)

    def test_no_crea_nada_sin_caja_contrapartida(self):
        registro = self.view.movimiento_entre_cuentas(self.item(), None, self.banco, Decimal('-100'))

        self.assertIsNone(registro)
        self.assertEqual(Registro.objects.count(), 0)

    def test_no_duplica_si_la_contrapartida_ya_existe(self):
        primero = self.view.movimiento_entre_cuentas(self.item(), self.efectivo, self.banco, Decimal('-100'))
        segundo = self.view.movimiento_entre_cuentas(self.item(), self.efectivo, self.banco, Decimal('-100'))

        self.assertIsNotNone(primero)
        self.assertIsNone(segundo)
        self.assertEqual(Registro.objects.count(), 1)

    def test_crea_contrapartida_si_cambia_monto_fecha_o_caja(self):
        self.view.movimiento_entre_cuentas(self.item(), self.efectivo, self.banco, Decimal('-100'))

        casos = [
            (self.item(), self.efectivo, self.banco, Decimal('-200')),
            (self.item(fecha=date(2026, 9, 2)), self.efectivo, self.banco, Decimal('-100')),
            (self.item(), self.banco, self.efectivo, Decimal('-100')),
        ]
        for item, contrapartida, caja, monto in casos:
            with self.subTest(fecha=item['fecha'], contrapartida=contrapartida, monto=monto):
                self.assertIsNotNone(self.view.movimiento_entre_cuentas(item, contrapartida, caja, monto))

    def test_contrapartida_usa_moneda_de_la_caja_contrapartida(self):
        registro = self.view.movimiento_entre_cuentas(
            self.item(tipo_de_cambio=Decimal('5.5')), self.caja_usd, self.banco, Decimal('-550'))

        self.assertEqual(registro.moneda, self.dolar)
        self.assertEqual(registro.tipo_de_cambio, Decimal('5.5'))


class CargaCajaMovimientoEntreCuentasTests(TestCase):
    """
    Tests de punta a punta del POST de CargaCaja para registros MC.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user('tester', password='x')
        real = Moneda.objects.get(nombre='R$')
        cls.banco = Caja.objects.create(caja='Banco', moneda=real)
        cls.efectivo = Caja.objects.create(caja='Efectivo', moneda=real)

    def post(self, movimientos, caja=None, flag_crear_proveedor=False):
        movimientos = [
            {'fecha': '2026-09-01', 'tipo_reg': 'MC', 'obra': None, 'observacion': 'Transferencia', **m}
            for m in movimientos
        ]
        request = APIRequestFactory().post('/carga-caja/', {
            'caja': (caja or self.banco).pk,
            'flag_crear_proveedor': flag_crear_proveedor,
            'movimientos': movimientos,
        }, format='json')
        force_authenticate(request, user=self.user)
        return CargaCaja.as_view()(request)

    def test_mc_crea_registro_y_contrapartida(self):
        response = self.post([{'nombre': 'Efectivo', 'salida': '100'}])

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data), 2)
        origen = Registro.objects.get(caja=self.banco)
        destino = Registro.objects.get(caja=self.efectivo)
        self.assertEqual(origen.monto_op_rec, Decimal('-100'))
        self.assertEqual(origen.caja_contrapartida, self.efectivo)
        self.assertEqual(destino.monto_op_rec, Decimal('100'))
        self.assertEqual(destino.caja_contrapartida, self.banco)

    def test_mc_de_entrada_crea_contrapartida_negativa(self):
        response = self.post([{'nombre': 'Efectivo', 'entrada': '250'}])

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Registro.objects.get(caja=self.efectivo).monto_op_rec, Decimal('-250'))

    def test_mc_con_nombre_de_caja_en_otra_capitalizacion_crea_contrapartida(self):
        # El proveedor se busca con iexact, la caja no: "efectivo" no matchea "Efectivo"
        response = self.post([{'nombre': 'efectivo', 'salida': '100'}], flag_crear_proveedor=True)

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Registro.objects.filter(caja=self.efectivo).count(), 1)
        self.assertFalse(Persona.objects.filter(nombre_fantasia__iexact='efectivo').exists())

    def test_dos_mc_iguales_en_la_misma_carga_crean_ambas_contrapartidas(self):
        response = self.post([
            {'nombre': 'Efectivo', 'salida': '100'},
            {'nombre': 'Efectivo', 'salida': '100'},
        ])

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Registro.objects.filter(caja=self.banco).count(), 2)
        self.assertEqual(Registro.objects.filter(caja=self.efectivo).count(), 2)

    def test_mc_igual_en_cargas_distintas_crea_contrapartida(self):
        self.post([{'nombre': 'Efectivo', 'salida': '100'}])
        response = self.post([{'nombre': 'Efectivo', 'salida': '100'}])

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Registro.objects.filter(caja=self.efectivo).count(), 2)
