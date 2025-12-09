from io import BytesIO
import os
import zipfile
from django.http import HttpResponse

from tesoreria.models import Caja, Registro
from tesoreria.models.pagos import PagoFactura
from .models import Documento, EstadoDocumento, Persona, UnidadDeNegocio, ClienteProyecto, Imputacion, TiposDocumento
from django.contrib.auth.models import Group, User
from rest_framework import permissions, viewsets
from .serializers import (GroupSerializer, UserSerializer, DocumentoSerializer, DocumentoCrudSerializer, EstadoDocumentoSerializer, 
                          TiposDocumentoSerializer, ImputacionSerializer, PersonaSerializer, UnidadDeNegocioSerializer, ClienteProyectoSerializer)
from rest_framework import status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.db import transaction
from django_filters import rest_framework as drf_filters

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Clase CustomTokenObtainPairView:
    Vista personalizada para obtener un par de tokens JWT (access y refresh).
    Al procesar una solicitud POST, genera los tokens y los almacena en cookies
    seguras y HTTP-only, facilitando la autenticación en futuras peticiones.
    """
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            tokens = response.data

            access_token = tokens['access']
            refresh_token = tokens['refresh']

            res = Response()
            res.data = {'success': True}
            
            # In your Django view
            res.set_cookie(
                key='access_token', 
                value=access_token, 
                httponly=True, 
                secure=False,  # Must be False if not using HTTPS
                samesite='Lax',  # 'Lax' or 'Strict' instead of 'None'
                path='/'
            )
            res.set_cookie(
                key='refresh_token', 
                value=refresh_token, 
                httponly=True, 
                secure=False, 
                samesite='Lax', 
                path='/'
            )


            return res
        except Exception as e:
            return Response({'success': False, 'error': str(e)})

class CustomTokenRefreshView(TokenRefreshView):
    """
    Vista personalizada para la renovación de tokens JWT.
    Esta clase hereda de TokenRefreshView y redefine el método POST para manejar la renovación
    del token de acceso utilizando un token de actualización almacenado en las cookies. 
    Funcionalidad:
    - Obtiene el token de actualización desde las cookies de la solicitud.
    - Clona los datos de la solicitud para evitar modificaciones directas.
    - Actualiza temporalmente los datos de la solicitud con el token de actualización.
    - Llama al método POST de la clase padre para procesar la renovación.
    - Si la renovación es exitosa, devuelve el nuevo token de acceso en la respuesta y lo
        establece como una cookie HTTP-only.
    - Maneja excepciones y devuelve una respuesta indicando el fallo en la renovación.
    Configuración de la cookie del token de acceso:
    - `httponly`: True para evitar el acceso mediante JavaScript.
    - `secure`: False (debería establecerse en True en producción con HTTPS).
    - `samesite`: 'Lax' para prevenir el envío de cookies en solicitudes cross-site.
    - `path`: '/' para que la cookie esté disponible en todo el sitio.
    """
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            # Clona los datos para evitar modificaciones directas en `request.data`
            request_data = request.data.copy()
            request_data['refresh'] = refresh_token

            # Actualiza `request.data` temporalmente para que el `super().post` lo reciba correctamente
            request._full_data = request_data
            response = super().post(request, *args, **kwargs)

            # Si el refresh es exitoso, devuelve el access token en `res.data` además de la cookie
            access_token = response.data.get('access')
            res = Response({'refreshed': True, 'access_token': access_token})
            res.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'
            )
            return res
        except Exception as e:
            return Response({'refreshed': False, 'error': str(e)})
        
@api_view(['POST'])
def logout(request):
    try:
        res = Response()
        res.delete_cookie('access_token', path='/', samesite='None', secure=True)
        res.delete_cookie('refresh_token', path='/', samesite='None', secure=True)
        res.data = {'success': True}
        return res
    except Exception as e:
        return Response({'success': False, 'error': str(e)})

class UserViewSet(viewsets.ModelViewSet):
    """
    Endpoint de la API para ver y editar los usuarios.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    """
    Endpoint de la API para ver y editar los grupos.
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class DocumentoActivoViewSet(generics.ListCreateAPIView):
    """
    Ednpoint de la API para listar y crear documentos activos, se usa solo para listar.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Documento.objects.filter(activo=True).order_by('-fecha_documento')
    serializer_class = DocumentoSerializer

