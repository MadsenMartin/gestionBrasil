from .models import Municipio, Moneda
from rest_framework.serializers import ModelSerializer

class MunicipioSerializer(ModelSerializer):
    class Meta:
        model = Municipio
        fields = '__all__'

class MonedaSerializer(ModelSerializer):
    class Meta:
        model = Moneda
        fields = '__all__'