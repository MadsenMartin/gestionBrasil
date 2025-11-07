
## Models

### Tesorería

El modelo **`PlantillaRegistro`** almacena registros genéricos para agilizar la carga a futuro.  
```python
class PlantillaRegistro(models.Model):
    nombre = models.CharField(max_length=50)
    tipo_reg = models.CharField(max_length=5, choices=RegistroAbstracto.TIPO_REG_CHOICES)
    unidad_de_negocio = models.ForeignKey('iva.UnidadDeNegocio', on_delete=models.DO_NOTHING, null=True, blank=True)
    cliente_proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING, null=True, blank=True)
    imputacion = models.ForeignKey('iva.Imputacion', on_delete=models.DO_NOTHING, null=True, blank=True)
    proveedor = models.ForeignKey('iva.Persona', on_delete=models.DO_NOTHING, null=True, blank=True)
    observacion = models.TextField(null=True, blank=True)
```
Por ejemplo, la plantilla "Almuerzo" tiene los siguientes valores:
```JSON
{
    "nombre": "Almuerzo",
    "tipo_reg": "PSF",
    "unidad_de_negocio": 1, // Oficina por ejemplo
    "cliente_proyecto": 2, // Indirectos
    "imputacion": 3, // Otros gastos oficina
    "proveedor": 4, // Carla almuerzos estudio
    "observacion": ""
}
```

De esta forma, al querer cargar un registro de estos podemos buscar la plantilla por nombre y que los campos se asignen automáticamente en el formulario de carga.

## Serializers

Un serializador es una clase que recibe una o varias instancias de un modelo y las convierte en representaciones JSON y viceversa.

### Tesorería

El **`RegistroCrudSerializer`** es un `serializers.ModelSerializer`, por lo que es un serializador genérico que devuelve en formato JSON la información tal como se ve en la base de datos.  
Únicamente se sobreescribe el método ***save()***

**Métodos**:
- **save()**: aplica la lógica de tipo de cambio y crea los registros correspondientes.  
```python
class RegistroCrudSerializer(serializers.ModelSerializer):

    class Meta:
        model= Registro
        fields = "__all__"
        
    def save(self, **kwargs):
        validated_data = aplicar_logica_tipo_cambio(self.validated_data)
        self.validated_data.update(validated_data)
        
        instance = super().save(**kwargs)

        return instance
```

El **`RegistroSerializer`** muestra los slug de los campos relacionados en lugar de los ids.  
Ej: recibe un registro con proveedor=5 y devuelve JSON con proveedor=Ramón Benitez Enciso.  
Se usa para mostrar al usuario los datos del registro.

**Métodos**:
- **save()**: aplica la lógica de tipo de cambio y crea los registros correspondientes.  

```python
class RegistroSerializer(serializers.ModelSerializer):

    caja = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    documento = serializers.PrimaryKeyRelatedField(queryset=Documento.objects.all(), many=True, required=False, allow_null=True)
    certificado = serializers.SlugRelatedField(slug_field='id', queryset=CertificadoObra.objects.all(), required=False, allow_null=True)
    unidad_de_negocio = serializers.SlugRelatedField(slug_field='unidad_de_negocio', queryset=UnidadDeNegocio.objects.all(), required=False, allow_null=True)
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all(), required=False, allow_null=True)
    proveedor = serializers.CharField(source="proveedor.nombre", read_only=True)
    caja_contrapartida = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all(), required=False, allow_null=True)
    imputacion = serializers.SlugRelatedField(slug_field='imputacion', queryset=Imputacion.objects.all(), required=False)
    presupuesto = serializers.StringRelatedField(required=False, allow_null=True)
    observacion = serializers.CharField(required=False, allow_null=True)
    realizado = serializers.BooleanField(default=False)
    tipo_de_cambio = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_gasto_ingreso = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    # Campo para exponer el saldo acumulado (solo lectura)
    saldo_acumulado = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    dolar_mep_value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    total_gasto_ingreso_usd = serializers.SerializerMethodField(
        read_only=True
    )
    monto_op_rec_usd = serializers.SerializerMethodField(
        read_only=True
    )

    def get_total_gasto_ingreso_usd(self, obj):
        if obj.moneda == 2:
            return (float(obj.total_gasto_ingreso) or 0.00) / (float(obj.tipo_de_cambio) or 1.00)
        return 0.00
    
    def get_monto_op_rec_usd(self, obj):
        if obj.moneda == 2:
            return (float(obj.monto_op_rec) or 0.00) / (float(obj.tipo_de_cambio) or 1.00)
        return 0.00

    class Meta:
        model = Registro
        fields = ["id","tipo_reg","caja", "certificado","documento","fecha_reg","añomes_imputacion","unidad_de_negocio","cliente_proyecto",
                  "proveedor","caja_contrapartida","imputacion","presupuesto","observacion","monto_gasto_ingreso_neto","iva_gasto_ingreso",
                  "total_gasto_ingreso", "total_gasto_ingreso_usd", "monto_op_rec", "monto_op_rec_usd", "moneda","tipo_de_cambio", "realizado", "saldo_acumulado",
                    "dolar_mep_value"]
    
    def save(self, **kwargs):
        validated_data = aplicar_logica_tipo_cambio(self.validated_data, False)
        self.validated_data.update(validated_data)
        instance = super().save(**kwargs)
        return instance
```
  
    

