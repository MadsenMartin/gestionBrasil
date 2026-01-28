from django.db import models
from django.core.exceptions import ValidationError
from datetime import datetime, date
from django.db import transaction
from tesoreria.models.pagos import PagoFactura
from tesoreria.models import subimputaciones
from .archivos import Archivo
from django.utils import timezone 
from simple_history.models import HistoricalRecords

class Caja(models.Model):
    caja = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    moneda = models.ForeignKey('shared.Moneda', on_delete=models.DO_NOTHING, default=1)
    dueño = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING, null=True, blank=True)
    codigo = models.CharField(max_length=5, null=True, blank=True)

    def __str__(self):
        return self.caja
    

class RegistroAbstracto(models.Model):
    TIPO_REG_CHOICES = [ # Hardcoded, no veo la necesidad de hacerlo dinámico
    ("OP", "Orden de Pago"),
    ("REC", "Recibo"),
    ("FC", "Factura de compra"),
    ("ND", "Nota de Débito"),
    ("NC", "Nota de Crédito"),
    ("MC", "Movimiento entre cuentas"),
    ("CH", "Cheque"),
    ("PSF", "Pago sin factura"),
    ("DEP", "Depósito"),
    ("ISF", "Ingreso sin factura"),
    ("RETH", "Retención hecha"),
    ("RETS", "Retención sufrida"),
    ("AJU", "Ajuste de caja"),
    ("FCV", "Factura de venta"),
    ("PERCS", "Percepción sufrida"),
    ("PERCH", "Percepción hecha"),
    ("RECFC", "Factura de venta con recibo"),
    ("OPFC", "Factura de compra con OP"),
    ]

    tipo_reg = models.CharField(max_length=5, choices=TIPO_REG_CHOICES)
    documento = models.ManyToManyField('iva.Documento', blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    certificado = models.ForeignKey('tesoreria.CertificadoObra', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    fecha_reg = models.DateField()
    nro_documento = models.CharField(max_length=75, null=True, blank=True)
    añomes_imputacion = models.BigIntegerField()
    unidad_de_negocio = models.ForeignKey('iva.UnidadDeNegocio', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    cliente_proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    proveedor = models.ForeignKey('iva.Persona', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    caja_contrapartida = models.ForeignKey('tesoreria.Caja', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    imputacion = models.ForeignKey('iva.Imputacion', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    sub_imputacion = models.ForeignKey('tesoreria.SubImputacion', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    observacion = models.TextField(null=True, blank=True)
    presupuesto = models.ForeignKey('tesoreria.Presupuesto', on_delete=models.DO_NOTHING, null=True, blank=True,
        related_name="%(app_label)s_%(class)s_related",
        related_query_name="%(app_label)s_%(class)ss")
    monto_gasto_ingreso_neto = models.DecimalField(decimal_places=4, max_digits= 20, default=0.00, null=True, blank=True)
    iva_gasto_ingreso = models.DecimalField(decimal_places=4, max_digits= 20, default=0.00, null=True, blank=True)
    monto_op_rec = models.DecimalField(decimal_places=4, max_digits= 20, default=0.00, null=True, blank=True)
    moneda = models.ForeignKey('shared.Moneda', on_delete=models.DO_NOTHING, null=True, blank=True)
    tipo_de_cambio = models.DecimalField(decimal_places=4, max_digits= 20, null=True, blank=True)

    class Meta:
        abstract = True

    def clean(self):
        super().clean()
        if self.tipo_de_cambio is not None and self.tipo_de_cambio == 0:
            raise ValidationError({'tipo_de_cambio': 'El tipo de cambio no puede ser 0.'})
    
    @property
    def total_gasto_ingreso(self):
        return (self.monto_gasto_ingreso_neto or 0) + (self.iva_gasto_ingreso or 0)

class Registro(RegistroAbstracto):

    caja = models.ForeignKey('tesoreria.Caja',on_delete=models.DO_NOTHING)
    realizado = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    numero_cheque = models.CharField(max_length=20, null=True, blank=True)
    archivos = models.ManyToManyField(Archivo, blank=True,
        related_name="registros",
        related_query_name="registros")
    history = HistoricalRecords()

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.caja_contrapartida and not self.proveedor and (not self.tipo_reg in ["FCV", "REC", "ISF", "AJU", "SICC", "RECFC","RETS"]):
            raise ValidationError(f'Debe especificar un proveedor o una contrapartida para este tipo de registro. Data invalida: {self.tipo_reg}, {self.fecha_reg}, {self.unidad_de_negocio}, {self.cliente_proyecto}, {self.proveedor}, {self.caja_contrapartida}, {self.imputacion}, {self.observacion}, {self.presupuesto}, {self.monto_gasto_ingreso_neto}, {self.iva_gasto_ingreso}, {self.monto_op_rec}, {self.moneda}, {self.tipo_de_cambio}')
        
        is_new = self.pk is None

        # Marcar el registro como realizado si la fecha de registro es anterior a hoy
        if is_new:
            if self.fecha_reg and date.fromisoformat(str(self.fecha_reg)) <= date.today():
                self.realizado = True
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.tipo_reg} - {self.fecha_reg} - {self.cliente_proyecto} - {self.proveedor} - {self.observacion}"

class PlantillaRegistro(models.Model):
    nombre = models.CharField(max_length=50)
    tipo_reg = models.CharField(max_length=5, choices=RegistroAbstracto.TIPO_REG_CHOICES)
    unidad_de_negocio = models.ForeignKey('iva.UnidadDeNegocio', on_delete=models.DO_NOTHING, null=True, blank=True)
    cliente_proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING, null=True, blank=True)
    imputacion = models.ForeignKey('iva.Imputacion', on_delete=models.DO_NOTHING, null=True, blank=True)
    proveedor = models.ForeignKey('iva.Persona', on_delete=models.DO_NOTHING, null=True, blank=True)
    observacion = models.TextField(null=True, blank=True)

class Retencion(models.Model):
    def ruta_archivo(instance, filename):
        # Obtener el nombre del proveedor
        proveedor_nombre = instance.registro.proveedor.razon_social.replace(" ", "_")
        # Obtener el año actual o de la fecha de la factura
        año = instance.registro.fecha_reg.year
        # Crear la ruta completa
        ruta = f"documentos/{proveedor_nombre}/{año}/{filename}"  
        return ruta
    registro = models.ForeignKey('tesoreria.Registro', on_delete=models.DO_NOTHING)
    registro_fc = models.ManyToManyField('tesoreria.Registro', blank=True, related_name='retencion_fc')
    pdf_file = models.FileField(upload_to=ruta_archivo, blank=True, null=True)
    numero = models.CharField(max_length=20, null=True, blank=True)
    fecha = models.DateField(default=timezone.now().date())
    tipo = models.CharField(max_length=10, default="IIGG")

class SaldoCaja(models.Model):
    fecha = models.DateField()
    caja = models.ForeignKey('tesoreria.Caja', on_delete=models.DO_NOTHING)
    registro = models.OneToOneField('tesoreria.Registro', on_delete=models.DO_NOTHING, null=True, blank=True)
    saldo = models.DecimalField(decimal_places=2, max_digits= 20)

class Echeq(models.Model): # Defino este modelo porque los registros no tienen un campo para guardar el número de echeq, además puede servir para lógica de acreditación diferida
    numero = models.CharField(max_length=8)
    registro = models.ForeignKey('tesoreria.Registro', on_delete=models.DO_NOTHING)
    activo = models.BooleanField(default=True)
    acreditado = models.BooleanField(default=False)

    def __str__(self):
        return f"Echeq N° {self.numero}"
    
class CertificadoObra(models.Model):
    fecha = models.DateField()
    neto = models.DecimalField(decimal_places=2, max_digits= 20)
    iva = models.DecimalField(decimal_places=2, max_digits= 20, null=True)
    observacion = models.CharField(max_length=100, null=True)
    cliente_proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING)
    numero = models.IntegerField()
    saldo = models.DecimalField(decimal_places=2, max_digits= 20)
    activo = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if self.iva:
            self.saldo = self.neto + self.iva
        else:
            self.saldo = self.neto
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificado N° {self.numero} - {self.cliente_proyecto}"
    
class Comentario(models.Model):
    comentario = models.CharField(max_length=250)
    usuario = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING)
    fecha = models.DateTimeField(auto_now=True)
    
    
class Notificacion(models.Model):
    usuario = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING)
    fecha = models.DateTimeField(auto_now=True)
    mensaje = models.TextField()
    leido = models.BooleanField(default=False)

class EstadoPresupuesto(models.Model):
    estado_presupuesto_choices = [
    (1, "Cargado"),
    (2, "Aprobado"),
    (3, "Completo"),
    (4, "Excedido"),
    (5, "Ampliado"),
    (99, "Rechazado"),
    (101, "Inactivo"),
    ]

    presupuesto = models.ForeignKey('tesoreria.Presupuesto', on_delete=models.DO_NOTHING, related_name='estados')
    fecha = models.DateTimeField()
    estado= models.IntegerField(choices=estado_presupuesto_choices, default=1)
    observacion = models.CharField(max_length=100, null=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING, null=True)

class Presupuesto(models.Model):
    aprobado_choices = [
        (1, "No aprobado"),
        (2, "Aprobado"),
        (3, "Rechazado"),
    ]

    fecha = models.DateField()
    proveedor = models.ForeignKey('iva.Persona', on_delete=models.DO_NOTHING, null=True)
    cliente_proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING, null=True)
    imputacion = models.ForeignKey('iva.Imputacion', on_delete=models.DO_NOTHING, null=True)
    monto = models.DecimalField(decimal_places=2, max_digits= 20)
    observacion = models.TextField(null=True)
    comentarios = models.ManyToManyField('tesoreria.Comentario', blank=True)
    estado = models.IntegerField(choices=EstadoPresupuesto.estado_presupuesto_choices, default=1)
    aprobado = models.IntegerField(choices=aprobado_choices, default=1)
    archivos = models.ManyToManyField(Archivo, blank=True,
        related_name="presupuestos",
        related_query_name="presupuestos")
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.cliente_proyecto} - {self.proveedor} - {self.observacion}"

