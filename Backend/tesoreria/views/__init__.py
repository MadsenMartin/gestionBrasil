from ..models import Caja, Presupuesto, Registro, Retencion, CertificadoObra, PagoFactura, Notificacion, DolarMEP, ConciliacionCaja, Tarea, PlantillaRegistro
from ..models.archivos import Archivo
from ..serializers.archivos import ArchivoSerializer
from iva.models import Documento, Imputacion, ClienteProyecto, UnidadDeNegocio
from iva.serializers import DocumentoSerializer
from iva.utils import registro_desde_documento_real
from rest_framework import generics, permissions, status, filters
from ..serializers import (
    RegistroSerializer, DolarMEPSerializer, 
    ConciliacionCajaSerializer, RegistroCrudSerializer, CuentaCorrienteClienteSerializer, 
    CajaSerializer, CertificadoSerializer, CobroSerializer, NotificacionSerializer,
    MovimientoEntreCuentasSerializer, PagoFacturaSerializer, 
    RetencionSerializer, CuentaCorrienteProveedorSerializer,
    ImputacionFacturasSerializer, TareaSerializer, RegistroListSerializer, PlantillaRegistroSerializer
)
from django.db import transaction
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
from django.db.models import Case, When, F, DecimalField, Window, Sum, Q, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework.exceptions import ValidationError
from .. import recibopdf
from rest_framework.pagination import PageNumberPagination
from ..permisos import Administracion3
from django_filters import rest_framework as drf_filters
from decimal import Decimal
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action

class RegistroPagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 1000