El **`RegistroListSerializer`** es un serializer que hereda de `RegistroSerializer` y añade campos calculados adicionales para mostrar en la lista de registros (método GET de la APIView `RegistroList`).

***Campos adicionales***:
- **saldo_acumulado**: saldo acumulado de la caja, solo lectura, se obtiene de la vista RegistroList a través del la clase Window.  
- **total_gasto_ingreso_usd** (*SerializersMethodField*): suma de monto_gasto_ingreso_neto + iva_gasto_ingreso - monto_op_rec.  
- **monto_op_rec_usd** (*SerializersMethodField*): monto_op_rec en USD, solo lectura, se usa en los reportes. 
- **dolar_mep_value** *SerializersDecimalField*: valor del dolar MEP para la fecha del registro, solo lectura, se usa en los reportes. 

**Métodos**:
- **get_total_gasto_ingreso_usd**: calcula el total_gasto_ingreso_usd.  
- **get_monto_op_rec_usd**: calcula el monto_op_rec_usd.

```python
class RegistroListSerializer(RegistroSerializer):

    # Campo para exponer el saldo acumulado (solo lectura)
    saldo_acumulado = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    dolar_mep_value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    total_gasto_ingreso_usd = serializers.SerializerMethodField(
        read_only=True
    )
    monto_op_rec_usd = serializers.SerializerMethodField(
        read_only=True
    )

    def convertir_a_usd(self, value, obj):
        if value and float(value) != 0:
            value_float = float(value)
            moneda = obj.moneda
            tipo_de_cambio = float(obj.tipo_de_cambio) or 0
            dolar_mep_value = float(obj.dolar_mep_value) or 0

            if moneda == 2:  # USD
                if tipo_de_cambio and tipo_de_cambio > 1:
                    return value_float / tipo_de_cambio
                elif dolar_mep_value and dolar_mep_value > 1:
                    return value_float / dolar_mep_value
            elif moneda == 1 and dolar_mep_value:  # ARS
                return value_float / dolar_mep_value

        return 0.00

    def get_total_gasto_ingreso_usd(self, obj):
        return self.convertir_a_usd(obj.total_gasto_ingreso, obj)
    
    def get_monto_op_rec_usd(self, obj):
        return self.convertir_a_usd(obj.monto_op_rec, obj)

    class Meta:
        model = Registro
        fields = ["id","tipo_reg","caja", "certificado","documento","fecha_reg","añomes_imputacion","unidad_de_negocio","cliente_proyecto",
                  "proveedor","caja_contrapartida","imputacion","presupuesto","observacion","monto_gasto_ingreso_neto","iva_gasto_ingreso",
                  "total_gasto_ingreso", "total_gasto_ingreso_usd", "monto_op_rec", "monto_op_rec_usd", "moneda","tipo_de_cambio", "realizado", "saldo_acumulado",
                    "dolar_mep_value"]
```