class DolarMEP(models.Model):
    fecha = models.DateField(default=datetime.now)
    compra = models.DecimalField(decimal_places=4, max_digits= 20)
    venta = models.DecimalField(decimal_places=4, max_digits= 20)

class ConciliacionCaja(models.Model):
    fecha = models.DateTimeField(auto_now=True)
    caja = models.ForeignKey('tesoreria.Caja', on_delete=models.DO_NOTHING)
    ultimo_registro = models.ForeignKey('tesoreria.Registro', on_delete=models.DO_NOTHING, null=True)
    saldo = models.DecimalField(decimal_places=2, max_digits= 20)
    comentario = models.CharField(max_length=100, null=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING)

class Tarea (models.Model):
    ESTADO_TAREA_CHOICES = [
        (1, "Pendiente"),
        (2, "Leida"),
        (3, "Completada")
    ]
    presupuesto = models.ForeignKey('tesoreria.Presupuesto', on_delete=models.DO_NOTHING)
    asignado_a = models.ForeignKey('auth.User', on_delete=models.DO_NOTHING)
    descripcion = models.TextField()
    estado = models.IntegerField(choices=ESTADO_TAREA_CHOICES, default=1)
    link_to = models.CharField(max_length=100, null=True, default=None)

class DbPresupuestosV2(models.Model):
    """
    Vista que muestra los presupuestos con sus respectivos saldos.
    """
    id = models.AutoField(primary_key=True, db_column='ID')
    fecha = models.DateField(db_column='Fecha')
    proveedor_id = models.IntegerField(db_column='Proveedor ID')
    proveedor = models.CharField(max_length=255, db_column='Proveedor')
    cliente_proyecto_id = models.IntegerField(db_column='Cliente/Proyecto ID')
    cliente_proyecto = models.CharField(max_length=255, db_column='Cliente/Proyecto')
    observacion = models.TextField(db_column='Observacion')
    nombre = models.CharField(max_length=765, db_column='Nombre')
    monto = models.DecimalField(max_digits=15, decimal_places=2, db_column='Monto')
    saldo = models.DecimalField(max_digits=15, decimal_places=2, db_column='Saldo')  # Campo calculado
    estado = models.IntegerField(db_column='Estado', choices=EstadoPresupuesto.estado_presupuesto_choices, default=1)
    aprobado = models.IntegerField(db_column='Aprobado', choices=Presupuesto.aprobado_choices, default=1)
    
    class Meta:
        managed = False # Le indico a Django que no maneje este modelo porque se trata de una vista
        db_table = "db_presupuestos_v2" # Nombre de la vista, buscar definición en DB_Presupuestos.sql

class IndiceCAC(models.Model):
    mes = models.IntegerField()
    año = models.IntegerField()
    indice = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Índice CAC {self.mes}/{self.año}: {self.indice}"

    class Meta:
        unique_together = ('mes', 'año')
        verbose_name = "Índice CAC"
        verbose_name_plural = "Índices CAC"
        ordering = ['-año', '-mes']