class DocumentoImpagoViewSet(generics.ListCreateAPIView):
    """
    Ednpoint de la API para listar y crear documentos impagos, se usa solo para listar.  
    Filtra todos los documentos que no tengan una instancia de PagoFactura asociada.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    serializer_class = DocumentoSerializer
    search_fields = [
        'proveedor__razon_social', 'proveedor__cnpj', 'proveedor__nombre_fantasia',
        'receptor__razon_social', 'receptor__cnpj', 'receptor__nombre_fantasia',
        'unidad_de_negocio__unidad_de_negocio', 'cliente_proyecto__cliente_proyecto',
        'imputacion__imputacion', 'tipo_documento__tipo_documento', 'tipo_documento__letra',
        'concepto', 'fecha_documento', 'numero'
    ]
    queryset = Documento.objects.all().order_by('-id')

class DocumentoInactivoViewSet(generics.ListCreateAPIView):
    """Endpoint de la API para listar y crear documentos inactivos ("eliminados"), se usa solo para listar."""
    permission_classes = [permissions.IsAuthenticated]
    queryset = Documento.objects.filter(activo=False).order_by('-fecha_documento')
    serializer_class = DocumentoSerializer

class HistorialDocumento(APIView):
    """
    ## Clase HistorialDocumento  
    **APIView** para obtener el historial de estados de un documento.  
    ## Métodos:
        get(request, pk:int, format=None):
            Devuelve el historial de estados de un documento.
        get_historial(pk:int):
            Obtiene el historial de estados de un documento.
    ## Atributos:
        permission_classes (list): Clases de permisos necesarias para acceder a la vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    def get_historial(self,pk):
        try:
            return EstadoDocumento.objects.filter(documento__id=pk)
        except EstadoDocumento.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self,request,pk,format=None):
        historial = self.get_historial(pk)
        serializer = EstadoDocumentoSerializer(historial, many=True)
        return Response(serializer.data)
    
class PersonaDetail(generics.RetrieveUpdateDestroyAPIView):
    """APIView genérica para obtener, actualizar o eliminar un usuario"""
    queryset = Persona.objects.all().order_by('id')
    serializer_class = PersonaSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClienteProyectoDetail(generics.RetrieveUpdateDestroyAPIView):
    """APIView genérica para obtener, actualizar o eliminar un cliente/proyecto"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = ClienteProyecto.objects.all().order_by('id')
    serializer_class = ClienteProyectoSerializer

class DocumentoList(generics.ListCreateAPIView):
    """
    Vista para listar y crear documentos.
    Esta vista utiliza `generics.ListCreateAPIView` para proporcionar la operacion
    de listado. Requiere que el usuario esté autenticado.  
    ## Métodos:
        get(request): Devuelve una lista de todos los documentos.
        post(request): Crea un nuevo documento y sus registros asociados. Actualiza el saldo del presupuesto si es necesario.
    Attributes:
        permission_classes (list): Lista de clases de permisos requeridos para acceder a la vista.
        queryset (QuerySet): Conjunto de consultas que devuelve todos los objetos `Documento`.
        serializer_class (Serializer): Clase de serializador utilizada para la validación y deserialización de datos.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentoSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = {
        'proveedor__razon_social': ['icontains', 'isnull', 'exact'],
        'proveedor__cnpj': ['icontains', 'isnull', 'exact'],
        'proveedor__nombre_fantasia': ['icontains', 'isnull', 'exact'],
        'receptor__razon_social': ['icontains', 'isnull', 'exact'],
        'receptor__cnpj': ['icontains', 'isnull', 'exact'],
        'receptor__nombre_fantasia': ['icontains', 'isnull', 'exact'],
        'unidad_de_negocio__unidad_de_negocio': ['icontains', 'isnull', 'exact'],
        'cliente_proyecto__cliente_proyecto': ['icontains', 'isnull', 'exact'],
        'imputacion__imputacion': ['icontains', 'isnull', 'exact'],
        'tipo_documento__tipo_documento': ['icontains', 'isnull', 'exact'],
        'concepto': ['icontains', 'isnull', 'exact'],
        'fecha_documento': ['exact', 'isnull'],
    }
    search_fields = [
        'numero',
        'proveedor__razon_social', 'proveedor__cnpj', 'proveedor__nombre_fantasia',
        'receptor__razon_social', 'receptor__cnpj', 'receptor__nombre_fantasia',
        'unidad_de_negocio__unidad_de_negocio', 'cliente_proyecto__cliente_proyecto',
        'imputacion__imputacion', 'tipo_documento__tipo_documento',
        'concepto', 'fecha_documento'
    ]
    ordering_fields = search_fields + ['id', 'tipo_documento']

    def get_queryset(self):
        return Documento.objects.filter(activo=True).order_by('-fecha_documento', 'id')

    @transaction.atomic
    def post(self, request):
        """
        Maneja la solicitud POST para crear un nuevo documento y registrar su estado y detalles en la base de datos.
        Parameters:
            request (Request): La solicitud HTTP que contiene los datos del documento a crear.
        Returns:
            Response: Una respuesta HTTP con un diccionario que indica el éxito de la operación y el estado HTTP 201 si la creación 
            fue exitosa, o los errores de validación y el estado HTTP 400 si la validación falla.
        """
        serializer = DocumentoCrudSerializer(data=request.data)
        if serializer.is_valid():
            documento = serializer.save()
            EstadoDocumento.objects.create(documento=documento, estado=1, usuario=request.user)

            return Response(DocumentoSerializer(documento).data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentoDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Obtener, actualizar o eliminar un documento
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Documento.objects.all().order_by('id')
    serializer_class = DocumentoSerializer

    def get(self, request, *args, **kwargs):
        try:
            documento = self.get_object()
            return Response(DocumentoCrudSerializer(documento).data)
        except Exception as e:
            return Response({'success': False, 'error': str(e)})
        
    def patch(self, request, *args, **kwargs):
        try:
            documento = self.get_object()
            serializer = DocumentoCrudSerializer(documento, data=request.data, partial=True)
            if serializer.is_valid():
                documento = serializer.save()
                EstadoDocumento.objects.create(documento=documento, estado=2, usuario=request.user)
                return Response(DocumentoSerializer(documento).data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'success': False, 'error': str(e)})

    def delete(self, request, *args, **kwargs):
        try:
            documento: Documento = self.get_object()
            documento.delete(request.user)
            EstadoDocumento.objects.create(documento=documento, estado=4, usuario=request.user)
            return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'success': False, 'error': str(e)})

