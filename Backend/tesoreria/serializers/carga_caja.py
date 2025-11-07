from rest_framework import serializers
from iva.models import ClienteProyecto, Imputacion, UnidadDeNegocio
from tesoreria.models import Caja

class MovimientoCajaSerializer(serializers.Serializer):
    """
    Serializer para la carga masiva de registros de caja.
    """

    TIPO_REG_CHOICES = [
        "PSF", "OP", "OPFC", "FCV", "REC", "ISF", "MC", "FC"
    ]

    fecha = serializers.DateField(required=True)
    tipo_reg = serializers.ChoiceField(choices=TIPO_REG_CHOICES)
    nombre = serializers.CharField(required=False, allow_blank=True)
    unidad_de_negocio = serializers.SlugRelatedField(slug_field='unidad_de_negocio', queryset=UnidadDeNegocio.objects.filter(activo=True), required=False, allow_null=True)
    obra = serializers.SlugRelatedField(slug_field='cliente_proyecto__iexact', queryset=ClienteProyecto.objects.filter(activo=True), required=False, allow_null=True)
    imputacion = serializers.SlugRelatedField(slug_field='imputacion', queryset=Imputacion.objects.filter(activo=True), required=False, allow_null=True)
    observacion = serializers.CharField(allow_blank=True, required=False)
    entrada = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    salida = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    neto = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    iva = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    presupuesto = serializers.CharField(required=False)
    tipo_de_cambio = serializers.DecimalField(max_digits=10, decimal_places=4, required=False, default=1.0)

    def validate(self, data):
        super().validate(data)
        if not data.get('entrada') and not data.get('salida') and not data.get('neto') and not data.get('iva'):
            raise serializers.ValidationError("Debe proporcionar al menos un monto de entrada, salida, iva o neto.")
        if (data.get('entrada') or data.get('salida')) and (data.get('neto') or data.get('iva')):
            raise serializers.ValidationError("No se puede proporcionar simultáneamente un monto de entrada o salida y un monto de iva o neto.")
        return data

class CargaCajaSerializer(serializers.Serializer):
    """
    Serializer para la carga masiva de registros de caja.
    """

    movimientos = MovimientoCajaSerializer(many=True)
    caja = serializers.PrimaryKeyRelatedField(queryset=Caja.objects.filter(activo=True), required=True)
    flag_crear_proveedor = serializers.BooleanField(default=False, required=False)

        
