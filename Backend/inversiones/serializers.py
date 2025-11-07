from .models import Inversor, PorcentajeInversion, AsientoInversor
from rest_framework import serializers
from django.db.models import Sum

class InversorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inversor
        fields = '__all__'

class PorcentajeInversionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PorcentajeInversion
        fields = '__all__'

    def validate(self, data):
        """
        Valido que la suma de porcentajes no supere el 100% para un mismo proyecto
        """
        proyecto = data.get('proyecto', getattr(self.instance, 'proyecto', None))
        porcentaje_nuevo = data.get('porcentaje', getattr(self.instance, 'porcentaje', 0)) # Usa 0 si no se provee
        if not proyecto:
            raise serializers.ValidationError("El proyecto es obligatorio.")
        
        # Obtengo la suma de los porcentajes existentes para el proyecto y excluyo el actual en caso de tratarse de un update
        queryset = PorcentajeInversion.objects.filter(proyecto=proyecto).exclude(id=self.instance.id if self.instance else None)

        # Sumo los porcentajes existentes (los del queryset)
        suma_porcentajes = queryset.aggregate(total=Sum('porcentaje'))['total'] or 0
        # Sumo el nuevo porcentaje
        suma_porcentajes += porcentaje_nuevo
        # Verifico que no supere el 100%
        if suma_porcentajes > 100:
            raise serializers.ValidationError("La suma de los porcentajes no puede superar el 100% para un mismo proyecto.")
        return data

class AsientoInversorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsientoInversor
        fields = '__all__'

class AsientoInversorListSerializer(serializers.ModelSerializer):
    inversor_nombre = serializers.CharField(source='inversor.nombre', read_only=True)
    registro_cliente_proyecto = serializers.CharField(source='registro.cliente_proyecto.cliente_proyecto', read_only=True)
    tipo_asiento_nombre = serializers.CharField(source='get_tipo_asiento_display', read_only=True)
    registro_id = serializers.IntegerField(source='registro.id', read_only=True)

    class Meta:
        model = AsientoInversor
        fields = ['id', 'fecha_carga', 'inversor', 'inversor_nombre', 'tipo_asiento', 'tipo_asiento_nombre', 'registro_cliente_proyecto', 'registro_id']
        #read_only_fields = ['id', 'fecha_carga', 'inversor_nombre', 'tipo_asiento_nombre', 'registro_cliente_proyecto']