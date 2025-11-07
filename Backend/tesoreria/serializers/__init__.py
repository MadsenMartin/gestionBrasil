from rest_framework import serializers
from ..models import Registro, Caja, PagoFactura, Retencion, SaldoCaja, Echeq, CertificadoObra, Presupuesto, DbPresupuestosV2, EstadoPresupuesto, Comentario, Notificacion, DolarMEP, ConciliacionCaja, Tarea, PlantillaRegistro
from iva.models import Documento, Imputacion, UnidadDeNegocio, ClienteProyecto, Persona
from iva.serializers import DocumentoSerializer
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.exceptions import ValidationError

class SaldoCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaldoCaja
        fields = "__all__"

def crear_registro(reg_data: dict, list_bool: bool) -> None:
    # Si el serializer es RegistroSerializer, se crea el registro con el serializer, ya que reg_data tiene ids en los campos de ForeignKey, y debe convertirlos en instancias
    if not list_bool:
        reg_serializer = RegistroSerializer(data=reg_data)
        if reg_serializer.is_valid():
            reg_serializer.save()
        else:
            transaction.set_rollback(True)
            raise ValidationError(reg_serializer.errors)
        
    # Si el serializer es RegistroCrudSerializer, se crea el registro directamente desde el modelo, ya que reg_data tiene instancias en todos los campos de ForeignKey
    else:
        Registro.objects.create(**reg_data)

def convertir_a_ars(validated_data: dict, tc_reg: float) -> dict:
    if validated_data.get('monto_gasto_ingreso_neto') is not None:
        validated_data['monto_gasto_ingreso_neto'] = tc_reg * float(validated_data['monto_gasto_ingreso_neto'])
    if validated_data.get('iva_gasto_ingreso') is not None:
        validated_data['iva_gasto_ingreso'] = tc_reg * float(validated_data['iva_gasto_ingreso'])
    if validated_data.get('monto_op_rec') is not None:
        validated_data['monto_op_rec'] = tc_reg * float(validated_data['monto_op_rec'])