class RegistroViewSet(ModelViewSet):
    serializer_class = RegistroListSerializer
    permission_classes = [Administracion3]
    pagination_class = RegistroPagination
    filter_backends = [filters.SearchFilter, drf_filters.DjangoFilterBackend]
    search_fields = [
        'id',
        'fecha_reg',
        'proveedor__razon_social',
        'proveedor__nombre_fantasia',
        'cliente_proyecto__cliente_proyecto',
        'observacion',
        'iva_gasto_ingreso',
        'monto_op_rec',
        'monto_gasto_ingreso_neto',
        'caja__caja',
        'caja_contrapartida__caja',
        'imputacion__imputacion',
        'presupuesto__observacion',
        'añomes_imputacion',
        'tipo_reg',
        'unidad_de_negocio__unidad_de_negocio',
    ]
    filterset_fields  = {
        'proveedor__razon_social': ['exact', 'icontains', 'isnull'],
        'proveedor__nombre_fantasia': ['exact', 'icontains', 'isnull'],
        'cliente_proyecto__cliente_proyecto': ['exact', 'icontains', 'isnull'],
        'unidad_de_negocio__unidad_de_negocio': ['exact', 'icontains', 'isnull'],
        'proveedor': ['exact', 'isnull'],
        'cliente_proyecto': ['exact', 'isnull'],
        'observacion': ['exact', 'icontains', 'isnull'],
        'monto_gasto_ingreso_neto': ['exact', 'gte', 'lte'],
        'iva_gasto_ingreso': ['exact', 'gte', 'lte'],
        'monto_op_rec': ['exact', 'gte', 'lte'],
        'fecha_reg': ['exact', 'gte', 'lte'],
        'caja__caja': ['exact', 'icontains', 'isnull'],
        'tipo_reg': ['exact', 'icontains', 'isnull'],
        'presupuesto': ['exact', 'isnull']
    }
    #ordering_fields = search_fields

    def get_queryset(self):
        # 1. Query base
        queryset = Registro.objects.filter(activo=True)

        # 2. Anotamos el saldo acumulado con la window function
        queryset = queryset.annotate(
            saldo_acumulado=Window(
                expression=Sum(
                    Case(
                        When(tipo_reg__in=['FC', 'SICC', 'RETS', 'RETH', 'PERCS'], then=0),
                        When(imputacion__imputacion="Diferencia de cambio", then=0),
                        When(realizado=False, then=0),
                        When(caja__moneda__id__gt=1, then=F('monto_op_rec') / F('tipo_de_cambio')),
                        default=F('monto_op_rec'),
                        output_field=DecimalField()
                    )
                ),
                partition_by=[F('caja_id')],
                order_by=[
                    F('fecha_reg').asc(),
                    F('id').asc()
                ]
            )
        )

        # Subquery to get the DolarMEP compra rate for each registro's fecha_reg
        dolar_subquery = DolarMEP.objects.filter(
            fecha=OuterRef('fecha_reg')
        ).values('compra')[:1]  # Only take the first match

        # Annotate the queryset with the dolar_mep value
        queryset = queryset.annotate(
            dolar_mep_value=Coalesce(
                Subquery(dolar_subquery),
                Value(0),  # Default value when no match
                output_field=DecimalField(max_digits=10, decimal_places=2)
            )
        )
        # Check if there's a user-specified ordering
        ordering = self.request.query_params.get('ordering')
        if ordering:
            return queryset.order_by(ordering, '-id')
        
        # Default ordering if none specified
        return queryset.order_by('-id')

    def create(self, request):
        serializer = RegistroCrudSerializer(data=request.data)
        if serializer.is_valid():
            registro = serializer.save()
            return Response(RegistroSerializer(registro).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        try:
            registro = self.get_object()
            return Response(RegistroCrudSerializer(registro).data, status=status.HTTP_200_OK)
        except Registro.DoesNotExist:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, *args, **kwargs):
        try:
            registro = self.get_object()
            serializer = RegistroCrudSerializer(registro, data=request.data, partial=True)
            if serializer.is_valid():
                registro = serializer.save()
                return Response(RegistroSerializer(registro).data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Registro.DoesNotExist:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, *args, **kwargs):
        try:
            registro = Registro.objects.get(id=kwargs['pk'])
            
            # Obtener todos los Documento asociados al registro
            documentos = registro.documento.all()
            
            # Marcar el registro como inactivo (soft delete)
            registro.activo = False
            registro.save()
            
            # Para cada Documento asociado al Registro
            for documento in documentos:
                # Verificar si hay otros registros activos para ese documento
                otros_registros_activos = Registro.objects.filter(
                    documento=documento, 
                    activo=True
                ).exclude(id=kwargs['pk']).exists()
                
                # Si no existen otros registros activos, marcar el documento como no imputado
                if not otros_registros_activos:
                    documento.imputado = False
                    documento.save()
                    
            return Response({'detail': 'Registro eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
        except Registro.DoesNotExist:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='marcar_como_recuperado')
    def marcar_como_recuperado_masivo(self, request):
        ids = request.data.get("ids", [])
        registros = Registro.objects.filter(id__in=ids)

        if not registros.exists():
            return Response({'detail': 'Ningún registro encontrado'}, status=status.HTTP_404_NOT_FOUND)

        presupuesto_reembolso = Presupuesto.objects.get(observacion="REEMBOLSADO POR EL CLIENTE")
        registros.update(presupuesto=presupuesto_reembolso)

        return Response({'detail': 'Registros actualizados correctamente'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='historial')
    def historial(self, request, pk=None):
        """Obtiene el historial de cambios de un registro específico"""
        try:
            registro = self.get_object()
            # Obtener todos los registros históricos para este registro
            historical_records = registro.history.all().order_by('-history_date')
            
            from tesoreria.serializers import HistoricalRegistroSerializer
            serializer = HistoricalRegistroSerializer(historical_records, many=True)
            return Response(serializer.data)
            
        except Registro.DoesNotExist:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class TipoRegList(APIView):
    permission_classes = [Administracion3]
    pagination_class = RegistroPagination

    def get(self, request):
        tipos = Registro.TIPO_REG_CHOICES
        data = [{"id": tipo[0], "tipo": tipo[0], "detalle": tipo[1]} for tipo in tipos]
        paginator = self.pagination_class()  # Instancia única del paginador
        paginated_response = paginator.paginate_queryset(data, request)
        return paginator.get_paginated_response(paginated_response)

class CuentasCorrientesProveedores(generics.ListAPIView):
    serializer_class = CuentaCorrienteProveedorSerializer
    queryset = Documento.objects.all()
    permission_classes = [Administracion3]

    def get(self, request):
        cuentas_corrientes = []
        registros = Registro.objects.exclude(caja__caja='Facturas')
        proveedor = request.query_params.get('proveedor', None)
        if proveedor is None:
            cliente_proyecto = request.query_params.get('cliente', None)
            if cliente_proyecto is None:
                return Response({'detail': 'Debe especificar un proveedor o un cliente'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            facturas = Documento.objects.filter(proveedor__id=int(proveedor))
            pagos = registros.filter(proveedor__id=int(proveedor))
            facturas_saldo = (facturas.aggregate(saldo=Sum('neto'))['saldo'] or 0) + (facturas.aggregate(saldo=Sum('iva'))['saldo'] or 0) # Falta sumar otros impuestos
            pagos_saldo = pagos.aggregate(saldo=Sum('monto_op_rec'))['saldo'] or 0
            saldo = facturas_saldo - pagos_saldo
            cuentas_corrientes.append({
                'proveedor': proveedor,
                'facturas': DocumentoSerializer(facturas, many=True).data,
                'pagos': RegistroSerializer(pagos, many=True).data,
                'saldo': saldo
            })
            
        return Response(cuentas_corrientes)

class CuentasCorrientesClientes(generics.ListAPIView):
    serializer_class = CuentaCorrienteClienteSerializer
    queryset = Registro.objects.all()
    permission_classes = [Administracion3]
    def get(self, request):
        cuentas_corrientes = []
        registros = Registro.objects.exclude(caja__caja='Facturas')
        cliente_proyecto = request.query_params.get('cliente', None)
        if cliente_proyecto is None:
            return Response({'detail': 'Debe especificar un cliente'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            certificados = CertificadoObra.objects.filter(cliente_proyecto_id=int(cliente_proyecto)).order_by('numero')
            pagos = registros.filter(cliente_proyecto_id=int(cliente_proyecto))
            detalle_certificados = []
            for certificado in certificados:
                lista_pagos = pagos.filter(certificado_id=certificado.id)
                detalle_certificados.append({
                    'certificado': CertificadoSerializer(certificado).data,
                    'pagos': RegistroSerializer(lista_pagos, many=True).data,
                    'saldo': certificado.saldo
                })

            certificados_saldo = certificados.aggregate(saldo=Sum('saldo'))['saldo'] or 0
            cuentas_corrientes.append({
                'cliente': int(cliente_proyecto),
                'detalle': detalle_certificados,
                'saldo': certificados_saldo
            })
            
        return Response(cuentas_corrientes)

class CajaList(generics.ListCreateAPIView):
    queryset = Caja.objects.all().order_by('-id')
    serializer_class = CajaSerializer
    permission_classes = [Administracion3]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = {
         'caja': ['icontains', 'isnull', 'exact'],
         'dueño__username': ['icontains', 'isnull', 'exact'],
         'moneda__nombre': ['icontains', 'isnull', 'exact']
    }
    search_fields = ['caja', 'dueño__username']

class CajaDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Caja.objects.all()
    serializer_class = CajaSerializer
    permission_classes = [Administracion3]

'''
Método para que se pueda buscar por razon_social y por nombre_fantasia en simultaneo TODO: Reemplazar implementaciones por filter backend de django
'''
def handle_proveedor_search(param, value, queryset):
    if 'razon_social' in param:
        nombre_fantasia_param = param.replace('razon_social', 'nombre_fantasia')
        return queryset.filter(Q(**{param: value}) | Q(**{nombre_fantasia_param: value}))
    else:
        return queryset.filter(**{param: value})

class MovimientoEntreCuentas(APIView):
    permission_classes = [Administracion3]
    @transaction.atomic
    def post(self, request): #TODO: MC cajas distintas monedas
        serializer = MovimientoEntreCuentasSerializer(data=request.data)
        if serializer.is_valid():
            datos = serializer.validated_data
            caja_origen = Caja.objects.get(caja=datos['caja_origen'])
            caja_destino = Caja.objects.get(caja=datos['caja_destino'])
            monto = datos['monto']
            fecha = datos['fecha']
            observacion = datos['observacion']
            tipo_de_cambio = datos['tipo_de_cambio'] or 1

            # Si ambas cajas son de USD traer la cotización del día de la tabla DolarMEP
            if caja_origen.moneda == caja_destino.moneda == 2:
                try:
                    tc = DolarMEP.objects.get(fecha=fecha)
                    tipo_de_cambio = tc.compra
                except DolarMEP.DoesNotExist:
                    tipo_de_cambio = 1

            registro_data = {
                'tipo_reg': 'MC',
                'caja': caja_origen,
                'fecha_reg': fecha,
                'añomes_imputacion': fecha.year * 100 + fecha.month,
                'caja_contrapartida': caja_destino,
                'imputacion': 'Mov. entre cuentas',
                'monto_op_rec': -monto,
                'moneda': caja_origen.moneda,
                'tipo_de_cambio': tipo_de_cambio,
                'observacion': observacion,
                'realizado':True
            }

            registro_serializer = RegistroSerializer(data=registro_data)
            if registro_serializer.is_valid():
                registro_1 = registro_serializer.save()
            else: 
                transaction.set_rollback(True)
                raise ValidationError(registro_serializer.errors)

            registro_data = {
                'tipo_reg': 'MC',
                'caja': caja_destino,
                'fecha_reg': fecha,
                'añomes_imputacion': fecha.year * 100 + fecha.month,
                'imputacion': 'Mov. entre cuentas',
                'caja_contrapartida': caja_origen,
                'monto_op_rec': monto,
                'moneda': caja_origen.moneda,
                'tipo_de_cambio': tipo_de_cambio,
                'observacion': observacion
            }

            registro_serializer = RegistroSerializer(data=registro_data)
            if registro_serializer.is_valid():
                registro_2 = registro_serializer.save()
            else:
                transaction.set_rollback(True)
                raise ValidationError(registro_serializer.errors)
            
            return Response({'detail': 'Movimiento entre cuentas procesado correctamente'}, status=status.HTTP_201_CREATED)
        
        else:
            transaction.set_rollback(True)
            return Response({'error de serializer' + serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class CobranzasList(generics.ListCreateAPIView):
    permission_classes = [Administracion3]
    def get_queryset(self):
        queryset = Registro.objects.filter(activo=True, tipo_reg__in=['FCV', 'REC','ISF','RETS']).order_by('id')
        for param in self.request.query_params:
            if param in ['page', 'filtro']:
                continue
            if param == 'ordering':
                queryset = queryset.order_by(self.request.query_params['ordering'])
                continue
            if '__isnull' in param:
                isnull_value = self.request.query_params[param].lower() == 'true'
                queryset = queryset.filter(**{param: isnull_value})
                continue
            queryset = queryset.filter(**{param: self.request.query_params[param]})
        return queryset

    serializer_class = RegistroSerializer

class ProcesarCobroCertificado(APIView):
    permission_classes = [Administracion3]
    @transaction.atomic
    def post(self, request):
        try:
            serializer = CobroSerializer(data=request.data)
            if serializer.is_valid():
                if serializer.validated_data['moneda'] != 1 and 'tipo_de_cambio' not in serializer.validated_data:
                    transaction.set_rollback(True)
                    return Response({'detail': 'Debe especificar el tipo de cambio cuando las monedas difieren.'}, status=status.HTTP_400_BAD_REQUEST)
                
                # 12/12/24: Estoy borrando la multiplicación por el TC, ya que ahora se calcula al crear el registro con serializer.save()
                registro_data = {
                    'certificado': serializer.validated_data['certificado'] if 'certificado' in serializer.validated_data else None,
                    'tipo_reg': 'REC',
                    'caja': serializer.validated_data['caja'],
                    'unidad_de_negocio': serializer.validated_data['cliente_proyecto'].unidad_de_negocio,
                    'cliente_proyecto': serializer.validated_data['cliente_proyecto'],
                    'observacion': serializer.validated_data['observacion'] if 'observacion' in serializer.validated_data else 'Cobro',
                    'fecha_reg': serializer.validated_data['fecha'],
                    'añomes_imputacion': serializer.validated_data['fecha'].year * 100 + serializer.validated_data['fecha'].month,
                    'monto_op_rec': round(serializer.validated_data['monto'],2),
                    'moneda': serializer.validated_data['moneda'],
                    'tipo_de_cambio': round(serializer.validated_data['tipo_de_cambio'],2) if 'tipo_de_cambio' in serializer.validated_data else None,
                    'realizado': True if serializer.validated_data['fecha'] <= datetime.now().date() else False
                }

                # Actualización del saldo del certificado
                monto = serializer.validated_data['monto']
                tipo_de_cambio = serializer.validated_data.get('tipo_de_cambio', 1)
                saldo_a_restar = monto * tipo_de_cambio if serializer.validated_data['moneda'] != 1 else monto
                if 'certificado' in serializer.validated_data:
                    CertificadoObra.objects.filter(id=serializer.validated_data['certificado']).update(saldo=F('saldo') - saldo_a_restar)

                # Creación del registro
                registro_serializer = RegistroSerializer(data=registro_data)
                if not registro_serializer.is_valid():
                    transaction.set_rollback(True)
                    return Response(registro_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                registro = registro_serializer.save()
                
                # Agregar documento si se proporciona
                if 'documento' in serializer.validated_data and serializer.validated_data['documento']:
                    registro.documento.set([serializer.validated_data['documento']])
                    serializer.validated_data['documento'].imputado = True
                    serializer.validated_data['documento'].save()
                
                return Response(registro_serializer.data, status=status.HTTP_201_CREATED)
            else:
                transaction.set_rollback(True)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RealizarRegistro(APIView): # TODO: analizar que pasa con la lógica de TC al cambiar la fecha
    permission_classes = [Administracion3]
    @transaction.atomic
    def post(self, request, **kwargs):
        try:
            fecha = request.data.get('fecha')
            if not fecha:
                return Response({'detail': 'Debe especificar un registro y una fecha'}, status=status.HTTP_400_BAD_REQUEST)

            registro = Registro.objects.get(id=kwargs['pk'])
            if not registro:
                return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)
            registro.realizado = True
            registro.fecha_reg = fecha
            registro.save()

            # Actualizar fecha_reg de registros FC asociados
            for documento in registro.documento.all(): 
                Registro.objects.filter(Q(tipo_reg="FC") | Q(tipo_reg="PERCS")).filter(documento=documento).update(fecha_reg=fecha)
            return Response(RegistroSerializer(registro).data, status=status.HTTP_200_OK)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
class CertificadosList(generics.ListCreateAPIView):
    permission_classes = [Administracion3]
    serializer_class = CertificadoSerializer

    def get_queryset(self,):
        if not self.request.query_params:
            return CertificadoObra.objects.all().order_by('-id')
        for query_param in self.request.query_params:
            if query_param == 'page':
                continue
            if query_param == 'obra':
                return CertificadoObra.objects.filter(cliente_proyecto__cliente_proyecto=self.request.query_params['obra'], activo=True)
            return CertificadoObra.objects.filter(**{query_param: self.request.query_params[query_param], 'activo': True})

    @transaction.atomic
    def post(self, request):
        serializer = CertificadoSerializer(data=request.data)
        if serializer.is_valid():
            certificado = serializer.save()
            registro_data = {
                'tipo_reg': 'FCV',
                'certificado': certificado.id,
                'caja': Caja.objects.get(caja='Facturas'),
                'cliente_proyecto': serializer.validated_data['cliente_proyecto'],
                'unidad_de_negocio': serializer.validated_data['cliente_proyecto'].unidad_de_negocio,
                'imputacion': 'Ingreso x proyecto',
                'observacion': f'Certificado N°{serializer.validated_data["numero"]}',
                'fecha_reg': serializer.validated_data['fecha'],
                'añomes_imputacion': serializer.validated_data['fecha'].year * 100 + serializer.validated_data['fecha'].month,
                'monto_gasto_ingreso_neto': serializer.validated_data['neto'],
                'iva_gasto_ingreso': serializer.validated_data['iva'],
                'moneda': 1, # Los certificados siempre son en ARS
                'tipo_de_cambio': 1,
                'realizado': True
            }
            registro_serializer = RegistroSerializer(data=registro_data)
            if registro_serializer.is_valid():
                registro = registro_serializer.save()
                return Response(registro_serializer.data, status=status.HTTP_201_CREATED)
            else:
                transaction.set_rollback(True)
                return Response(registro_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CertificadoDetail(generics.RetrieveUpdateDestroyAPIView): 
    permission_classes = [Administracion3]  
    queryset = CertificadoObra.objects.filter(activo=True)
    serializer_class = CertificadoSerializer
    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        try:
            certificado: CertificadoObra = self.get_object()
            registro = Registro.objects.get(id=request.data['id'])
            serializer = CertificadoSerializer(certificado, data=request.data, partial=True)
            if serializer.is_valid():
                old_neto = certificado.neto
                old_iva = certificado.iva
                certificado = serializer.save()
                if 'neto' in request.data:
                    new_neto = request.data['neto']
                    registro.monto_gasto_ingreso_neto = new_neto
                    if 'iva' in request.data:
                        new_iva = request.data['iva']
                        registro.iva_gasto_ingreso = new_iva
                        certificado.saldo += (new_neto - old_neto) + (new_iva - old_iva)
                    else:
                        certificado.saldo += (new_neto - old_neto)
                if 'fecha' in request.data:
                    registro.fecha_reg = request.data['fecha']
                if 'cliente_proyecto' in request.data:
                    Registro.objects.filter(certificado=certificado).update(cliente_proyecto=certificado.cliente_proyecto)
                certificado.save()
                registro.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Registro.DoesNotExist:
            return Response({'error': 'Registro not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, *args, **kwargs):
        try:
            certificado = CertificadoObra.objects.get(id=kwargs['pk'])
            certificado.activo = False
            certificado.save()
            Registro.objects.filter(tipo_reg="FCV").filter(certificado=certificado).update(activo=False)
            return Response({'detail': 'Certificado eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)
        except CertificadoObra.DoesNotExist:
            return Response({'detail': 'Certificado no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
class NotificacionesList(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notificaciones = Notificacion.objects.filter(usuario=request.user).order_by('-fecha')
        serializer = NotificacionSerializer(notificaciones, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        Notificacion.objects.filter(usuario=request.user).update(leido=True)
        return Response({'mensaje': 'Notificaciones marcadas como leídas'}, status=status.HTTP_200_OK)
    
class PagosPeriodicos(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        pass

class DolarMEPList(generics.ListCreateAPIView):
    permission_classes = [Administracion3]
    """
    Clase para listar y crear cotizaciones de dólar MEP
    """
    queryset = DolarMEP.objects.all().order_by('-fecha')
    serializer_class = DolarMEPSerializer

    def get_queryset(self):
        queryset = DolarMEP.objects.all().order_by('-fecha')
        if not self.request.query_params:
            return queryset
        for query_param in self.request.query_params:
            if query_param == 'page':
                continue
            if query_param == 'ordering':
                queryset = queryset.order_by(self.request.query_params['ordering'])
                continue
            queryset = queryset.filter(**{query_param: self.request.query_params[query_param]})
        return queryset

    @transaction.atomic
    def post(self,request):
        fecha:str = request.data.get('fecha')
        if not fecha:
            return Response({'detail': 'Debe especificar una fecha'}, status=status.HTTP_400_BAD_REQUEST)
        if DolarMEP.objects.filter(fecha=fecha).exists():
            return Response({'detail': 'Ya existe una cotización para la fecha especificada'}, status=status.HTTP_400_BAD_REQUEST)
        
        fecha_parts = fecha.split('-')
        registros = Registro.objects.filter(fecha_reg=fecha)
        tc_mep = float(request.data.get('compra'))
        try:
            for reg in registros:
                # Obtengo el tipo de cambio del registro
                tc_reg = float(reg.tipo_de_cambio) if reg.tipo_de_cambio else None
                # Si el valor obtenido no es nulo y es distinto del tc MEP del día
                if tc_reg and tc_reg > 1 and tc_reg != tc_mep:
                    # Calcular la diferencia de cambio
                    dif = round((tc_mep - tc_reg) * (float(reg.monto_op_rec)/tc_reg),2)

                    # Esto debería moverse al serializer, porque la lógica de distribución de diferencia de cambio solo se aplica al cargar una cotización y debería aplicarse siempre

                    documentos: list[Documento] = reg.documento.all()
                    clientes = {}
                    # Si hay documentos asociados al registro
                    if documentos:
                        total_docs = float(sum(documento.total for documento in documentos))
                        # Calcular la diferencia proporcional por cliente_proyecto
                        for documento in documentos:
                            if documento.cliente_proyecto not in clientes:
                                clientes[documento.cliente_proyecto.pk] = round(float(documento.total)/total_docs * dif,2)
                            else:
                                clientes[documento.cliente_proyecto.pk] += round(float(documento.total)/total_docs * dif,2)

                        for cliente in clientes:
                            docs = documentos.filter(cliente_proyecto=cliente)
                            reg_data = {
                                'tipo_reg': 'PSF' if reg.tipo_reg in ['PSF','OP','OPFC'] else 'ISF',
                                'caja': reg.caja.pk if reg.caja else None,
                                'documento': [doc.id for doc in docs],
                                'fecha_reg': fecha,
                                'añomes_imputacion': int(fecha_parts[0]) * 100 + int(fecha_parts[1]),
                                'unidad_de_negocio': reg.unidad_de_negocio.pk if reg.unidad_de_negocio else docs[0].unidad_de_negocio.pk,
                                'cliente_proyecto': cliente,
                                'proveedor': reg.proveedor.pk if reg.proveedor else None,
                                'imputacion': Imputacion.objects.get(imputacion='Diferencia de cambio').pk,
                                'observacion': 'Diferencia de cambio',
                                'monto_gasto_ingreso_neto': clientes[cliente],
                                'monto_op_rec': clientes[cliente],
                                'tipo_de_cambio': tc_reg,
                                'moneda': 1,
                                'realizado': True
                            }
                            reg_serializer = RegistroCrudSerializer(data=reg_data)
                            if reg_serializer.is_valid():
                                reg_serializer.save()
                            else:
                                transaction.set_rollback(True)
                                return Response(reg_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        if reg.tipo_reg == 'MC':
                            if reg.monto_op_rec > 0: continue
                            reg_data={
                                'tipo_reg': 'ISF',
                                'caja': reg.caja.pk if reg.caja else None,
                                'fecha_reg': reg.fecha_reg,
                                'añomes_imputacion': reg.añomes_imputacion if reg.añomes_imputacion else None,
                                'unidad_de_negocio': UnidadDeNegocio.objects.get(unidad_de_negocio='Indirectos').pk,
                                'cliente_proyecto': ClienteProyecto.objects.get(cliente_proyecto='Indirectos').pk,
                                'caja_contrapartida': reg.caja_contrapartida.pk if reg.caja_contrapartida else None,
                                'imputacion': Imputacion.objects.get(imputacion='Diferencia de cambio').pk,
                                'observacion': 'Diferencia de cambio',
                                'monto_gasto_ingreso_neto': dif,
                                'monto_op_rec': dif,
                                'tipo_de_cambio': tc_reg,
                                'realizado': True,
                                'moneda': 1,
                            }
                        else:
                            reg_data = {
                                'tipo_reg': 'PSF' if reg.tipo_reg in ['PSF','OP','OPFC'] else 'ISF',
                                'caja': reg.caja.pk if reg.caja else None,
                                'fecha_reg': fecha,
                                'añomes_imputacion': int(fecha_parts[0]) * 100 + int(fecha_parts[1]),
                                'unidad_de_negocio': reg.unidad_de_negocio.pk if reg.unidad_de_negocio else None,
                                'cliente_proyecto': reg.cliente_proyecto.pk if reg.cliente_proyecto else None,
                                'proveedor': reg.proveedor.pk if reg.proveedor else None,
                                'imputacion': Imputacion.objects.get(imputacion='Diferencia de cambio').pk,
                                'observacion': 'Diferencia de cambio',
                                'monto_gasto_ingreso_neto': dif,
                                'monto_op_rec': dif,
                                'tipo_de_cambio': tc_reg,
                                'moneda': 1,
                            }
                        reg_serializer = RegistroCrudSerializer(data=reg_data)
                        if reg_serializer.is_valid():
                            reg_serializer.save()
                        else:
                            transaction.set_rollback(True)
                            return Response(reg_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                        
                # Si el registro es en USD y el tipo de cambio es 1, quiere decir que le falta el TC, entonces multiplicamos los montos por el TC MEP y guardamos el TC
                elif reg.moneda == 2 and tc_reg and tc_reg == 1:
                    try:
                        reg.tipo_de_cambio = tc_mep
                        reg.monto_gasto_ingreso_neto = round(float(reg.monto_gasto_ingreso_neto)*tc_mep,4) if reg.monto_gasto_ingreso_neto else None
                        reg.iva_gasto_ingreso = round(float(reg.iva_gasto_ingreso)*tc_mep,4) if reg.iva_gasto_ingreso else None
                        reg.monto_op_rec = round(float(reg.monto_op_rec)*tc_mep,4) if reg.monto_op_rec else None
                        reg.save()
                    except Exception as e:
                        transaction.set_rollback(True)
                        return Response({'Error al actualizar registro de caja en USD': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return super().post(request)
    
class DolarMEPDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [Administracion3]
    """
    Clase para ver, actualizar y eliminar cotizaciones de dólar MEP
    """
    queryset = DolarMEP.objects.all()
    serializer_class = DolarMEPSerializer

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        try:
            registros: list[Registro] = Registro.objects.filter(fecha_reg=self.get_object().fecha).filter(imputacion__imputacion='Diferencia de cambio')
            cotizacion: DolarMEP = self.get_object()
            for reg in registros:
                usd = reg.monto_gasto_ingreso_neto / (
                    cotizacion.compra - reg.tipo_de_cambio
                )
                dif = round(usd * (self.request.data['compra'] - reg.tipo_de_cambio),2)
                reg.monto_gasto_ingreso_neto = dif
                reg.monto_op_rec = dif
                reg.save()
            serializer = DolarMEPSerializer(cotizacion, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                transaction.set_rollback(True)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        try:
            registros: list[Registro] = Registro.objects.filter(fecha_reg=self.get_object().fecha).filter(imputacion__imputacion='Diferencia de cambio')
            for reg in registros:
                reg.delete()
            return super().delete(request, *args, **kwargs)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ConciliacionCajaView(generics.ListCreateAPIView):
    permission_classes = [Administracion3]
    """
    Clase para listar y crear conciliaciones de caja
    """
    queryset = ConciliacionCaja.objects.all().order_by('-id')
    serializer_class = ConciliacionCajaSerializer

class ConciliacionCajaData(APIView):
    permission_classes = [Administracion3]
    """
    Clase para obtener los registros sin conciliar
    """
    
    def get(self, request):
        caja = request.query_params.get('caja')
        if not caja:
            return Response({'detail': 'Debe especificar una caja válida'}, status=status.HTTP_400_BAD_REQUEST)
        
        ultima_conciliacion = ConciliacionCaja.objects.filter(caja=caja).order_by('-id').first()

        # Si no hay conciliación retornar todos los registros de la caja
        if not ultima_conciliacion:
            registros = Registro.objects.filter(caja=caja)
            registros_data = RegistroSerializer(registros, many=True).data
            return Response(registros_data)
        
        registros = Registro.objects.filter(caja=caja, id__gt=ultima_conciliacion.registro.id)
        registros_data = RegistroSerializer(registros, many=True).data
        return Response(registros_data)
    
class GenerarReciboRegistro(APIView):
    permission_classes = [Administracion3]
    """
    Clase para generar un recibo a partir de un registro
    """
    def get(self, request):
        registro_id = request.query_params.get('registro')
        if not registro_id:
            return Response({'detail': 'Debe especificar un registro'}, status=status.HTTP_400_BAD_REQUEST)
        caja = request.query_params.get('caja')
        
        registro = Registro.objects.get(id=registro_id, caja__caja=caja)

        if not registro:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        
        pagador = request.query_params.get('pagador')

        if not pagador:
            return Response({'detail': 'Debe especificar un pagador'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = recibopdf.generate_receipt(registro, pagador)

        return response

class ImputacionFacturas(APIView):
    permission_classes = [Administracion3]
    """
    Clase que recibe una lista de facturas y prespuestos para crear los registros correspondientes
    """
    @transaction.atomic
    def post(self,request):
        try:
            serializer = ImputacionFacturasSerializer(data=request.data)
            if serializer.is_valid():
                imputaciones = serializer.validated_data['imputaciones']
                for imputacion in imputaciones:
                    registro = registro_desde_documento_real(imputacion['factura'],imputacion['presupuesto'])
                    if not isinstance(registro, Registro):
                        return Response({'detail': 'Error al crear el registro: ' + registro}, status=status.HTTP_400_BAD_REQUEST)
                return Response({'detail': 'Registros creados correctamente'}, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class RegistrosAsociados(APIView):
    permission_classes = [Administracion3]
    '''
    Clase que retorna las instancias de los distintos modelos asociados a un registro
    '''
    allowed_methods = ['get']
    def get(self,request,**kwargs):
        try:
            registro: Registro = Registro.objects.get(id=kwargs['pk'])
            registros_fc = registro.documento.all()
            
            # Get retenciones related to the main registro
            retenciones_main = list(Retencion.objects.filter(registro=registro))
            
            # Get retenciones related to the registro_fc entries
            retenciones_fc = []
            for reg_fc in registros_fc:
                # Buscamos directamente las retenciones que tengan este documento en la relación M2M
                # La relación inversa se debe acceder desde el registro que contiene al documento
                registros_con_este_documento = Registro.objects.filter(documento=reg_fc)
                for reg_documento in registros_con_este_documento:
                    retenciones_fc.extend(list(Retencion.objects.filter(registro_fc=reg_documento)))
            
            # Combine all retenciones
            seen_ids = set()
            all_retenciones = []
            for ret in retenciones_main + retenciones_fc:
                if ret.id not in seen_ids:
                    seen_ids.add(ret.id)
                    all_retenciones.append(ret)

            certificado = registro.certificado
            pagos_factura = PagoFactura.objects.filter(registros_pago__id=registro.pk) if registro.tipo_reg != 'FC' else PagoFactura.objects.filter(registros_fc=registro)
            archivos = registro.archivos.all()
            return Response({
                'registros_fc': DocumentoSerializer(registros_fc,many=True).data,
                'retencion': RetencionSerializer(all_retenciones, many=True).data if all_retenciones else None,
                'certificado': CertificadoSerializer(certificado).data if certificado else None,
                'pagos': PagoFacturaSerializer(pagos_factura,many=True).data,
                'archivos': ArchivoSerializer(archivos,many=True).data
            })
        except Registro.DoesNotExist:
            return Response({'detail': 'Registro no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class TareasList(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tarea.objects.all().order_by('-id')
    serializer_class = TareaSerializer

    def get(self, request):
        tareas = Tarea.objects.filter(asignado_a=request.user).order_by('-id')
        serializer = TareaSerializer(tareas, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        pass
    
class TareaDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer

    def get(self, request, *args, **kwargs):
        tarea = self.get_object()
        serializer = TareaSerializer(tarea)
        if tarea.usuario != request.user:
            return Response({'detail': 'No tiene permisos para ver esta tarea'}, status=status.HTTP_403_FORBIDDEN)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        estado = request.data.get('estado')
        if not estado:
            return Response({'detail': 'Debe especificar un estado para la tarea'}, status=status.HTTP_400_BAD_REQUEST)
        tarea = self.get_object()
        tarea.estado = estado
        tarea.save()
        return Response({'detail': 'Tarea actualizada correctamente'}, status=status.HTTP_200_OK)

    def delete(self, request):
        pass

class PlantillaRegistroList(generics.ListCreateAPIView):
    permission_classes = [Administracion3]
    """
    Clase para listar y crear plantillas de registro
    """
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = {
        'proveedor__razon_social': ['icontains', 'isnull', 'exact'],
        'nombre': ['icontains', 'isnull', 'exact'],
        'tipo_reg': ['icontains', 'isnull', 'exact'],
        'unidad_de_negocio__unidad_de_negocio': ['icontains', 'isnull', 'exact'],
        'cliente_proyecto__cliente_proyecto': ['icontains', 'isnull', 'exact'],
        'imputacion__imputacion': ['icontains', 'isnull', 'exact'],
        'observacion': ['icontains', 'isnull', 'exact'],
    }
    search_fields = ['nombre', 'tipo_reg', 'unidad_de_negocio__unidad_de_negocio', 'cliente_proyecto__cliente_proyecto', 'imputacion__imputacion', 'observacion']
    queryset = PlantillaRegistro.objects.all().order_by('-id')
    serializer_class = PlantillaRegistroSerializer

class PlantillaRegistroDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [Administracion3]
    """
    Clase para ver, actualizar y eliminar plantillas de registro
    """
    queryset = PlantillaRegistro.objects.all()
    serializer_class = PlantillaRegistroSerializer

class SubirArchivoRegistro(APIView):
    '''
    Vista para subir un archivo asociado a un registro de caja.
    '''
    def post(self, request, *args, **kwargs):
        try:
            archivo = request.FILES.get('archivo') 
            usuario = request.user.username
            descripcion = request.POST.get('descripcion')
            nuevo_archivo = Archivo(archivo=archivo, usuario=usuario, descripcion=descripcion)
            nuevo_archivo.save()
            registro = request.POST.get('registro')
            if registro:
                registro_instancia = Registro.objects.filter(id=registro).first()
                if not registro_instancia:
                    return Response({'error': 'Registro no encontrado'}, status=400)
                registro_instancia.archivos.add(nuevo_archivo)
            else:
                return Response({'error': 'Registro no encontrado'}, status=400)
            return Response({'mensaje': 'Archivo subido exitosamente', 'id': nuevo_archivo.id}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        
class FCI(APIView):
    permission_classes = [Administracion3]
    """
    Clase para generar movimientos entre el banco y el fondo de inversión
    """
    @transaction.atomic
    def post(self, request):
        try:
            # Obtener los datos del rescate/suscripción
            tipo:str = request.data.get('tipo')
            monto:str = request.data.get('monto')
            fecha:str = request.data.get('fecha')

            # Validar los datos
            if not (tipo and monto and fecha):
                return Response({'detail': 'No indicó tipo, fecha o monto de operación del fondo'}, status=status.HTTP_400_BAD_REQUEST)
            if tipo not in ['rescate', 'suscripcion']:
                return Response({'detail': 'Tipo de operación no válido'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                monto = Decimal(monto)
                monto = abs(monto)
                if monto <= 0:
                    return Response({'detail': 'El monto de operación debe ser mayor a 0'}, status=status.HTTP_400_BAD_REQUEST)
            except:
                return Response({'detail': 'El monto de operación no es un número válido'}, status=status.HTTP_400_BAD_REQUEST)
            # Validate fecha format
            try:
                datetime.strptime(fecha, '%Y-%m-%d')
            except ValueError:
                return Response({'detail': 'Fecha debe estar en formato YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                fondo = Caja.objects.get(caja='Fondo inversión')
                banco = Caja.objects.get(caja='Banco ICBC')
            except Caja.DoesNotExist:
                return Response({'detail': 'Una o ambas cajas especificadas no existen en la base de datos'}, status=status.HTTP_400_BAD_REQUEST)
            fondo = Caja.objects.get(caja='Fondo inversión')
            banco = Caja.objects.get(caja='Banco ICBC')
            imputacion_mc = Imputacion.objects.get(imputacion='Mov. entre cuentas')

            reg_base = {
                'tipo_reg': 'MC',
                'fecha_reg': fecha,
                'añomes_imputacion': int(fecha.split('-')[0]) * 100 + int(fecha.split('-')[1]),
                'imputacion': imputacion_mc.pk,
                'tipo_de_cambio': Decimal(1.00),
                'moneda': 1,
                'realizado': True,
                'activo': True
            }
            reg_fondo = {
                **reg_base,
                'caja': fondo.pk,
                'caja_contrapartida': banco.pk
            }
            reg_banco = {
                **reg_base,
                'caja': banco.pk,
                'caja_contrapartida': fondo.pk
            }
            
            if tipo == 'rescate':
                
                reg_origen = {
                    **reg_fondo,
                    'observacion': 'Rescate FCI',
                    'monto_op_rec': -monto
                }

                reg_destino = {
                    **reg_banco,
                    'observacion': 'Rescate FCI',
                    'monto_op_rec': monto
                }

            elif tipo == 'suscripcion':

                reg_origen = {
                    **reg_banco,
                    'observacion': 'Suscripción FCI',
                    'monto_op_rec': -monto
                }

                reg_destino = {
                    **reg_fondo,
                    'observacion': 'Suscripción FCI',
                    'monto_op_rec': monto
                }
            
            # Crear los registros
            reg_origen_serializer = RegistroCrudSerializer(data=reg_origen)
            if reg_origen_serializer.is_valid():
                reg1 = reg_origen_serializer.save()
            else:
                transaction.set_rollback(True)
                return Response({'detail': 'Error al validar reg_origen_serializer. ', 'Errores': reg_origen_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            reg_destino_serializer = RegistroCrudSerializer(data=reg_destino)
            if reg_destino_serializer.is_valid():
                reg2 = reg_destino_serializer.save()
            else:
                transaction.set_rollback(True)
                return Response({'detail': 'Error al validar reg_destino_serializer ', 'Errores': reg_destino_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            reg1 = RegistroSerializer(reg1).data
            reg2 = RegistroSerializer(reg2).data
            return Response([reg1, reg2], status=status.HTTP_201_CREATED)
            
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)