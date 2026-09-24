"""
Tests de punta a punta del manejo de moneda / tipo de cambio al cargar registros de caja.

Matriz esperada (carga individual y carga masiva):

                      | No hay MEP cargado          | No hay MEP y se carga           | Hay MEP
    ------------------+-----------------------------+---------------------------------+-------------------------------
    Registro USD      | Queda en USD, TC = 1        | Se multiplica por el MEP cargado| Se multiplica por el MEP
    Registro USD con  | Se multiplica por el TC     | + diferencia de cambio si el    | Se multiplica por el TC
    TC informado      |                             | MEP es distinto                 | + diferencia de cambio
    Registro R$       | Queda en R$ aunque se       | Queda en R$ aunque se informe   | Queda en R$ aunque se informe
                      | informe un TC               | un TC (sin diferencia de cambio)| un TC (sin diferencia de cambio)

- Carga individual: POST /api/tesoreria/registros/ (botón "Nuevo registro").
- Carga masiva: POST /api/tesoreria/carga_caja/.
- "Se carga el MEP": POST /api/tesoreria/mep/.
- Updates: PATCH /api/tesoreria/registros/<id>/ (diálogo de edición).
"""
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from iva.models import ClienteProyecto, Imputacion, Persona, UnidadDeNegocio
from shared.models import Moneda
from tesoreria.models import Caja, DolarMEP, Registro

REGISTROS_URL = '/api/tesoreria/registros/'
CARGA_CAJA_URL = '/api/tesoreria/carga_caja/'
MEP_URL = '/api/tesoreria/mep/'

FECHA = '2026-09-01'
OTRA_FECHA = '2026-09-02'
MEP = Decimal('5.5')
TC_INFORMADO = Decimal('5')  # Distinto del MEP para distinguir qué valor se usó al multiplicar
MONTO = Decimal('100')