@transaction.atomic
def aplicar_logica_tipo_cambio(validated_data: dict, list_bool: bool = True) -> tuple:
    '''
    Método que verifica si corresponde aplicar la lógica de diferencia de cambio, y en caso afirmativo, crea el/los registro/s correspondiente/s.
    '''
    try:
        # Verificamos si corresponde aplicar la lógica
        if validated_data.get('tipo_de_cambio') not in [1, None] and (validated_data.get('imputacion') and validated_data.get('imputacion').imputacion != 'Diferencia de cambio' or not validated_data.get('imputacion') if list_bool else str(validated_data.get('imputacion')) != 'Diferencia de cambio' ):

            tc_reg = float(validated_data.get('tipo_de_cambio'))

            # Si llegamos hasta acá quiere decir que se está cargando un registro en USD, por lo que hay que convertir los montos a ARS
            # Esta es la única modificación que se realiza sobre validated_data
            convertir_a_ars(validated_data, tc_reg)

            # Obtenemos el tipo de cambio MEP
            tc_diario_obj = DolarMEP.objects.filter(fecha=validated_data.get('fecha_reg')).first()
            tc_mep = float(tc_diario_obj.compra) if tc_diario_obj else None

            # Si no hay tipo de cambio para la fecha, retornar
            if not tc_mep:
                return validated_data
            
            # Comprobamos si hay diferencia de cambio
            if tc_reg and tc_reg > 1 and tc_mep != tc_reg:

                # Calculamos la diferencia de cambio
                dif = round((tc_mep - tc_reg) * (float(validated_data.get('monto_op_rec'))/tc_reg),2)

                # list_bool es un booleano que indica si el serializer es RegistroCrudSerializer (True) o RegistroSerializer (False)
                if not list_bool:

                    # Si el serializer es RegistroSerializer recibimos una lista de ids de documentos, por lo que hay que obtener los objetos
                    documentos_ids: list[int] = [doc.id for doc in validated_data.get('documento')] if validated_data.get('documento') else []
                    documentos: list[Documento] = Documento.objects.filter(id__in=documentos_ids)

                    # Ver explicación en el else
                    imputacion = 'Diferencia de cambio'

                else: 
                    # Si el serializer es RegistroCrudSerializer recibimos una lista de objetos de documentos
                    documentos: list[Documento] = validated_data.get('documento')

                    # Si el serializer es RegistroCrudSerializer, en validated_data obtenemos instancias en todos campos que son ForeignKeys
                    # Por esta razón es necesario obtener la instancia de imputación, para luego crear los registros de diferencia directamente desde el modelo de Registro, sin pasar por el serializer
                    imputacion = Imputacion.objects.get(imputacion='Diferencia de cambio')

                # Definimos el diccionario de clientes, que va a contener como clave el cliente y como valor el monto que le corresponde
                clientes = {}

                # Si hay documentos, se calcula la proporción de la diferencia de cambio que le corresponde a cada cliente
                # Comprobar si hay documentos
                if documentos:

                    # Calculamos el total de los documentos
                    total_docs = sum([float(documento.total) for documento in documentos])

                    # Iterar sobre los documentos para obtener la proporción de la diferencia de cambio que le corresponde a cada cliente, rellenando el diccionario de clientes definido anteriormente
                    for documento in documentos:
                        if documento.cliente_proyecto not in clientes:
                            # Si el cliente del documento no está en el diccionario, se agrega con el monto correspondiente
                            clientes[documento.cliente_proyecto] = round(float(documento.total)/total_docs * dif,2)
                        else:
                            # Si el cliente del documento ya está en el diccionario, se suma el monto correspondiente
                            clientes[documento.cliente_proyecto] += round(float(documento.total)/total_docs * dif,2)

                    # Iterar sobre el diccionario de clientes para crear los registros de diferencia de cambio
                    for cliente in clientes:

                        # Filtramos los documentos obtenidos anteriormente, para obtener los que corresponden al cliente actual
                        docs = documentos.filter(cliente_proyecto=cliente)

                        # Definimos el diccionario del registro de diferencia de cambio a crear
                        reg_data = {
                            'tipo_reg': 'PSF' if validated_data.get('tipo_reg') in ['PSF','OP','OPFC'] else 'ISF',
                            'caja': validated_data.get('caja'),
                            'documento': [doc.id for doc in docs],
                            'fecha_reg': validated_data.get('fecha_reg'),
                            'añomes_imputacion': validated_data.get('añomes_imputacion'),
                            'unidad_de_negocio': validated_data.get('unidad_de_negocio') if validated_data.get('unidad_de_negocio') else docs[0].unidad_de_negocio,
                            'cliente_proyecto': cliente,
                            'proveedor': validated_data.get('proveedor'),
                            'imputacion': imputacion,
                            'observacion': 'Diferencia de cambio',
                            'realizado': True,

                            # Obtenemos el monto que le corresponde al cliente desde el diccionario de clientes
                            'monto_gasto_ingreso_neto': clientes[cliente],
                            'monto_op_rec': clientes[cliente],

                            'tipo_de_cambio': tc_reg,
                            'moneda': 1,
                        }

                        # Creamos el registro
                        crear_registro(reg_data, list_bool)
                
                # Si no hay documentos, quiere decir que estamos creando un registro que debe especificar cliente (PSF, OPFC, ISF, etc...), asique obtenemos los datos desde el mismo registro
                # A no ser que se trate de un MC
                else:
                    if validated_data.get('tipo_reg') == 'MC':
                        if validated_data.get('monto_op_rec') > 0: return validated_data
                        reg_data={
                            'tipo_reg': 'ISF',
                            'caja': validated_data.get('caja'),
                            'fecha_reg': validated_data.get('fecha_reg'),
                            'añomes_imputacion': validated_data.get('añomes_imputacion'),
                            'unidad_de_negocio': UnidadDeNegocio.objects.get(unidad_de_negocio='Indirectos'),
                            'cliente_proyecto': ClienteProyecto.objects.get(cliente_proyecto='Indirectos'),
                            'caja_contrapartida': validated_data.get('caja_contrapartida'),
                            'imputacion': imputacion,
                            'observacion': 'Diferencia de cambio',
                            'monto_gasto_ingreso_neto': dif,
                            'monto_op_rec': dif,
                            'tipo_de_cambio': tc_reg,
                            'realizado': True,
                            'moneda': 1,
                        }
                    else: 
                        reg_data = {
                            'tipo_reg': 'PSF' if validated_data.get('tipo_reg') in ['PSF','OP','OPFC'] else 'ISF',
                            'caja': validated_data.get('caja'),
                            'fecha_reg': validated_data.get('fecha_reg'),
                            'añomes_imputacion': validated_data.get('añomes_imputacion'),
                            'unidad_de_negocio': validated_data.get('unidad_de_negocio') if 'unidad_de_negocio' in validated_data else None,
                            'cliente_proyecto': validated_data.get('cliente_proyecto') if 'cliente_proyecto' in validated_data else None,
                            'proveedor': validated_data.get('proveedor') if 'proveedor' in validated_data else None,
                            'imputacion': imputacion,
                            'observacion': 'Diferencia de cambio',
                            'monto_gasto_ingreso_neto': dif,
                            'monto_op_rec': dif,
                            'tipo_de_cambio': tc_reg,
                            'realizado': True,
                            'moneda': 1,
                        }

                    # Creamos el registro
                    crear_registro(reg_data, list_bool)

                return validated_data
        if validated_data.get('moneda') == 2 and validated_data.get('tipo_de_cambio') == 1.00:
            # Si la moneda es USD y el tipo de cambio es 1, quiere decir que se está cargando un registro en ARS, por lo que hay que convertir los montos a USD
            tc_diario_obj = DolarMEP.objects.filter(fecha=validated_data.get('fecha_reg')).first()
            tc_mep = float(tc_diario_obj.compra) if tc_diario_obj else None
            if not tc_mep:
                return validated_data
            
            validated_data['monto_gasto_ingreso_neto'] = round(float(validated_data.get('monto_gasto_ingreso_neto')) * tc_mep,2)
            validated_data['iva_gasto_ingreso'] = round(float(validated_data.get('iva_gasto_ingreso')) * tc_mep,2)
            validated_data['monto_op_rec'] = round(float(validated_data.get('monto_op_rec')) * tc_mep,2)
            validated_data['tipo_de_cambio'] = tc_mep

        return validated_data
    
    # Si hay algún error, se hace rollback de la transacción (Se deshacen los cambios en la DB) y se lanza la excepción
    except Exception as e:
        transaction.set_rollback(True)
        raise e

