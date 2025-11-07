from rest_framework import viewsets, filters
from .models import Municipio, Moneda
from .serializers import MunicipioSerializer, MonedaSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions

class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['id', 'nombre']
    search_fields = ['nombre']
    ordering_fields = ['id', 'nombre']
    ordering = ['id']
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.activo = False
        instance.save()

class MunicipioViewSet(SoftDeleteModelViewSet):
    queryset = Municipio.objects.all()
    serializer_class = MunicipioSerializer

class MonedaViewSet(SoftDeleteModelViewSet):
    queryset = Moneda.objects.all()
    serializer_class = MonedaSerializer
