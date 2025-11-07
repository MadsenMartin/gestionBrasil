from django.db import transaction
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from tesoreria.models import PagoFactura, Caja
from iva.models import ClienteProyecto, Documento, EstadoDocumento, Imputacion, Persona
from tesoreria.serializers import PagoFacturaSerializer, PagoManoDeObraSerializer, RegistroCrudSerializer, PagoUISerializer, PagoSerializer, RetencionSerializer
from tesoreria.models import Registro
from tesoreria.permisos import Administracion3
from iva.utils import registro_desde_documento_real, registro_desde_documento_temporal, registros_percepciones
from tesoreria.views import handle_proveedor_search
from tesoreria.opdf import generar_pdf_orden_pago
from django.db.models import Q
from datetime import datetime
from openpyxl import Workbook
from django.http import HttpResponse
from rest_framework import filters
from django_filters import rest_framework as drf_filters

class PagoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = PagoFactura.objects.all()
    serializer_class = PagoFacturaSerializer
    permission_classes = [Administracion3]

class NuevoPagoMDO(APIView):
    permission_classes = [Administracion3]
    """
    Clase para registrar un pago de mano de obra
    """
    @transaction.atomic
    def post(self, request):
        serializer = PagoManoDeObraSerializer(data=request.data)
        if serializer.is_valid():
            pagos = serializer.validated_data['pagos']
            fecha = serializer.validated_data['fecha']
            caja = Caja.objects.get(caja='Caja Fede').pk
            for pago in pagos:
                unidad_de_negocio = ClienteProyecto.objects.get(id=pago['cliente_proyecto']).unidad_de_negocio.pk
                registro_data = {
                    'tipo_reg': 'PSF',
                    'caja': caja,
                    'fecha_reg': fecha,
                    'proveedor': pago['proveedor'],
                    'unidad_de_negocio': unidad_de_negocio,
                    'cliente_proyecto': pago['cliente_proyecto'],
                    'añomes_imputacion': fecha.year * 100 + fecha.month,
                    'imputacion': pago['imputacion'],
                    'monto_gasto_ingreso_neto': -pago['monto'],
                    'observacion': pago['observacion'],
                    'presupuesto': pago['presupuesto'],
                    'monto_op_rec': -pago['monto'],
                    'moneda': 1,
                    'realizado': True,
                    'tipo_de_cambio': 1
                }
                registro_serializer = RegistroCrudSerializer(data=registro_data)
                if registro_serializer.is_valid():
                    registro_serializer.save()
                else:
                    transaction.set_rollback(True)
                    return Response(registro_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response({'detail': 'Pagos de mano de obra procesados correctamente'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PagosList(generics.ListCreateAPIView):
    serializer_class = PagoUISerializer
    permission_classes = [Administracion3]
    filter_backends = [filters.SearchFilter, drf_filters.DjangoFilterBackend]
    search_fields = ['registros_pago__proveedor__razon_social', 'registros_pago__proveedor__nombre_fantasia',
                      'registros_pago__proveedor__cnpj', 'fecha_pago',
                      'registros_pago__cliente_proyecto__cliente_proyecto',
                      ]
    filterset_fields = {
        'fecha_pago': ['exact', 'gte', 'lte'],
        'registros_pago__proveedor__razon_social': ['exact', 'icontains'],
        'registros_pago__proveedor__cnpj': ['exact', 'icontains'],
        'documentos__cliente_proyecto__cliente_proyecto': ['exact', 'icontains'],
        'documentos__tipo_documento__tipo_documento': ['exact', 'icontains'],
    }
    
    def get_queryset(self):
        queryset = PagoFactura.objects.filter(activo=True).order_by('-id')
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            # Tengo que agregar "registro__" o "-registro__" porque los campos por los que se ordena son de la tabla Registro
            if ordering in ['-fecha_pago', 'fecha_pago','-monto', 'monto']:
                return queryset.order_by(ordering)
            order = self.request.query_params['ordering'][0]
            if order == '-':
                return queryset.order_by(f"-registros_pago__{self.request.query_params['ordering'][1:]}")
            else: return queryset.order_by(f"registros_pago__{self.request.query_params['ordering']}")
        return queryset

    '''def get_queryset(self):
        queryset = PagoFactura.objects.all().order_by('-id')
        for param in self.request.query_params:
            if param == 'page':
                continue
            if param == 'ordering':
                # Tengo que agregar "registro__" o "-registro__" porque los campos por los que se ordena son de la tabla Registro
                order = self.request.query_params['ordering'][0]
                if order == '-':
                    queryset = queryset.order_by(f"-registros_pago__{self.request.query_params['ordering'][1:]}")
                else: queryset = queryset.order_by(f"registros_pago__{self.request.query_params['ordering']}")
                continue
            _param = f"registros_pago__{param}"
            queryset = handle_proveedor_search(_param, self.request.query_params[param], queryset)
        return queryset'''

class ProcessPaymentView(APIView):
    permission_classes = [Administracion3]

    @transaction.atomic
    def post(self, request):
        try:
            serializer = PagoSerializer(data=request.data)
            if serializer.is_valid():
                documentos: list[Documento] = serializer.validated_data['facturas']
                medios_pago = serializer.validated_data['medios_pago']
                
                # Verificar si hay facturas con cliente "Varios" que requieren imputación múltiple
                facturas_varios = [f for f in documentos if f.cliente_proyecto and f.cliente_proyecto.cliente_proyecto == "Varios"]
                if facturas_varios and 'imputaciones_multiples' not in serializer.validated_data:
                    # Devuelve las facturas que necesitan imputación
                    return Response({
                        'detail': 'Imputación múltiple requerida',
                        'facturas_varios': [{'id': f.id, 'numero': f"{f.serie}{f.tipo_documento.tipo_documento}{f.numero}", 
                                            'proveedor': f.proveedor.razon_social, 'total': f.total, 'neto': f.neto, 'iva': f.iva} 
                                        for f in facturas_varios]
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Generar PDF de orden de pago
                op_nro = PagoFactura.objects.filter().order_by('-id').first().id + 1
                datos_proveedor = {
                    'op_nro': op_nro,
                    'nombre': documentos[0].proveedor.razon_social,
                    'cnpj': documentos[0].proveedor.cnpj,
                }
                op = generar_pdf_orden_pago("orden_de_pago.pdf",datos_proveedor,medios_pago, documentos)

                registros_fc = []
                registros_pago = []
                for factura in documentos:
                    if not factura.imputado:
                        factura.imputado = True
                        factura.save()
                    
                    # Si la factura tiene cliente "Varios" y hay imputaciones múltiples
                    if (factura.cliente_proyecto and factura.cliente_proyecto.cliente_proyecto == "Varios" 
                        and 'imputaciones_multiples' in serializer.validated_data):
                        
                        # Filtrar las imputaciones para esta factura
                        imputaciones_factura = [imp for imp in serializer.validated_data['imputaciones_multiples'] 
                                            if imp['factura_id'] == factura.id]
                        
                        # Crear un registro FC para cada imputación
                        for imputacion in imputaciones_factura:
                            cliente_proyecto: ClienteProyecto = imputacion['cliente_proyecto']
                            monto = float(imputacion['monto'])
                            
                            # Crear copia temporal del documento con cliente_proyecto específico para registro
                            porcentaje_iva = float(factura.iva) * 100 / float(factura.neto) if float(factura.iva) != 0.00 else 0
                            neto = 100 / (porcentaje_iva+100) * monto
                            iva = monto-neto

                            factura_temp = Documento (
                                id=                         factura.id,
                                numero=                     factura.numero,
                                serie=             factura.serie,
                                añomes_imputacion_gasto=    factura.añomes_imputacion_gasto,
                                fecha_documento=            factura.fecha_documento,
                                tipo_documento=             factura.tipo_documento,
                                fecha_carga=                factura.fecha_carga,
                                proveedor=                  factura.proveedor,
                                imputacion=                 factura.imputacion,
                                receptor=                   factura.receptor,
                                unidad_de_negocio=          cliente_proyecto.unidad_de_negocio,
                                cliente_proyecto=           cliente_proyecto,
                                concepto=                   factura.concepto,
                                neto=                       neto,
                                iva=                        iva,
                                moneda=                     factura.moneda,
                                tipo_de_cambio=             factura.tipo_de_cambio,
                            )
                            
                            try:

                                # A partir de la copia temporal, se crea el registro FC
                                registro_fc = registro_desde_documento_temporal(factura,factura_temp)
                                registros_fc.append(registro_fc)

                            except Exception as e:

                                transaction.set_rollback(True)
                                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                            
                        percs = registros_percepciones(factura)
                        if percs:
                            registros_fc.extend(percs)
                    else:
                        # Comportamiento normal para facturas con un solo cliente/proyecto
                        try:
                            registros, percs = registro_desde_documento_real(factura)
                            registros_fc.append(registros)
                            if percs:
                                registros_fc.extend(percs)
                        except Exception as e:
                            import traceback
                            error_details = {
                                'detail':       str(e),
                                'factura_id':   factura.id,
                                'proveedor':    factura.proveedor.razon_social if factura.proveedor else 'No disponible',
                                'traceback':    traceback.format_exc()
                            }
                            transaction.set_rollback(True)
                            return Response(error_details, status=status.HTTP_400_BAD_REQUEST)

                # 2) Iteración sobre medios_pago
                retenciones = []
                for medio in medios_pago:
                    # Resto del código sin cambios...
                    anio_mes = int(medio['fecha'][0:4]) * 100 + int(medio['fecha'][5:7])

                    # 2.1) Creación de registro
                    facturas_ids = [factura.id for factura in documentos]
                    
                    registro_data = {
                        'tipo_reg':             'OP' if medio['tipo'] != 'Retención' else 'RETH',
                        'caja':                 medio['caja'].id,
                        'documento':            facturas_ids,
                        'añomes_imputacion':    anio_mes,
                        'imputacion':           Imputacion.objects.get(imputacion="Impuesto a las Ganancias ret/perc").pk if medio['tipo'] == 'Retención' else None,
                        'fecha_reg':            medio['fecha'],
                        'proveedor':            documentos[0].proveedor.id,
                        'observacion':          documentos[0].concepto if documentos[0].concepto else None if medio['tipo'] != 'Retención' else 'Retención',

                        # El usuario para una mejor experiencia indica los montos positivos, pero los registros al ser gastos deben ser negativos
                        'monto_op_rec':         -medio['monto'],

                        'moneda':               medio['caja'].moneda,
                        'tipo_de_cambio':       medio['tipo_de_cambio'],
                        'realizado':            1 if datetime.fromisoformat(medio['fecha']).date() <= datetime.now().date() else 0
                    }

                    registro_serializer = RegistroCrudSerializer(data=registro_data)
                    if registro_serializer.is_valid():
                        registro = registro_serializer.save()
                        registros_pago.append(registro_serializer.data)
                        
                    else:
                        transaction.set_rollback(True)
                        return Response('Error de validación3: ' + str(registro_serializer.errors), 
                                    status=status.HTTP_400_BAD_REQUEST)
                    
                    if medio['tipo'] == 'Retención':
                        retencion_data = {
                            'registro':     registro.id,
                            'numero':       medio.get('numero_certificado'),
                            'tipo':         medio.get('tipo_retencion'),
                            'pdf_file':     medio.get('pdf_file'),
                            'registro_fc':  [registro.pk for registro in registros_fc]
                        }
                        retencion_serializer = RetencionSerializer(data=retencion_data)
                        if retencion_serializer.is_valid():
                            retencion_serializer.save()
                            retenciones.append(retencion_serializer.data)
                        else:
                            transaction.set_rollback(True)
                            return Response('Error de validación2: ' + str(retencion_serializer.errors), 
                                            status=status.HTTP_400_BAD_REQUEST)
                
                # Asociar registro con facturas y PERCS, acá se crea la relacion many to many
                monto = sum([medio['monto'] for medio in medios_pago])
                pago_factura_data = {
                    'documentos':       [documento.id for documento in documentos],
                    'registros_pago':   [registro['id'] for registro in registros_pago],
                    'registros_fc':     [registro_fc.pk for registro_fc in registros_fc],
                    'monto':            monto,
                    'fecha_pago':       datetime.now().isoformat()[0:10],
                    'op':               op
                }
                pago_factura_serializer = PagoFacturaSerializer(data=pago_factura_data)
                if pago_factura_serializer.is_valid():
                    pago = pago_factura_serializer.save()
                else:
                    transaction.set_rollback(True)
                    return Response('Error de validación1' + str(pago_factura_serializer.errors), 
                                    status=status.HTTP_400_BAD_REQUEST)

                # Actualizamos la fecha del registro para la factura pagada
                Registro.objects.filter(documento__id__in=[factura.id for factura in documentos]).filter(
                    Q(tipo_reg="FC") | Q(tipo_reg="PERCS")
                ).update(fecha_reg=medio['fecha'])
            
                # Actualizar estados de documentos
                for factura in documentos:
                    documento = Documento.objects.get(id=factura.id)
                    EstadoDocumento.objects.create(documento=documento, estado=3, usuario=request.user)
                return Response(PagoFacturaSerializer(pago).data['op'], status=status.HTTP_201_CREATED)
            else:
                return Response('Error de validación4: ' + str(serializer.errors), status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class TransferenciaMasivaPorArchivo(APIView):
    """
    **APIView** para exportar a partir de OPs un archivo .xlsx con el formato establecido por el banco para la carga masiva de transferencias.
    ## Métodos:
        get(request): Procesa la solicitud POST para generar un archivo de transferencia masiva.
    """
    permission_classes = [Administracion3]
    def get(self, request):
        try:
            op_id_array = request.query_params.get('op')
            if not op_id_array:
                return Response({'detail': 'Falta el id de la OP'}, status=status.HTTP_400_BAD_REQUEST)
            response_flags = []
            ops_id = [int(op_id) for op_id in op_id_array.split(',')]
            if len(ops_id) > 0:
                ops = Registro.objects.filter(id__in=ops_id)
                if len(ops) != len(ops_id):
                    return Response({'detail': 'Algunos de los ids de OP no existen'}, status=status.HTTP_400_BAD_REQUEST)
            # Generar el archivo de transferencia masiva con el encabezado
            wb = Workbook()
            ws = wb.active
            ws.append(['CUIL/CNPJ/CDI', 'CBU/CVU/ALIAS', 'DESCRIPCION DEL CONTACTO (MAXIMO 50 CARACTERES)', 'MONTO (SIN SEPARADORES DE MILES, CON SEPARADOR DECIMAL)', 'COMENTARIOS (OPCIONAL, MAXIMO 100 CARACTERES)', 'COMPROBANTE DE TRANSFERENCIA (OPCIONAL, INGRESE HASTA CINCO EMAILS A NOTIFICAR)'])
            for op in ops:
                proveedor: Persona = op.proveedor
                documentos = op.documento.all()
                if op.tipo_reg != 'OP':
                    return Response({'detail': 'El registro no es una OP'}, status=status.HTTP_400_BAD_REQUEST)
                if op.fecha_reg > datetime.now().date():
                    response_flags.append('La fecha de la OP es mayor a la fecha actual.')
                if not documentos:
                    response_flags.append('El registro no tiene documentos asociados.')
                if not proveedor:
                    response_flags.append('FATAL: El registro no tiene proveedor asociado.')
                    return Response({'detail': response_flags}, status=status.HTTP_400_BAD_REQUEST)
                if not proveedor.cnpj or not proveedor.cbu_alias or not (proveedor.razon_social or proveedor.nombre_fantasia):
                    response_flags.append('FATAL: El proveedor no tiene CNPJ cargado.')
                    return Response({'detail': response_flags}, status=status.HTTP_400_BAD_REQUEST)
                if not op.monto_op_rec:
                    response_flags.append('FATAL: El registro no tiene monto.')
                    return Response({'detail': response_flags}, status=status.HTTP_400_BAD_REQUEST)
                
                transferencia = {
                    'cnpj': str(proveedor.cnpj),
                    'CBU/Alias': proveedor.cbu_alias,
                    'descripcion': proveedor.razon_social or proveedor.nombre_fantasia,
                    'monto': abs(op.monto_op_rec),
                    'comentarios': ', '.join([f"{doc.tipo_documento.tipo_documento}{doc.serie}-{doc.numero}" for doc in op.documento.all()]),
                    'comprobante': ''
                }

                ws.append(transferencia[key] for key in transferencia.keys())

            # Create the HttpResponse object with appropriate headers
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename=transferencia_masiva.xlsx'
            wb.save(response)

            return response  # Devolver el archivo como respuesta
        
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
