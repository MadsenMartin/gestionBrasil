from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime
from django.db import transaction
from django_filters import rest_framework as drf_filters
from django_filters import FilterSet

from ..models import Presupuesto, DbPresupuestosV2, EstadoPresupuesto, Comentario, Registro
from ..models.archivos import Archivo
from ..serializers import (
    PresupuestoSerializer, PresupuestoListSerializer, PresupuestoViewSerializer,
    EstadoPresupuestoCreateSerializer, EstadoPresupuestoSerializer,
    ComentarioSerializer, ConsumoPresupuestoSerializer, RegistroSerializer
)
from ..serializers.archivos import ArchivoSerializer
from ..permisos import Administracion3, Administracion2
from tesoreria.mails import mail_mencion_comentario_presupuesto
from django.contrib.auth.models import User
import threading


class DbPresupuestosV2FilterSet(FilterSet):
    """Filtro específico para la vista de lista que usa DbPresupuestosV2"""
    class Meta:
        model = DbPresupuestosV2
        fields = {
            'id': ['exact'],
            'proveedor_id': ['exact'],
            'monto': ['exact', 'gte', 'lte'],
            'estado': ['exact', 'in'],
            'fecha': ['exact', 'gte', 'lte'],
            'cliente_proyecto_id': ['exact'],
            'observacion': ['exact', 'icontains', 'isnull'],
            'proveedor': ['exact', 'icontains', 'isnull'],
            'cliente_proyecto': ['exact', 'icontains', 'isnull'],
            'saldo': ['exact', 'gte', 'lte'],
            'aprobado': ['exact', 'in'],
        }


class PresupuestoFilterSet(FilterSet):
    """Filtro específico para operaciones que usan el modelo Presupuesto"""
    class Meta:
        model = Presupuesto
        fields = {
            'proveedor_id': ['exact'],
            'monto': ['exact', 'gte', 'lte'],
            'estado': ['exact', 'in'],
            'fecha': ['exact', 'gte', 'lte'],
            'cliente_proyecto_id': ['exact'],
            'observacion': ['exact', 'icontains', 'isnull'],
            'proveedor__razon_social': ['exact', 'icontains'],
            'proveedor__nombre_fantasia': ['exact', 'icontains'],
            'cliente_proyecto__cliente_proyecto': ['exact', 'icontains'],
            'aprobado': ['exact', 'in'],
        }


