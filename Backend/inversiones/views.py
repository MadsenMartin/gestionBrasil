from .models import Inversor, PorcentajeInversion, AsientoInversor
from .serializers import InversorSerializer, PorcentajeInversionSerializer, AsientoInversorSerializer, AsientoInversorListSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework import filters, status
from django_filters import rest_framework as drf_filters
from rest_framework.response import Response

class InversorViewSet(viewsets.ModelViewSet):
    queryset = Inversor.objects.all().order_by('-id')
    serializer_class = InversorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, drf_filters.DjangoFilterBackend]
    search_fields = ['nombre']
    filterset_fields = ['nombre']
    ordering_fields = ['nombre']

class PorcentajeInversionViewSet(viewsets.ModelViewSet):
    queryset = PorcentajeInversion.objects.all().order_by('-id')
    serializer_class = PorcentajeInversionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, drf_filters.DjangoFilterBackend]
    fields = ['inversor__nombre', 'proyecto__cliente_proyecto', 'porcentaje']
    search_fields = fields
    filterset_fields = fields
    ordering_fields = fields

class AsientoInversorViewSet(viewsets.ModelViewSet):
    queryset = AsientoInversor.objects.all().order_by('-id')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, drf_filters.DjangoFilterBackend]
    fields = ['inversor__nombre', 'registro__cliente_proyecto__cliente_proyecto', 'tipo_asiento']
    search_fields = fields
    filterset_fields = fields + ['registro']
    ordering_fields = fields

    def get_serializer_class(self):
        if self.action == 'list':
            return AsientoInversorListSerializer
        else: 
            return AsientoInversorSerializer 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Usar el serializer de lista para la respuesta
        response_serializer = AsientoInversorListSerializer(instance)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        
        # Usar el serializer de lista para la respuesta
        response_serializer = AsientoInversorListSerializer(updated_instance)
        return Response(response_serializer.data, status=status.HTTP_200_OK)