class ProveedorList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear personas 'Proveedor' activas.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PersonaSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = {
         'razon_social': ['icontains', 'isnull', 'exact'],
         'nombre_fantasia': ['icontains', 'isnull', 'exact'],
         'cnpj': ['icontains', 'isnull', 'exact']
    }
    search_fields = ['razon_social', 'nombre_fantasia', 'cnpj']
    queryset = Persona.objects.filter(proveedor_receptor=1, activo=True).order_by('id')

    def delete(self, request, *args, **kwargs):
        try:
            proveedor = self.get_object()
            proveedor.activo = False
            proveedor.save()
            return Response({'success': True})
        except Exception as e:
            return Response({'success': False, 'error': str(e)})
    
    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if 'cnpj' in request.data:
                cnpj = request.data['cnpj']
                proveedor_receptor = request.data.get('proveedor_receptor', 1)
                persona = Persona.objects.filter(cnpj=cnpj, proveedor_receptor=proveedor_receptor)
                if cnpj and persona.exists():
                    if persona.first().activo == True:
                        return Response({'success': False, 'message': 'Ya existe un proveedor con ese cnpj'}, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        persona.update(activo=True)
                        return Response({'success': True, 'message': 'Proveedor restaurado correctamente'}, status=status.HTTP_201_CREATED)

            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'success': False, 'error': str(e)})
        
class ReceptorList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear personas 'Receptor' activas.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PersonaSerializer  
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = {
         'razon_social': ['icontains', 'isnull', 'exact'],
         'nombre_fantasia': ['icontains', 'isnull', 'exact'],
         'cnpj': ['icontains', 'isnull', 'exact']
    }
    search_fields = ['razon_social', 'nombre_fantasia', 'cnpj']
    queryset = Persona.objects.filter(proveedor_receptor=2, activo=True).order_by('id')

class UnidadDeNegocioList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear instancias de 'UnidadDeNegocio'.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = UnidadDeNegocio.objects.all().order_by('id')
    serializer_class = UnidadDeNegocioSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = { 'unidad_de_negocio': ['icontains', 'isnull', 'exact'] }
    search_fields = ['unidad_de_negocio']

class ClienteProyectoList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear instancias activas de 'ClienteProyecto'.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClienteProyectoSerializer
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = { 'unidad_de_negocio__unidad_de_negocio': ['icontains', 'isnull', 'exact'], 'cliente_proyecto': ['icontains', 'isnull', 'exact'] }
    search_fields = ['unidad_de_negocio__unidad_de_negocio', 'cliente_proyecto']
    queryset = ClienteProyecto.objects.filter(activo=True).order_by('id')

class ImputacionList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear instancias de 'Imputacion'.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ImputacionSerializer
    queryset = Imputacion.objects.all().order_by('id')
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_fields = { 'imputacion': ['icontains', 'isnull', 'exact'] }
    search_fields = ['imputacion']

