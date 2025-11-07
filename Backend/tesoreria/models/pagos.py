from django.db import models

# Orden de pago
class PagoFactura(models.Model):
    documentos = models.ManyToManyField('iva.Documento', blank=True, related_name='pago_factura')
    registros_fc = models.ManyToManyField('tesoreria.Registro', blank=True, related_name='factura_fc')
    registros_pago = models.ManyToManyField('tesoreria.Registro', blank=True, related_name='pago_factura')
    monto = models.DecimalField(decimal_places=2, max_digits= 20)
    fecha_pago = models.DateField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    op = models.FileField(upload_to='documentos/op/', blank=True, null=True)

    # Acá sobreescribo el método save para marcar el documento como imputado
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.documentos.update(imputado=True)

    def delete(self, *args, **kwargs):
        self.documentos.update(imputado=False)
        self.registros_pago.update(activo=False)
        self.registros_fc.update(activo=False)
        self.activo = False
        super().save(update_fields=['activo'])

    def __str__(self):
        return f"PagoFactura {self.pk} - {self.registros_fc.first().proveedor} - Monto: {format(self.monto, '.2f')} - Fecha: {self.fecha_pago}"