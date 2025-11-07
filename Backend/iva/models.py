from ast import mod
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import transaction
from tesoreria.models import Caja, Registro

class Persona(models.Model):
    proveedor_receptor_choices = [
        (1, "Proveedor"),
        (2, "Receptor")
    ]
    razon_social = models.CharField(max_length=100, null=True, blank=True)
    nombre_fantasia = models.CharField(max_length=100, null=True, blank=True)
    proveedor_receptor = models.IntegerField(choices=proveedor_receptor_choices, default=1)
    cnpj = models.CharField(max_length=18, null=True, blank=True)
    cbu_alias = models.CharField(max_length=35, null=True, blank=True)
    #empleado = models.BooleanField(default=False)
    imputacion = models.ForeignKey('iva.imputacion', on_delete=models.DO_NOTHING, null=True, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        if self.razon_social and self.nombre_fantasia:
            return f"{self.razon_social} ({self.nombre_fantasia})"
        return self.razon_social or self.nombre_fantasia or "Sin nombre"

    def delete(self, *args, **kwargs):
        self.activo = False
        self.save()
    
    def nombre(self):
        return self.razon_social or self.nombre_fantasia or "Sin nombre"

    class Meta:
        verbose_name = "Persona"
        verbose_name_plural = "Personas"
        ordering = ['nombre_fantasia']

class TiposDocumento(models.Model):
    tipo_documento = models.CharField(max_length=30)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.tipo_documento

class UnidadDeNegocio(models.Model):
    unidad_de_negocio = models.CharField(max_length=30)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.unidad_de_negocio

class ClienteProyecto(models.Model):
    cliente_proyecto = models.CharField(max_length=50)
    activo = models.BooleanField(default=True)
    unidad_de_negocio = models.ForeignKey(UnidadDeNegocio, on_delete=models.DO_NOTHING, default=1)
    porcentaje = models.DecimalField(decimal_places=2, max_digits= 5, default=100.00)

    def __str__(self):
        return self.cliente_proyecto
    
    def delete(self, *args, **kwargs):
        self.activo = False
        self.save()

class Imputacion(models.Model):
    imputacion = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.imputacion

class Documento(models.Model):

    def ruta_archivo(instance, filename):
        # Obtener el nombre del proveedor
        proveedor_nombre = instance.proveedor.razon_social.replace(" ", "_")
        # Obtener el año actual o de la fecha de la factura
        año = instance.fecha_documento.year
        # Crear la ruta completa
        ruta = f"documentos/{proveedor_nombre}/{año}/{filename}"  
        return ruta

    tipo_documento = models.ForeignKey(TiposDocumento, on_delete=models.DO_NOTHING, blank=False,null=False)
    fecha_documento = models.DateField()
    proveedor = models.ForeignKey(Persona, on_delete=models.DO_NOTHING, related_name="proveedor_documento")
    receptor = models.ForeignKey(Persona, on_delete=models.DO_NOTHING, related_name="receptor_documento")
    serie = models.SmallIntegerField(default=0)
    numero = models.IntegerField()
    chave_de_acesso = models.BigIntegerField
    añomes_imputacion_gasto = models.IntegerField()
    añomes_imputacion_contable = models.IntegerField(
    validators=[
        MinValueValidator(202001),  # Enero 2020
        MaxValueValidator(209912)   # Diciembre 2099
    ], default=202509)
    tiene_cno = models.BooleanField(default=False)
    unidad_de_negocio = models.ForeignKey(UnidadDeNegocio, on_delete=models.DO_NOTHING, null=True)
    cliente_proyecto = models.ForeignKey(ClienteProyecto, on_delete=models.DO_NOTHING, null=True)
    imputacion = models.ForeignKey(Imputacion, on_delete=models.DO_NOTHING, null=True)
    concepto = models.CharField(max_length=100)
    comentario = models.CharField(max_length=100, null=True, blank=True)
    total = models.DecimalField(decimal_places=2, max_digits= 15, null=True, blank=True)
    impuestos_retidos = models.DecimalField(decimal_places=2, max_digits= 15, null=True, blank=True)
    moneda = models.ForeignKey('shared.Moneda', on_delete=models.DO_NOTHING)
    fecha_pago = models.DateField(null=True, blank=True)
    archivo = models.FileField(upload_to=ruta_archivo)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    municipio = models.ForeignKey('shared.Municipio', on_delete=models.DO_NOTHING, null=True)
    imputado = models.BooleanField(default=False) # Indica si el documento tiene un registro FC asociado
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.proveedor} - {self.tipo_documento} {self.serie}-{self.numero}"
    
    def delete(self, user=None, *args, **kwargs):
        # Marcar como eliminado en lugar de borrar realmente
        self.activo = False
        self.save()

    @transaction.atomic
    def imputar(self, fecha_reg, monto_pagado=None):
        self.imputado = True
        self.save(update_fields=['imputado'])
        registro = Registro.objects.create(
            tipo_reg = 'FC',
            fecha_reg = fecha_reg,
            añomes_imputacion = self.añomes_imputacion_gasto,
            unidad_de_negocio = self.unidad_de_negocio,
            cliente_proyecto = self.cliente_proyecto,
            proveedor = self.proveedor,
            imputacion = self.imputacion,
            observacion = self.concepto,
            monto_gasto_ingreso_neto = -monto_pagado if monto_pagado else -self.total,
            moneda = self.moneda,
            caja = Caja.objects.get_or_create(caja='Facturas')[0]
        )
        registro.documento.set([self])
        return registro

    
    class Meta:
        unique_together = ('tipo_documento', 'serie', 'numero', 'proveedor', 'activo')
    ordering = ['-fecha_documento', '-id']
    
    def validate_unique(self, exclude=None):
        super().validate_unique(exclude)
        if Documento.objects.filter(
            tipo_documento=self.tipo_documento,
            serie=self.serie,
            numero=self.numero,
            proveedor=self.proveedor,
            activo=self.activo
        ).exclude(pk=self.pk).exists():
            raise ValidationError(
                {'__all__': 'Ya existe un documento activo con ese tipo, Serie, número y proveedor.'}
            )

class EstadoDocumento(models.Model):

    ESTADOS_CHOICES = [
        (1,"Cargado"),
        (2, "Modificado"),
        (3,"Pagado"),
        (4,"Eliminado"),
        (5,"Restaurado")
    ]

    documento = models.ForeignKey(Documento,on_delete=models.DO_NOTHING)
    estado = models.IntegerField(choices=ESTADOS_CHOICES, default=1)
    usuario = models.ForeignKey(User, null=True, blank=True,related_name='documentos_eliminados', on_delete=models.DO_NOTHING)
    timestamp = models.DateTimeField(auto_now_add=True)