class RegistroCrudSerializer(serializers.ModelSerializer):

    class Meta:
        model= Registro
        fields = "__all__"
        
    def save(self, **kwargs):
        instance = self.instance
        if not instance:
            # Si instance es None quiere decir que se está creando un nuevo registro, por lo que se aplica la lógica de tipo de cambio
            validated_data = aplicar_logica_tipo_cambio(self.validated_data)
        else:
            # Caso contrario, se está editando un registro existente, por lo que no se aplica la lógica de tipo de cambio
            validated_data = self.validated_data
        self.validated_data.update(validated_data)
        instance = super().save(**kwargs)

        return instance

class RegistroSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Registro.  
    Muestra los slug de los campos relacionados en lugar de los ids. 

    **Métodos**:
    - **save**: aplica la lógica de tipo de cambio y crea los registros correspondientes.  
    """
    caja = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    unidad_de_negocio = serializers.SlugRelatedField(slug_field='unidad_de_negocio', queryset=UnidadDeNegocio.objects.all(), required=False, allow_null=True)
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all(), required=False, allow_null=True)
    proveedor = serializers.CharField(source="proveedor.nombre", read_only=True)
    caja_contrapartida = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all(), required=False, allow_null=True)
    imputacion = serializers.SlugRelatedField(slug_field='imputacion', queryset=Imputacion.objects.all(), required=False)
    presupuesto = serializers.StringRelatedField(required=False, allow_null=True)
    observacion = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    realizado = serializers.BooleanField(default=False)
    tipo_de_cambio = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_gasto_ingreso = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = Registro
        fields = ["id","tipo_reg","caja", "certificado","documento","fecha_reg","añomes_imputacion","unidad_de_negocio","cliente_proyecto",
                  "proveedor","caja_contrapartida","imputacion","presupuesto","observacion","monto_gasto_ingreso_neto","iva_gasto_ingreso",
                  "total_gasto_ingreso", "monto_op_rec", "moneda","tipo_de_cambio", "realizado"]
    
    def save(self, **kwargs):
        validated_data = aplicar_logica_tipo_cambio(self.validated_data, False)
        self.validated_data.update(validated_data)
        instance = super().save(**kwargs)
        return instance

class RegistroListSerializer(RegistroSerializer):
    """
    Serializer para el modelo Registro.  
    Muestra los slug de los campos relacionados en lugar de los ids. 
       
    ***Campos adicionales***:
    - **saldo_acumulado**: saldo acumulado de la caja, solo lectura, se obtiene de la vista RegistroList a través del la clase Window.  
    - **total_gasto_ingreso_usd** (*SerializersMethodField*): suma de monto_gasto_ingreso_neto + iva_gasto_ingreso - monto_op_rec.  
    - **monto_op_rec_usd** (*SerializersMethodField*): monto_op_rec en USD, solo lectura, se usa en los reportes. 
    - **dolar_mep_value** *SerializersDecimalField*: valor del dolar MEP para la fecha del registro, solo lectura, se usa en los reportes.  

    **Métodos**:
    - **save**: aplica la lógica de tipo de cambio y crea los registros correspondientes.  
    - **get_total_gasto_ingreso_usd**: calcula el total_gasto_ingreso_usd.  
    - **get_monto_op_rec_usd**: calcula el monto_op_rec_usd.
    """
    # Campo para exponer el saldo acumulado (solo lectura)
    saldo_acumulado = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    dolar_mep_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_gasto_ingreso_usd = serializers.SerializerMethodField(read_only=True)
    monto_op_rec_usd = serializers.SerializerMethodField(read_only=True)

    def convertir_a_usd(self, value, obj):
        if value and float(value) != 0:
            value_float = float(value)
            moneda = obj.moneda
            tipo_de_cambio = float(obj.tipo_de_cambio) if obj.tipo_de_cambio else 1
            dolar_mep_value = float(obj.dolar_mep_value) if obj.dolar_mep_value else 1

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

class RegistroCC(RegistroSerializer):
    neto = serializers.SerializerMethodField('get_neto')

    def get_neto(self, obj):
        monto_gasto_ingreso_neto = obj.monto_gasto_ingreso_neto if obj.monto_gasto_ingreso_neto else 0
        iva_gasto_ingreso = obj.iva_gasto_ingreso if obj.iva_gasto_ingreso else 0
        monto_op_rec = obj.monto_op_rec if obj.monto_op_rec else 0
        return monto_gasto_ingreso_neto + iva_gasto_ingreso - monto_op_rec
    
    class Meta:
        model = Registro
        fields = ["id","tipo_reg","caja", "certificado","documento","fecha_reg","añomes_imputacion","unidad_de_negocio","cliente_proyecto",
                  "proveedor","caja_contrapartida","imputacion","presupuesto","observacion","monto_gasto_ingreso_neto","iva_gasto_ingreso","monto_op_rec","moneda","tipo_de_cambio","neto"]

class ConsumoPresupuestoSerializer(serializers.ModelSerializer):
    presupuesto = serializers.SlugRelatedField(slug_field='id', queryset=Presupuesto.objects.all())
    caja = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    total = serializers.SerializerMethodField('get_total')
    presupuesto = serializers.SlugRelatedField(slug_field='id', queryset=Presupuesto.objects.all())

    class Meta:
        model = Registro
        fields = ["id","presupuesto", "total", "fecha_reg", "observacion", "caja", "tipo_reg"]

    def get_total(self, obj):
        return (obj.monto_gasto_ingreso_neto or 0) + (obj.iva_gasto_ingreso or 0)

class CuentaCorrienteProveedorSerializer(serializers.Serializer):
    proveedor = serializers.SlugRelatedField(slug_field='razon_social', queryset=Persona.objects.all())
    facturas = DocumentoSerializer(many=True)
    pagos = RegistroSerializer(many=True)
    saldo = serializers.DecimalField(max_digits=20, decimal_places=2)
    class Meta:
        fields = ["proveedor", "saldo"]

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = "__all__"

class EcheqSerializer(serializers.ModelSerializer):
    class Meta:
        model = Echeq
        fields = "__all__"

class PagoFacturaSerializer(serializers.ModelSerializer): # Este es el serializer para relacionar los registros con las facturas
    class Meta:
        model = PagoFactura
        fields = "__all__"

class MedioPagoSerializer(serializers.Serializer): # Este es el serializer que recibe los medios de pago
    tipo = serializers.CharField()
    caja = serializers.SlugRelatedField(slug_field="caja",queryset=Caja.objects.all())
    monto = serializers.DecimalField(max_digits=20, decimal_places=2)
    fecha = serializers.CharField()
    tipo_retencion = serializers.CharField(required = False, allow_null = True, allow_blank = True)
    numero_certificado = serializers.CharField(required = False, allow_null = True, allow_blank = True)
    tipo_de_cambio = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)
    pdf_file = serializers.CharField(required=False, allow_null=True)  # Change to CharField to accept base64

    class Meta:
        fields = ["tipo","caja","monto","fecha","tipo_retencion","tipo_de_cambio", "numero_certificado","pdf_file"]
                # Si no hago esto obtengo un error de que el campo no puede ser nulo
        extra_kwargs = {'pdf_file': {'required': False, 'allow_null': True}, 'tipo_retencion': {'required': False, 'allow_null': True}}
    
    def validate_pdf_file(self, value):
        """
        Validate and convert base64 string to a file object.
        """
        if not value:
            return None
            
        if isinstance(value, str) and value.startswith('data:application/pdf;base64,'):
            # Extract base64 content
            base64_data = value.replace('data:application/pdf;base64,', '')
            try:
                # Decode base64 to binary
                import base64
                from django.core.files.base import ContentFile
                
                binary_data = base64.b64decode(base64_data)
                
                # Create file-like object with custom filename
                return ContentFile(binary_data, name='certificado.pdf')
            except Exception as e:
                raise serializers.ValidationError(f"Invalid base64 data: {str(e)}")
        return value

class ImputacionMultipleSerializer(serializers.Serializer):
    factura_id = serializers.IntegerField()
    cliente_proyecto = serializers.PrimaryKeyRelatedField(queryset=ClienteProyecto.objects.all())
    monto = serializers.FloatField()

class PagoSerializer(serializers.Serializer): # Este es el serializer que recibe el array de las facturas con los pagos
    facturas = serializers.PrimaryKeyRelatedField(queryset=Documento.objects.all(), many=True)
    medios_pago = MedioPagoSerializer(many=True)
    imputaciones_multiples = ImputacionMultipleSerializer(many=True, required=False)

class CobroSerializer(serializers.Serializer):
    certificado = serializers.IntegerField(required=False, allow_null=True)
    documento = serializers.PrimaryKeyRelatedField(queryset=Documento.objects.all(), required=False, allow_null=True)
    caja = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all())
    monto = serializers.DecimalField(max_digits=20, decimal_places=2)
    fecha = serializers.DateField()
    moneda = serializers.IntegerField()
    observacion = serializers.CharField(required=False, allow_null=True)
    tipo_de_cambio = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)

# Creo este serializer porque no es posible enviar arrays junto a archivos en un POST, asique cargo los medios de pago de una
# factura por un lado, y después, a partir de la respuesta, cargo el archivo asociado a la retención
class CertificadoPDFSerializer(serializers.Serializer):
    registro = serializers.PrimaryKeyRelatedField(queryset=Registro.objects.all())
    pdf_file = serializers.FileField()

class CertificadoSerializer(serializers.ModelSerializer):
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all())
    neto = serializers.DecimalField(max_digits=20, decimal_places=2)
    iva = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)
    fecha = serializers.DateField()
    numero = serializers.IntegerField()
    observacion = serializers.CharField(required=False, allow_null=True)
    saldo = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = CertificadoObra
        fields = "__all__"

class DetalleCertificadoSerializer(serializers.Serializer):
    certificado = CertificadoSerializer()
    pagos = RegistroSerializer(many=True)
    saldo = serializers.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        fields = ["certificado", "saldo"]

class CuentaCorrienteClienteSerializer(serializers.Serializer):
    cliente = serializers.SlugRelatedField(slug_field='id', queryset=ClienteProyecto.objects.all())
    detalle = DetalleCertificadoSerializer(many=True)
    saldo = serializers.DecimalField(max_digits=20, decimal_places=2)
    class Meta:
        fields = ["cliente", "saldo"]

class RetencionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Retencion
        fields = "__all__"

class PagoUISerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    proveedor = serializers.SerializerMethodField()
    documentos = DocumentoSerializer(many=True)
    obra = serializers.SerializerMethodField()
    caja = serializers.SerializerMethodField()
    registros_pago = RegistroSerializer(many=True)
    registros_fc = RegistroSerializer(many=True)

    class Meta:
        model = PagoFactura
        fields = ["id", "documentos","registros_fc", "registros_pago", "monto", "fecha_pago", "op", "proveedor", "obra", "caja"]

    def get_obra(self, obj):
        # Obtener la obra a partir de los documentos relacionados
        if obj.registros_fc.exists():
            obra = obj.registros_fc.first().cliente_proyecto
            for registro in obj.registros_fc.all():
                if registro.cliente_proyecto != obra:
                    return "Varias"
            return obra.cliente_proyecto if obra else None
    
    def get_caja(self, obj):
        # Obtener la caja a partir de los documentos relacionados
        if obj.registros_pago.exists():
            caja = obj.registros_pago.first().caja
            for registro in obj.registros_pago.all():
                if registro.caja != caja:
                    return "Varias"
            return caja.caja

    def get_proveedor(self, obj):
        # Obtener el proveedor a partir de los documentos relacionados
        if obj.documentos.exists():
            proveedor = obj.documentos.first().proveedor
            if proveedor:
                return proveedor.nombre_fantasia if proveedor.nombre_fantasia else proveedor.razon_social
            else: return ""
        return None

class MovimientoEntreCuentasSerializer(serializers.Serializer):
    caja_origen = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    caja_destino = serializers.SlugRelatedField(slug_field='caja', queryset=Caja.objects.all())
    monto = serializers.DecimalField(max_digits=20, decimal_places=2)
    observacion = serializers.CharField(allow_null=True, required=False, allow_blank=True)
    fecha = serializers.DateField()
    tipo_de_cambio = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)

    class Meta:
        fields = ["caja_origen", "caja_destino", "monto", "fecha", "tipo_de_cambio"]

class PresupuestoSerializer(serializers.ModelSerializer):
    observacion = serializers.CharField(required=False, allow_null=True)
    monto = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)
    class Meta:
        model = Presupuesto
        fields = "__all__"

class PresupuestoViewSerializer(serializers.ModelSerializer):
    '''Serializer para retornar los datos de un presupuesto creado o modificado al frontend.'''
    proveedor = serializers.SlugRelatedField(slug_field='nombre_fantasia', queryset=Persona.objects.all())
    cliente_proyecto = serializers.SlugRelatedField(slug_field='cliente_proyecto', queryset=ClienteProyecto.objects.all())
    nombre = serializers.SerializerMethodField('get_nombre')
    estado = serializers.SerializerMethodField('get_estado')
    aprobado = serializers.SerializerMethodField('get_aprobado')

    def get_nombre(self, obj):
        return obj.__str__()
    
    def get_estado(self, obj):
        return obj.get_estado_display()
    
    def get_aprobado(self, obj):
        return obj.get_aprobado_display()
    
    class Meta:
        model = Presupuesto
        fields = ["id","proveedor","cliente_proyecto","monto","observacion","fecha", "estado", "aprobado", "nombre"]
    
class PresupuestoListSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField('get_estado', read_only=True)
    aprobado = serializers.SerializerMethodField('get_aprobado', read_only=True)
    class Meta:
        model = DbPresupuestosV2
        fields = '__all__'

    def get_estado(self, obj):
        return obj.get_estado_display()
    
    def get_aprobado(self, obj):
        return obj.get_aprobado_display()

class EstadoPresupuestoCreateSerializer(serializers.Serializer):
    presupuesto = serializers.SlugRelatedField(slug_field='id', queryset=Presupuesto.objects.all())
    estado = serializers.ChoiceField(choices=EstadoPresupuesto.estado_presupuesto_choices)

    class Meta:
        model=EstadoPresupuesto
        fields = ["presupuesto", "estado", "usuario"]

class EstadoPresupuestoSerializer(serializers.ModelSerializer):
    presupuesto = serializers.SerializerMethodField('get_presupuesto')
    usuario = serializers.SerializerMethodField('get_usuario')
    estado = serializers.SerializerMethodField('get_estado')
    class Meta:
        model = EstadoPresupuesto
        fields = "__all__"
    
    def get_estado(self, obj):
        return obj.get_estado_display()

    def get_usuario(self, obj):
        return obj.usuario.__str__()

    def get_presupuesto(self, obj):
        return obj.presupuesto.__str__()
    
class ComentarioSerializer(serializers.ModelSerializer):
    usuario = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all())
    accion = serializers.CharField(default="Comentó", read_only=True)
    class Meta:
        model = Comentario
        fields = "__all__"

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = "__all__"

class ActividadPresupuestoSerializer(serializers.Serializer):
    presupuesto = serializers.SlugRelatedField(slug_field='id', queryset=Presupuesto.objects.all())
    accion= serializers.CharField()
    comentario = serializers.CharField()
    usuario = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all())
    class Meta:
        fields = ["presupuesto", "accion", "comentario", "usuario"]

class DolarMEPSerializer(serializers.ModelSerializer):
    class Meta:
        model = DolarMEP
        fields = "__all__"

class ConciliacionCajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConciliacionCaja
        fields = "__all__"

class RegistroManoDeObraSerializer(serializers.Serializer):
    proveedor = serializers.IntegerField()
    imputacion = serializers.IntegerField()
    cliente_proyecto = serializers.IntegerField()
    presupuesto = serializers.IntegerField(required=False, allow_null=True)
    observacion = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    monto = serializers.DecimalField(max_digits=20, decimal_places=2)

class PagoManoDeObraSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    pagos = RegistroManoDeObraSerializer(many=True)

class ImputacionFacturaSerializer(serializers.Serializer):
    factura = serializers.PrimaryKeyRelatedField(queryset=Documento.objects.all())
    presupuesto = serializers.PrimaryKeyRelatedField(queryset=Presupuesto.objects.all(), allow_null=True, required=False)

class ImputacionFacturasSerializer(serializers.Serializer):
    imputaciones = ImputacionFacturaSerializer(many=True)

class TareaSerializer(serializers.ModelSerializer):
    asignado_a = serializers.SlugRelatedField(slug_field='username', queryset=User.objects.all())
    presupuesto = serializers.StringRelatedField()
    estado_display = serializers.SerializerMethodField('get_estado_display', read_only=True)
    class Meta:
        model = Tarea
        fields = ["id","asignado_a","presupuesto","descripcion","estado","link_to","estado_display"]
    
    def get_estado_display(self, obj):
        return obj.get_estado_display()

class MDOVSPresupuestoSerializer(serializers.Serializer):
    presupuesto = PresupuestoViewSerializer()
    registro = RegistroSerializer(many=True)
    class Meta:
        fields = ["presupuesto", "registro"]

class ConciliacionCSVSerializer(serializers.Serializer):
    archivo = serializers.FileField()

class GastoBancarioSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    cod_concepto = serializers.CharField()
    debito = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    credito = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    sub_tipo = serializers.CharField()
    ya_cargado = serializers.BooleanField()
    iva = serializers.CharField(required=False, allow_null=True, allow_blank=True)

class OPDesdeConciliacionSerializer(serializers.Serializer):
    facturas = serializers.PrimaryKeyRelatedField(queryset=Documento.objects.all(), many=True)
    monto_op = serializers.DecimalField(max_digits=20, decimal_places=2)
    monto_retencion = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)
    numero_certificado_retencion = serializers.CharField(required=False, allow_null=True)
    certificado_retencion = serializers.FileField(required=False, allow_null=True)
    fecha = serializers.CharField()
    cnpj = serializers.CharField()

class PlantillaRegistroSerializer(serializers.ModelSerializer):
    unidad_de_negocio_label = serializers.CharField(source='unidad_de_negocio.unidad_de_negocio', read_only=True)
    cliente_proyecto_label = serializers.CharField(source='cliente_proyecto.cliente_proyecto', read_only=True)
    imputacion_label = serializers.CharField(source='imputacion.imputacion', read_only=True)
    proveedor_label = serializers.CharField(source="proveedor.nombre", read_only=True)

    class Meta:
        model = PlantillaRegistro
        fields = ["id", "nombre", "tipo_reg", "unidad_de_negocio", "unidad_de_negocio_label", "cliente_proyecto", "cliente_proyecto_label",
                  "proveedor", "imputacion", "imputacion_label", "proveedor_label", "observacion"]

class HistoricalRegistroSerializer(serializers.ModelSerializer):
    """Serializer para los registros históricos de Registro"""
    history_user = serializers.CharField(source='history_user.username', read_only=True)
    history_type_display = serializers.SerializerMethodField()
    proveedor_nombre = serializers.SerializerMethodField()
    cliente_proyecto_nombre = serializers.SerializerMethodField()
    imputacion_nombre = serializers.SerializerMethodField()
    caja_nombre = serializers.SerializerMethodField()
    
    def get_history_type_display(self, obj):
        """Obtiene el tipo de cambio en español"""
        type_mapping = {
            '+': 'Creado',
            '~': 'Modificado',
            '-': 'Eliminado'
        }
        return type_mapping.get(obj.history_type, obj.history_type)
    
    def get_proveedor_nombre(self, obj):
        """Obtiene el nombre del proveedor si existe"""
        if obj.proveedor_id:
            try:
                from iva.models import Persona
                proveedor = Persona.objects.get(id=obj.proveedor_id)
                return proveedor.nombre()
            except:
                return f"Proveedor ID: {obj.proveedor_id}"
        return None
    
    def get_cliente_proyecto_nombre(self, obj):
        """Obtiene el nombre del cliente proyecto si existe"""
        if obj.cliente_proyecto_id:
            try:
                from iva.models import ClienteProyecto
                cliente = ClienteProyecto.objects.get(id=obj.cliente_proyecto_id)
                return str(cliente)
            except:
                return f"Cliente ID: {obj.cliente_proyecto_id}"
        return None
    
    def get_imputacion_nombre(self, obj):
        """Obtiene el nombre de la imputación si existe"""
        if obj.imputacion_id:
            try:
                from iva.models import Imputacion
                imputacion = Imputacion.objects.get(id=obj.imputacion_id)
                return str(imputacion)
            except:
                return f"Imputación ID: {obj.imputacion_id}"
        return None
    
    def get_caja_nombre(self, obj):
        """Obtiene el nombre de la caja si existe"""
        if obj.caja_id:
            try:
                caja = Caja.objects.get(id=obj.caja_id)
                return str(caja)
            except:
                return f"Caja ID: {obj.caja_id}"
        return None

    class Meta:
        model = Registro.history.model
        fields = [
            'history_id', 'history_date', 'history_type', 'history_type_display', 'history_user',
            'id', 'tipo_reg', 'fecha_reg', 'monto_gasto_ingreso_neto', 'iva_gasto_ingreso', 
            'monto_op_rec', 'observacion', 'realizado', 'activo', 'moneda', 'tipo_de_cambio',
            'proveedor_nombre', 'cliente_proyecto_nombre', 'imputacion_nombre', 'caja_nombre'
        ]