class PresupuestoListView(generics.ListCreateAPIView):
    """
    Vista dedicada para listar y crear presupuestos usando DbPresupuestosV2 para GET
    y Presupuesto para POST.
    """
    permission_classes = [Administracion3]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, drf_filters.DjangoFilterBackend]
    filterset_class = DbPresupuestosV2FilterSet
    
    # Campos de búsqueda específicos para DbPresupuestosV2 (excluye 'estado' porque es entero)
    search_fields = ['fecha', 'proveedor', 'cliente_proyecto', 'observacion']
    
    # Campos de ordenación
    ordering_fields = ['fecha', 'proveedor', 'cliente_proyecto', 'observacion', 'monto', 'saldo', 'estado', 'aprobado']
    ordering = ['-id']  # Ordenación por defecto

    def get_queryset(self):
        """Aplica filtros y devuelve el queryset optimizado"""
        queryset = DbPresupuestosV2.objects.all()
        return queryset.order_by('-id')

    def get_serializer_class(self):
        """Usa diferentes serializers según el método HTTP"""
        if self.request.method == 'GET':
            return PresupuestoListSerializer
        return PresupuestoSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Sobrescribe el método de creación para:
        1. Crear el Presupuesto.
        2. Registrar el EstadoPresupuesto inicial (estado=1).
        3. Devolver el nuevo registro con el serializer de lectura.
        """
        try:
            # Para validar la data "de entrada", usamos el serializer de escritura
            write_serializer = PresupuestoSerializer(data=request.data)
            write_serializer.is_valid(raise_exception=True)

            # Creamos el presupuesto con los datos validados
            presupuesto = write_serializer.save()

            # Creamos el estado inicial (Cargado)
            EstadoPresupuesto.objects.create(
                presupuesto=presupuesto,
                estado=1,
                usuario=request.user,
                fecha=datetime.now()
            )

            # Para la respuesta, utilizamos el serializer de lectura
            read_serializer = PresupuestoViewSerializer(presupuesto)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PresupuestoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista dedicada para ver, actualizar y eliminar presupuestos individuales"""
    permission_classes = [Administracion3]
    serializer_class = PresupuestoSerializer
    queryset = Presupuesto.objects.filter(activo=True)
    filter_backends = [drf_filters.DjangoFilterBackend]
    filterset_class = PresupuestoFilterSet

    def get_serializer_class(self):
        """Usa diferentes serializers según el método HTTP"""
        if self.request.method == 'GET':
            return PresupuestoViewSerializer
        return PresupuestoSerializer

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        Sobrescribe el método de actualización para:
        1. Validar la data de entrada.
        2. Registrar cambio de estado si el monto cambió.
        3. Devolver el registro actualizado con el serializer de lectura.
        """
        try:
            # Obtenemos la instancia a modificar
            presupuesto = self.get_object()

            # Validamos la data de entrada
            write_serializer = PresupuestoSerializer(presupuesto, data=request.data, partial=True)
            write_serializer.is_valid(raise_exception=True)

            # Registramos cambio de estado si el monto cambió
            if 'monto' in request.data:
                monto_anterior = presupuesto.monto
                presupuesto = write_serializer.save()
                EstadoPresupuesto.objects.create(
                    presupuesto=presupuesto,
                    estado=5,
                    usuario=request.user,
                    observacion=f'Monto actualizado de ${float(monto_anterior):,} a ${float(presupuesto.monto):,}',
                    fecha=datetime.now()
                )
            else:
                presupuesto = write_serializer.save()

            # Devolvemos el registro actualizado con el serializer de lectura
            read_serializer = PresupuestoViewSerializer(presupuesto)
            return Response(read_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Borrado lógico: marcamos el presupuesto como inactivo (activo=False)
        y registramos un nuevo estado (Eliminado).
        """
        try:
            # 'get_object()' obtiene la instancia en función del pk en la URL
            presupuesto = self.get_object()
            presupuesto.activo = False
            presupuesto.estado = 101
            presupuesto.save()

            # Registramos el estado "101" (eliminado)
            EstadoPresupuesto.objects.create(
                presupuesto=presupuesto,
                estado=101,
                usuario=request.user,
                observacion=request.data.get('observacion', ''),
                fecha=datetime.now()
            )
            return Response(
                {'detail': 'Presupuesto eliminado (soft-delete) correctamente'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CargaArchivoPresupuesto(APIView):
    """Vista para cargar archivos a un presupuesto"""
    permission_classes = [Administracion3]

    @transaction.atomic
    def post(self, request):
        try:
            archivo = request.FILES.get('archivo')
            descripcion = request.data.get('descripcion')
            if not archivo:
                return Response({'detail': 'No cargó ningún archivo'}, status=status.HTTP_400_BAD_REQUEST)

            # Cargarlo en el presupuesto
            presupuesto_id = request.POST.get('presupuesto')
            if presupuesto_id:
                presupuesto_instancia = Presupuesto.objects.filter(id=presupuesto_id).first()
                if not presupuesto_instancia:
                    return Response({'error': 'Presupuesto no encontrado'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'ID de presupuesto requerido'}, status=status.HTTP_400_BAD_REQUEST)

            archivo_obj = Archivo.objects.create(
                archivo=archivo, 
                descripcion=descripcion, 
                usuario=request.user.username
            )
            presupuesto_instancia.archivos.add(archivo_obj)
            presupuesto_instancia.save()
            
            return Response({'detail': 'Archivo cargado correctamente'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ComentarioPresupuesto(APIView):
    """Vista para manejar comentarios de presupuestos"""
    permission_classes = [Administracion3, permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        try:
            comentario_texto = request.data.get('comentario')
            presupuesto_id = request.data.get('presupuesto_id')

            if not comentario_texto or not presupuesto_id:
                return Response(
                    {"error": "Comentario y presupuesto_id son requeridos"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear el comentario
            comentario = Comentario.objects.create(
                comentario=comentario_texto,
                usuario=request.user
            )

            # Link the comment to the specified presupuesto
            presupuesto = Presupuesto.objects.get(id=presupuesto_id)
            presupuesto.comentarios.add(comentario)

            # Process mentions (e.g., words starting with '@')
            for word in comentario_texto.split():
                if word.startswith("@"):
                    username = word[1:]  # Extract the username by removing '@'
                    try:
                        mentioned_user = User.objects.get(username=username)
                        # Create a notification for the mentioned user
                        from ..models import Notificacion
                        Notificacion.objects.create(
                            usuario=mentioned_user,
                            mensaje=f"{comentario.usuario} te mencionó en un comentario en el presupuesto {presupuesto}"
                        )

                        # Iniciar un hilo para enviar los correos en segundo plano
                        thread = threading.Thread(
                            target=mail_mencion_comentario_presupuesto, 
                            args=(mentioned_user, comentario, presupuesto)
                        )
                        thread.daemon = True
                        thread.start()

                    except User.DoesNotExist:
                        # User does not exist, skip or handle accordingly
                        pass

            return Response({"mensaje": "Comentario agregado exitosamente"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        presupuesto_id = request.query_params.get('presupuesto_id')
        if not presupuesto_id:
            return Response({"error": "presupuesto_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        presupuesto = Presupuesto.objects.get(id=presupuesto_id)
        comentarios = presupuesto.comentarios.all()
        serializer = ComentarioSerializer(comentarios, many=True)
        return Response(serializer.data)


class ActividadPresupuesto(APIView):
    """Vista para obtener la actividad completa de un presupuesto"""
    permission_classes = [Administracion3]

    def get(self, request):
        presupuesto_id = request.query_params.get('presupuesto_id')
        if not presupuesto_id:
            return Response({"error": "presupuesto_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener la instancia del presupuesto
        presupuesto = Presupuesto.objects.get(id=presupuesto_id)

        # Obtener consumos
        consumos = Registro.objects.filter(presupuesto=presupuesto_id)
        consumos_data = ConsumoPresupuestoSerializer(consumos, many=True).data
        for consumo in consumos_data:
            consumo['accion'] = f'Consumo de ${float(consumo["total"]):,} desde registro {consumo["id"]}'
            consumo['fecha'] = consumo['fecha_reg']

        # Obtener comentarios
        comentarios = presupuesto.comentarios.all()
        comentarios_data = ComentarioSerializer(comentarios, many=True).data
        
        # Obtener estados
        estados = EstadoPresupuesto.objects.filter(presupuesto=presupuesto)
        estados_data = EstadoPresupuestoSerializer(estados, many=True).data
        if estados_data:
            for estado in estados_data:
                estado['accion'] = f"Cambió el estado a {estado['estado']}"
            estados_data[0]['accion'] = 'Cargó el presupuesto'

        # Obtener archivos
        archivos = presupuesto.archivos.all()
        archivos_data = ArchivoSerializer(archivos, many=True).data
        for archivo in archivos_data:
            editado = 'fecha_edicion' in archivo and archivo['fecha_edicion'] is not None
            archivo['accion'] = f'Archivo {"editado" if editado else "cargado"} por {archivo["usuario"]}'
            archivo['fecha'] = archivo['fecha_edicion'] if editado else archivo['fecha_subida']

        # Combinar y ordenar actividades
        actividad_list = comentarios_data + estados_data + consumos_data + archivos_data
        actividad_list.sort(
            key=lambda x: x.get('fecha') or x.get('fecha_edicion') or x.get('fecha_subida') or '', 
            reverse=False
        )

        return Response(actividad_list)


class EstadoPresupuestoCreateView(generics.CreateAPIView):
    """Vista para crear nuevos estados de presupuesto"""
    permission_classes = [Administracion2]
    serializer_class = EstadoPresupuestoCreateSerializer

    @transaction.atomic
    def post(self, request):
        try:
            serializer = EstadoPresupuestoCreateSerializer(data=request.data)
            if serializer.is_valid():
                estado_presupuesto_data = {
                    'presupuesto': serializer.validated_data['presupuesto'],
                    'estado': serializer.validated_data['estado'],
                    'usuario': request.user,
                    'fecha': datetime.now(),
                }
                estado_presupuesto = EstadoPresupuesto.objects.create(**estado_presupuesto_data)
                serializer.validated_data['presupuesto'].estado = estado_presupuesto.estado

                if serializer.validated_data['estado'] == 2:
                    serializer.validated_data['presupuesto'].aprobado = 2
                elif serializer.validated_data['estado'] == 99:
                    serializer.validated_data['presupuesto'].aprobado = 3
                    
                serializer.validated_data['presupuesto'].save()
                return Response(
                    EstadoPresupuestoSerializer(estado_presupuesto).data, 
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EstadoPresupuestoChoicesList(APIView):
    """Vista para obtener las opciones de estado de presupuesto"""
    permission_classes = [Administracion3, permissions.IsAuthenticated]

    def get(self, request):
        return Response(EstadoPresupuesto.estado_presupuesto_choices)


class HistorialPresupuesto(APIView):
    """Vista para obtener el historial de estados de un presupuesto"""
    permission_classes = [Administracion3, permissions.IsAuthenticated]

    def get_historial(self, pk):
        try:
            return EstadoPresupuesto.objects.filter(presupuesto__id=pk)
        except EstadoPresupuesto.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def get(self, request, pk, format=None):
        historial = self.get_historial(pk)
        serializer = EstadoPresupuestoSerializer(historial, many=True)
        return Response(serializer.data)


class ListadoConsumosPresupuesto(APIView):
    """Vista para listar los consumos de un presupuesto"""
    permission_classes = [Administracion3]

    def get(self, request):
        presupuesto_id = request.query_params.get('presupuesto')
        if not presupuesto_id:
            return Response({'detail': 'Debe especificar un presupuesto'}, status=status.HTTP_400_BAD_REQUEST)
        
        consumos = Registro.objects.filter(presupuesto=presupuesto_id).order_by('fecha_reg')
        from ..serializers import RegistroSerializer
        serializer = RegistroSerializer(consumos, many=True)
        return Response(serializer.data)

class ListadoConsumosFueraPresupuesto(APIView):
    """Vista para listar los consumos que coinciden con el proveedor y cliente/proyecto de un presupuesto pero están fuera del mismo"""
    permission_classes = [Administracion3]

    def get(self, request):
        presupuesto_id = request.query_params.get('presupuesto')
        if not presupuesto_id:
            return Response({'detail': 'Debe especificar un presupuesto'}, status=status.HTTP_400_BAD_REQUEST)

        presupuesto = Presupuesto.objects.get(id=presupuesto_id)
        consumos = Registro.objects.filter(proveedor=presupuesto.proveedor, cliente_proyecto=presupuesto.cliente_proyecto).exclude(presupuesto=presupuesto_id).order_by('fecha_reg')
        serializer = RegistroSerializer(consumos, many=True)
        return Response(serializer.data)
