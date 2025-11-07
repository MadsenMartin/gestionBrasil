from django.contrib.auth.models import Group, User
from rest_framework import serializers
from .models import Documento, EstadoDocumento, TiposDocumento, Persona, Imputacion, UnidadDeNegocio, ClienteProyecto
from tesoreria.models import Registro
from tesoreria.models import Presupuesto

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']

class EstadoDocumentoSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField('get_estado_display')
    usuario = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all())

    def get_estado_display(self, obj):
        return EstadoDocumento.ESTADOS_CHOICES[obj.estado-1][1]

    class Meta:
        model = EstadoDocumento
        fields = "__all__"

class PersonaSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField(source='get_nombre', read_only=True)
    #cnpj = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    class Meta:
        model = Persona
        fields = "__all__"

    def get_nombre(self, obj):
        return obj.__str__()
    
class UnidadDeNegocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadDeNegocio
        fields = "__all__"

class ClienteProyectoSerializer(serializers.ModelSerializer):
    nombre = serializers.CharField(source='cliente_proyecto')
    class Meta:
        model = ClienteProyecto
        fields = "__all__"

class ImputacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imputacion
        fields = "__all__"

class TiposDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TiposDocumento
        fields = "__all__"

class RegistroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registro
        fields = "__all__"

class DocumentoCrudSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = "__all__"

    def create(self, validated_data):
        # Sobrescribo este método por un problema de que al crear un documento a través del serializer,
        # si el campo 'activo' no está en los valores recibidos, DRF asume el comportamiento de los formularios HTML, donde
        # un checkbox desmarcado no envía su valor y lo pone en False,
        # más allá de que el campo esté definido como default=True en el modelo.
        # Esto es un problema porque todo documento se debería cargar como activo por default.
        if 'activo' not in self.initial_data:
            validated_data.pop('activo', None)
        return super().create(validated_data)

class DocumentoSerializer(DocumentoCrudSerializer):
    tipo_documento = serializers.SlugRelatedField(slug_field='tipo_documento', queryset=TiposDocumento.objects.all())
    receptor = serializers.CharField(source="receptor.nombre", read_only=True)
    proveedor = serializers.CharField(source="proveedor.nombre", read_only=True)
    imputacion = serializers.SlugRelatedField(slug_field='imputacion', queryset=Imputacion.objects.all(), required=False)
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all(), required=False)
    unidad_de_negocio = serializers.SlugRelatedField(slug_field='unidad_de_negocio', queryset=UnidadDeNegocio.objects.all(), required=False)
