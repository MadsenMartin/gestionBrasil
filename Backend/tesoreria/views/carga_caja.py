from decimal import Decimal
from encodings.punycode import T
from http import client
from rest_framework.views import APIView
from rest_framework import permissions
from django.db import transaction
from iva.models import ClienteProyecto, Imputacion, Persona
from tesoreria.serializers import RegistroSerializer
from tesoreria.models import Caja, DolarMEP, Presupuesto, Registro
from tesoreria.serializers.carga_caja import CargaCajaSerializer
from django.db.models import Q
from rest_framework.response import Response

class CargaCaja(APIView):
    """
    Clase para cargar de forma masiva registros de caja.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_contrapartida(self, item, flag_crear_proveedor: bool) -> tuple:
        """
        Obtiene la caja contraprartida o proveedor basado en el nombre proporcionado.
        """

        # Si el nombre está vacío, retorna None para ambos campos
        if not item['nombre']:
            return None, None
        
        # Si se encuentra una caja con el nombre proporcionado, retorna la caja y None
        if Caja.objects.filter(caja=item['nombre']).exists():
            return Caja.objects.get(caja=item['nombre']), None
        
        # Si se encuentra un proveedor con el nombre proporcionado, retorna None y el proveedor
        if Persona.objects.filter(proveedor_receptor=1, activo=True).filter(Q(razon_social__iexact=item['nombre'])|Q(nombre_fantasia__iexact=item['nombre'])).exists():
            return None, Persona.objects.filter(proveedor_receptor=1, activo=True).get(Q(razon_social__iexact=item['nombre'])|Q(nombre_fantasia__iexact=item['nombre']))
    
        # Si no se encuentra ni caja ni proveedor, crea un nuevo proveedor
        elif flag_crear_proveedor:
            return None, Persona.objects.create(nombre_fantasia=item['nombre'], proveedor_receptor=1)
        
        return None, None

    def get_montos(self, item, moneda) -> tuple:
        """
        Retorna monto_gasto_ingreso_neto y monto_op_rec basado en el tipo de registro.
        """

        def aplicar_tipo_de_cambio(valor):
            if moneda != 1 and valor is not None:
                tc = item['tipo_de_cambio']
                if tc == Decimal(1.0):
                    try:
                        tc = DolarMEP.objects.filter(fecha=item['fecha']).first().compra
                    except Exception as e:
                        return Decimal(valor), None
                return Decimal(valor) * tc, tc
            return Decimal(valor) if valor is not None else None, None

        neto = iva = total = None

        # Los datos pueden tener dos formatos: "entrada" y "salida" o "neto" e "iva"
        if (item.get('entrada', 0) > 0) or (item.get('salida', 0) > 0):
            total = item.get('entrada', 0) - item.get('salida', 0)
            total, tc = aplicar_tipo_de_cambio(total)
            neto = total

        else:
            if 'neto' in item and item['neto'] is not None:
                neto, tc = aplicar_tipo_de_cambio(item['neto'])
            if 'iva' in item and item['iva'] is not None:
                iva, tc = aplicar_tipo_de_cambio(item['iva'])

        total = (neto if neto is not None else 0) + (iva if iva is not None else 0)
        if item['tipo_reg'] in ['REC', 'OP', "MC"]:
            return None, None, total, tc if tc else item['tipo_de_cambio']
        elif item['tipo_reg'] == 'FCV':
            return total, None
        return neto or None, iva or None, total or None, tc if tc else item['tipo_de_cambio']

    def get_presupuesto(self, item):
        """
        Obtiene el presupuesto asociado al registro
        """
        presupuesto = item.get('presupuesto', None)
        if not presupuesto:
            return None
        partes = presupuesto.split(' - ')
        
        # Caso especial: formato "- observación" (solo 2 partes, primera vacía o con guión)
        if len(partes) == 2 and (partes[0] == "" or partes[0].strip() == "-"):
            presupuesto_obj = Presupuesto.objects.filter(
                cliente_proyecto__isnull=True,
                proveedor__isnull=True,
                observacion=partes[1]
            )
        # Caso especial: formato " - - observación" (3+ partes, primeras dos vacías)
        elif len(partes) >= 3 and partes[0] == "" and partes[1] == "":
            presupuesto_obj = Presupuesto.objects.filter(
                cliente_proyecto__isnull=True,
                proveedor__isnull=True,
                observacion=' - '.join(partes[2:])
            )
        # Caso normal: formato "cliente - proveedor - observación"
        elif len(partes) >= 3:
            presupuesto_obj = Presupuesto.objects.filter(
                cliente_proyecto__cliente_proyecto=partes[0],
                observacion= ' - '.join(partes[2:])
            )
            presupuesto_obj = presupuesto_obj.filter(
                Q(proveedor__razon_social=partes[1]) | Q(proveedor__nombre_fantasia=partes[1])
            )
        else:
            return -1
        
        if not presupuesto_obj.exists():
            return -1
        return presupuesto_obj.first()
    
    def get_unidad_de_negocio(self, item):
        """
        Obtiene la unidad de negocio asociada al registro.
        """
        unidad_de_negocio = item.get('unidad_de_negocio', None)
        if unidad_de_negocio:
            return unidad_de_negocio
        
        obra = item.get('obra', None)
        if obra:
            return obra.unidad_de_negocio
        
        return None

    def movimiento_entre_cuentas(self, item, caja_contrapartida: Caja, caja: Caja, monto_op_rec: Decimal):
        """
        Realiza el movimiento entre cuentas si es necesario.
        """
        if not item['tipo_reg'] == "MC" or not caja_contrapartida:
            return None
        
        # Primero verificar si ya existe el registro
        registro_existente = Registro.objects.filter(
            fecha_reg=item['fecha'],
            añomes_imputacion=item['fecha'].strftime('%Y%m'),
            tipo_reg="MC",
            caja_contrapartida=caja,
            imputacion=Imputacion.objects.get(imputacion='Mov. entre cuentas'),
            caja=caja_contrapartida,
            monto_op_rec=-monto_op_rec,
            moneda=caja_contrapartida.moneda,
            tipo_de_cambio=item['tipo_de_cambio']
        ).first()
        
        # Si ya existe, no crear duplicado
        if registro_existente:
            return None
        
        # Si no existe, crear nuevo registro
        registro = Registro.objects.create(
            fecha_reg=item['fecha'],
            añomes_imputacion=item['fecha'].strftime('%Y%m'),
            tipo_reg="MC",
            caja_contrapartida=caja,
            imputacion=Imputacion.objects.get(imputacion='Mov. entre cuentas'),
            observacion=item['observacion'],
            caja=caja_contrapartida,
            activo=True,
            realizado=True,
            monto_op_rec=-monto_op_rec,
            moneda=caja_contrapartida.moneda,
            tipo_de_cambio=item['tipo_de_cambio']
        )

        return registro


    def post(self, request, *args, **kwargs):

        serializer = CargaCajaSerializer(data=request.data)

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    registros = []

                    flag_crear_proveedor = serializer.validated_data.get('flag_crear_proveedor', False)

                    if not serializer.validated_data:
                        raise ValueError("No se proporcionaron datos válidos para cargar.")

                    for item in serializer.validated_data['movimientos']:

                        neto, iva, monto_op_rec, tc = self.get_montos(item, serializer.validated_data['caja'].moneda.id)
                        caja_contrapartida, proveedor = self.get_contrapartida(item, flag_crear_proveedor)
                        presupuesto = self.get_presupuesto(item)
                        unidad_de_negocio = self.get_unidad_de_negocio(item)
                        caja: Caja = serializer.validated_data['caja']
                        
                        if presupuesto == -1:
                            raise ValueError(f"Presupuesto no encontrado para: {item['presupuesto']}")

                        mc = self.movimiento_entre_cuentas(item, caja_contrapartida, caja, monto_op_rec)
                        if mc:
                            registros.append(mc)

                        registros.append(Registro.objects.create(
                            fecha_reg=item['fecha'],
                            añomes_imputacion=item['fecha'].strftime('%Y%m'),
                            tipo_reg=item['tipo_reg'],
                            caja_contrapartida=caja_contrapartida,
                            proveedor=proveedor,
                            unidad_de_negocio=unidad_de_negocio,
                            cliente_proyecto=item['obra'],
                            imputacion=item['imputacion'] if 'imputacion' in item else None,
                            observacion=item['observacion'],
                            monto_gasto_ingreso_neto=neto,
                            iva_gasto_ingreso=iva,
                            monto_op_rec=monto_op_rec,
                            presupuesto=presupuesto,
                            caja=caja,
                            moneda=caja.moneda,
                            realizado=True,
                            tipo_de_cambio=tc if tc else Decimal('1.0')
                        ))

                    return Response(RegistroSerializer(registros, many=True).data, status=201)
            
            except Exception as e:
                return Response({"error": f"Error al cargar la caja: {str(e)}"}, status=400)
        
        else:
            return Response(serializer.errors, status=400)