class TipoDocumentoList(generics.ListCreateAPIView):
    """
    Vista API para listar y crear instancias de 'TiposDocumento'.  
    Solo los usuarios autenticados pueden acceder a esta vista.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = TiposDocumento.objects.all().order_by('id')
    serializer_class = TiposDocumentoSerializer

class RestaurarDocumento(APIView):
    """
    **APIView** para restaurar un documento.  
    Esta vista permite a un usuario autenticado restaurar un documento específico. 
    Al restaurar, se establece el estado del documento como activo y se registra un nuevo estado en la tabla EstadoDocumento.  
    ## Métodos:
        put(request, pk:int, format=None): Restaura el documento identificado por la clave primaria proporcionada.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def put(self, request, pk, format=None):
        try:
            documento = Documento.objects.get(pk=pk)
            EstadoDocumento.objects.create(documento=documento, estado=5, usuario=request.user)
            documento.activo = True
            documento.save()
            return Response({'success': True})
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'success': False, 'error': str(e)})
        
class ExportarDocumentos(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        añomes = request.data.get('añomes', None)
        if not añomes:
            return Response(
                {"error": "El campo 'añomes' es obligatorio"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Aplicar filtros (ajusta según tu modelo)
            queryset = Documento.objects.filter(añomes_imputacion_contable=añomes, archivo__isnull=False, activo=True, receptor__razon_social="Quinto Diseño SRL")
            
            if not queryset.exists():
                return Response(
                    {"error": "No se encontraron documentos para el período especificado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Crear ZIP en memoria
            zip_buffer = BytesIO()
            files_added = 0
            errors = []
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for obj in queryset:
                    if obj.archivo:
                        try:
                            if obj.archivo.storage.exists(obj.archivo.name):
                                # Leer el archivo desde el storage
                                file_content = obj.archivo.read()
                                
                                # Añadir al ZIP
                                zip_file.writestr(obj.archivo.name, file_content)
                                files_added += 1
                                
                        except Exception as e:
                            errors.append(f"Error con archivo ID {obj.id}: {str(e)}")
                            continue
            
            if files_added == 0:
                return Response(
                    {"error": "No se encontraron archivos válidos para exportar"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            zip_buffer.seek(0)
            
            # Crear respuesta HTTP con el ZIP
            response = HttpResponse(
                zip_buffer.getvalue(),
                content_type='application/octet-stream'
            )
            
            # Nombre del archivo con timestamp
            from django.utils import timezone
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            filename = f"export_{timestamp}.zip"
            
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Length'] = len(zip_buffer.getvalue())
            response['Content-Transfer-Encoding'] = 'binary'
            response['Cache-Control'] = 'no-cache'
            
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Error interno: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class InformarPagoDocumento(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, format=None):
            try:
                documento_id = request.data.get('documento')
                fecha_pago = request.data.get('fecha')
                monto_pagado = request.data.get('monto')
                monto_retenido = request.data.get('monto_retenido', 0)
                caja = request.data.get('caja')

                documento = Documento.objects.get(id=documento_id)
                caja = Caja.objects.get(id=caja)

                registro_fc = documento.imputar(fecha_pago, monto_pagado + monto_retenido)
                registro_pago = self.crear_registro_pago(registro_fc, fecha_pago, monto_pagado, caja, documento)
                registro_retencion = self.crear_registro_retencion(registro_fc, fecha_pago, monto_retenido, caja, documento) if monto_retenido > 0 else None

                pago = PagoFactura.objects.create(
                    monto = monto_pagado,
                    fecha_pago = fecha_pago
                )
                pago.documentos.set([documento])
                pago.registros_fc.set([registro_fc])
                if registro_retencion:
                    pago.registros_pago.set([registro_retencion, registro_pago])
                else:
                    pago.registros_pago.set([registro_pago])

                EstadoDocumento.objects.create(documento=documento, estado=3, usuario=request.user)

                return Response({'success': True}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def crear_registro_pago(self, registro_fc, fecha_pago, monto_pagado, caja, documento):
        registro =  Registro.objects.create(
            tipo_reg = 'OP',
            fecha_reg = fecha_pago,
            añomes_imputacion = registro_fc.añomes_imputacion,
            proveedor = registro_fc.proveedor,
            observacion = registro_fc.observacion,
            monto_op_rec = -monto_pagado,
            moneda = caja.moneda,
            caja = caja
        )
        registro.documento.set([documento])
        return registro
    
    def crear_registro_retencion(self, registro_fc, fecha_pago, monto_retenido, caja, documento):
        registro =  Registro.objects.create(
            tipo_reg = 'RETH',
            fecha_reg = fecha_pago,
            añomes_imputacion = registro_fc.añomes_imputacion,
            proveedor = registro_fc.proveedor,
            observacion = f"Retención de {documento.tipo_documento} {documento.serie}-{documento.numero}",
            monto_op_rec = -monto_retenido,
            moneda = caja.moneda,
            caja = caja
        )
        registro.documento.set([documento])
        return registro