class TipoDeCambioBase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user('tester', password='x')
        cls.real = Moneda.objects.get(nombre='R$')
        cls.dolar = Moneda.objects.get(nombre='U$D')
        cls.caja_real = Caja.objects.create(caja='Banco R$', moneda=cls.real)
        cls.caja_usd = Caja.objects.create(caja='Banco USD', moneda=cls.dolar)
        cls.proveedor = Persona.objects.get(razon_social='Proveedor Genérico')
        cls.unidad = UnidadDeNegocio.objects.get(unidad_de_negocio='Indirectos')
        cls.obra = ClienteProyecto.objects.get(cliente_proyecto='Indirectos')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def cargar_mep(self, fecha=FECHA, compra=MEP):
        response = self.client.post(MEP_URL, {'fecha': fecha, 'compra': str(compra), 'venta': str(compra)}, format='json')
        self.assertEqual(response.status_code, 201, response.data)

    def crear_mep(self, fecha=FECHA, compra=MEP):
        DolarMEP.objects.create(fecha=fecha, compra=compra, venta=compra)

    def registros_diferencia_de_cambio(self):
        return Registro.objects.filter(imputacion__imputacion='Diferencia de cambio')

    def assertMontoOpRec(self, registro, esperado):
        registro.refresh_from_db()
        self.assertEqual(registro.monto_op_rec, esperado)

    def crear_individual(self, caja, tipo_de_cambio=Decimal('1'), fecha=FECHA) -> Registro:
        """Replica el payload de dialogNuevoRegistro.tsx."""
        response = self.client.post(REGISTROS_URL, {
            'caja': caja.pk,
            'fecha_reg': fecha,
            'tipo_reg': 'PSF',
            'añomes_imputacion': int(fecha[:4] + fecha[5:7]),
            'unidad_de_negocio': self.unidad.pk,
            'cliente_proyecto': self.obra.pk,
            'proveedor': self.proveedor.pk,
            'observacion': 'Pago',
            'monto_gasto_ingreso_neto': str(MONTO),
            'iva_gasto_ingreso': '0',
            'monto_op_rec': str(-MONTO),
            'moneda': caja.moneda.pk,
            'tipo_de_cambio': str(tipo_de_cambio),
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        return Registro.objects.get(pk=response.data['id'])

    def crear_masivo(self, caja, tipo_de_cambio=Decimal('1'), fecha=FECHA) -> Registro:
        """Replica el payload de la carga rápida (cajaAGestion.tsx)."""
        response = self.client.post(CARGA_CAJA_URL, {
            'caja': caja.pk,
            'movimientos': [{
                'fecha': fecha,
                'tipo_reg': 'PSF',
                'nombre': self.proveedor.razon_social,
                'unidad_de_negocio': self.unidad.unidad_de_negocio,
                'obra': self.obra.cliente_proyecto,
                'observacion': 'Pago',
                'salida': str(MONTO),
                'tipo_de_cambio': str(tipo_de_cambio),
            }],
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data), 1)
        return Registro.objects.get(pk=response.data[0]['id'])


class MatrizTipoDeCambioMixin:
    """
    Las 6 celdas de la matriz. Cada subclase define `crear` con la vía de carga.
    """

    def crear(self, caja, tipo_de_cambio=Decimal('1'), fecha=FECHA) -> Registro:
        raise NotImplementedError

    # Registro USD

    def test_usd_sin_mep_queda_en_dolares_con_tc_1(self):
        registro = self.crear(self.caja_usd)

        self.assertMontoOpRec(registro, -MONTO)
        self.assertEqual(registro.tipo_de_cambio, Decimal('1'))

    def test_usd_sin_mep_se_multiplica_al_cargar_el_mep(self):
        registro = self.crear(self.caja_usd)

        self.cargar_mep()

        self.assertMontoOpRec(registro, -MONTO * MEP)
        self.assertEqual(registro.tipo_de_cambio, MEP)

    def test_usd_con_mep_se_multiplica_por_el_mep(self):
        self.crear_mep()

        registro = self.crear(self.caja_usd)

        self.assertMontoOpRec(registro, -MONTO * MEP)
        self.assertEqual(registro.tipo_de_cambio, MEP)


    # Registro USD con TC informado

    def test_usd_con_tc_informado_sin_mep_se_multiplica_por_el_tc(self):
        registro = self.crear(self.caja_usd, tipo_de_cambio=TC_INFORMADO)

        self.assertMontoOpRec(registro, -MONTO * TC_INFORMADO)
        self.assertEqual(registro.tipo_de_cambio, TC_INFORMADO)
        self.assertFalse(self.registros_diferencia_de_cambio().exists())

    def test_usd_con_tc_informado_y_mep_distinto_genera_diferencia_de_cambio(self):
        self.crear_mep()

        registro = self.crear(self.caja_usd, tipo_de_cambio=TC_INFORMADO)

        self.assertMontoOpRec(registro, -MONTO * TC_INFORMADO)
        diferencia = self.registros_diferencia_de_cambio().get()
        self.assertEqual(diferencia.monto_op_rec, -MONTO * (MEP - TC_INFORMADO))
        self.assertEqual(diferencia.caja, self.caja_usd)

    def test_usd_con_tc_informado_genera_diferencia_de_cambio_al_cargar_el_mep(self):
        registro = self.crear(self.caja_usd, tipo_de_cambio=TC_INFORMADO)

        self.cargar_mep()

        self.assertMontoOpRec(registro, -MONTO * TC_INFORMADO)
        self.assertEqual(self.registros_diferencia_de_cambio().get().monto_op_rec, -MONTO * (MEP - TC_INFORMADO))

    # Registro R$ (con TC informado)

    def test_real_sin_mep_queda_en_reales_aunque_se_informe_tc(self):
        registro = self.crear(self.caja_real, tipo_de_cambio=TC_INFORMADO)

        self.assertMontoOpRec(registro, -MONTO)
        # El TC informado se guarda: db_total lo usa para calcular el monto en USD
        self.assertEqual(registro.tipo_de_cambio, TC_INFORMADO)

    def test_real_queda_en_reales_al_cargar_el_mep_aunque_se_informe_tc(self):
        registro = self.crear(self.caja_real, tipo_de_cambio=TC_INFORMADO)

        self.cargar_mep()

        self.assertMontoOpRec(registro, -MONTO)
        self.assertFalse(self.registros_diferencia_de_cambio().exists())

    def test_real_con_mep_queda_en_reales_aunque_se_informe_tc(self):
        self.crear_mep()

        registro = self.crear(self.caja_real, tipo_de_cambio=TC_INFORMADO)

        self.assertMontoOpRec(registro, -MONTO)
        self.assertFalse(self.registros_diferencia_de_cambio().exists())


class CargaIndividualTipoDeCambioTests(MatrizTipoDeCambioMixin, TipoDeCambioBase):

    def crear(self, caja, tipo_de_cambio=Decimal('1'), fecha=FECHA):
        return self.crear_individual(caja, tipo_de_cambio, fecha)


class CargaMasivaTipoDeCambioTests(MatrizTipoDeCambioMixin, TipoDeCambioBase):

    def crear(self, caja, tipo_de_cambio=Decimal('1'), fecha=FECHA):
        return self.crear_masivo(caja, tipo_de_cambio, fecha)


class UpdateTipoDeCambioTests(TipoDeCambioBase):
    """
    PATCH del diálogo de edición (dialogUpdateRegistro.tsx). En cajas en USD el diálogo muestra y envía los montos
    en USD, y solo manda los montos / TC que el usuario modificó. El backend recalcula los montos en R$ con las
    mismas reglas que la creación.
    """

    def patch(self, registro, **cambios):
        response = self.client.patch(f'{REGISTROS_URL}{registro.pk}/', cambios, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        registro.refresh_from_db()
        return registro

    def test_real_editado_con_tc_queda_en_reales(self):
        registro = self.crear_individual(self.caja_real)

        registro = self.patch(registro, monto_gasto_ingreso_neto='150', monto_op_rec='-150',
                              tipo_de_cambio=str(TC_INFORMADO))

        self.assertEqual(registro.monto_op_rec, Decimal('-150'))

    def test_usd_sin_mep_editado_se_multiplica_al_cargar_el_mep(self):
        registro = self.crear_individual(self.caja_usd)
        self.patch(registro, monto_gasto_ingreso_neto='150', monto_op_rec='-150')

        self.assertMontoOpRec(registro, Decimal('-150'))
        self.cargar_mep()

        self.assertMontoOpRec(registro, Decimal('-150') * MEP)
        self.assertEqual(registro.tipo_de_cambio, MEP)

    def test_usd_convertido_editado_sin_tocar_montos_no_cambia(self):
        self.crear_mep()
        registro = self.crear_masivo(self.caja_usd)
        monto_convertido = registro.monto_op_rec

        registro = self.patch(registro, observacion='Pago editado')

        self.assertEqual(registro.monto_op_rec, monto_convertido)
        self.assertEqual(registro.tipo_de_cambio, MEP)
        self.assertFalse(self.registros_diferencia_de_cambio().exists())

    def test_usd_convertido_editado_con_monto_en_usd_se_multiplica_por_el_tc(self):
        self.crear_mep()
        registro = self.crear_individual(self.caja_usd)

        registro = self.patch(registro, monto_op_rec='-150')

        self.assertEqual(registro.monto_op_rec, Decimal('-150') * MEP)
        # Los montos que no se enviaron conservan su valor
        self.assertEqual(registro.monto_gasto_ingreso_neto, MONTO * MEP)

    def test_usd_convertido_editado_con_otro_tc_recalcula_desde_usd(self):
        self.crear_mep()
        registro = self.crear_individual(self.caja_usd)

        registro = self.patch(registro, tipo_de_cambio='6')

        self.assertEqual(registro.monto_op_rec, -MONTO * 6)
        self.assertEqual(registro.monto_gasto_ingreso_neto, MONTO * 6)
        self.assertEqual(registro.tipo_de_cambio, Decimal('6'))

    def test_usd_con_mep_editado_con_tc_1_se_multiplica_por_el_mep(self):
        self.crear_mep()
        registro = self.crear_masivo(self.caja_usd, tipo_de_cambio=TC_INFORMADO)

        registro = self.patch(registro, monto_gasto_ingreso_neto='150', monto_op_rec='-150', tipo_de_cambio='1')

        self.assertEqual(registro.monto_op_rec, Decimal('-150') * MEP)
        self.assertEqual(registro.tipo_de_cambio, MEP)

    def test_usd_sin_mep_movido_a_fecha_con_mep_se_multiplica_por_el_mep(self):
        self.crear_mep(fecha=OTRA_FECHA)
        registro = self.crear_individual(self.caja_usd)  # FECHA no tiene MEP: queda en USD con TC 1

        registro = self.patch(registro, fecha_reg=OTRA_FECHA, añomes_imputacion=int(OTRA_FECHA[:4] + OTRA_FECHA[5:7]))

        self.assertEqual(registro.monto_op_rec, -MONTO * MEP)
        self.assertEqual(registro.tipo_de_cambio, MEP)

    def test_diferencia_de_cambio_editada_no_se_recalcula(self):
        self.crear_mep()
        self.crear_individual(self.caja_usd, tipo_de_cambio=TC_INFORMADO)
        diferencia = self.registros_diferencia_de_cambio().get()

        diferencia = self.patch(diferencia, monto_gasto_ingreso_neto='-60', monto_op_rec='-60')

        self.assertEqual(diferencia.monto_op_rec, Decimal('-60'))
