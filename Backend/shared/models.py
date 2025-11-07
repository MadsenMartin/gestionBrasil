from django.db import models

class Municipio(models.Model):
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Municipio"
        verbose_name_plural = "Municipios"
        ordering = ['nombre']

class Moneda(models.Model):
    nombre = models.CharField(max_length=50)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Moneda"
        verbose_name_plural = "Monedas"
        ordering = ['nombre']
