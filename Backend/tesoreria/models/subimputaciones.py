from django.db import models

class SubImputacion(models.Model):
    nombre = models.CharField(max_length=30)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Sub Imputación"
        verbose_name_plural = "Sub Imputaciones"
        ordering = ['id']

    def __str__(self):
        return self.nombre
    
class SubImputacionMapping(models.Model):
    proveedor = models.ForeignKey('iva.Persona', on_delete=models.CASCADE, related_name='sub_imputacion_mappings')
    imputacion = models.ForeignKey('iva.Imputacion', on_delete=models.CASCADE, related_name='sub_imputacion_mappings')
    sub_imputacion = models.ForeignKey(SubImputacion, on_delete=models.CASCADE, related_name='mappings')

    class Meta:
        verbose_name = "Mapeo de Sub Imputación"
        verbose_name_plural = "Mapeos de Sub Imputación"
        unique_together = ('proveedor', 'imputacion')
        ordering = ['id']

    def __str__(self):
        return f"{self.proveedor} - {self.imputacion} - {self.sub_imputacion}"

    