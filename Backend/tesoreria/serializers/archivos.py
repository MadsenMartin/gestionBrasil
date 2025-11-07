from rest_framework import serializers
from tesoreria.models.archivos import Archivo

class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = "__all__"