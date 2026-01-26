from django.db import models

class Inversor(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Inversor"
        verbose_name_plural = "Inversores"
    
class PorcentajeInversion(models.Model):
    inversor = models.ForeignKey(Inversor, on_delete=models.DO_NOTHING)
    proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        unique_together = ('inversor', 'proyecto') # Me aseguro que no haya duplicados, validación a nivel de base de datos
        verbose_name = "Porcentaje de Inversión"
        verbose_name_plural = "Porcentajes de Inversión"

    def __str__(self):
        return f"{self.inversor} - {self.proyecto} - {self.porcentaje}%"
    
class PorcentajeGastosInversion(models.Model):
    proyecto = models.ForeignKey('iva.ClienteProyecto', on_delete=models.DO_NOTHING)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    mes = models.IntegerField()

    class Meta:
        unique_together = ('proyecto', 'mes') # Me aseguro que no haya duplicados, validación a nivel de base de datos
        verbose_name = "Porcentaje de alocación de Gastos de Inversión"
        verbose_name_plural = "Porcentajes de alocación de Gastos de Inversión"

    def __str__(self):
        return f"{self.proyecto} - {self.mes} - {self.porcentaje}%"

class AsientoInversor(models.Model):

    TIPO_ASIENTO_CHOICES = [
        ('A', 'Aporte'),
        ('C', 'Compensación'),
        ('R', 'Retiro'),
    ]
    fecha_carga = models.DateTimeField(auto_now_add=True)
    inversor = models.ForeignKey(Inversor, on_delete=models.CASCADE)
    tipo_asiento = models.CharField(max_length=1, choices=TIPO_ASIENTO_CHOICES, default='A')
    registro=models.OneToOneField('tesoreria.Registro', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.inversor} - {self.get_tipo_asiento_display()} - {self.fecha_carga}"

    def save(self, *args, **kwargs):
        self.full_clean()  # Ejecuta clean() antes de guardar
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Asiento de Inversor"
        verbose_name_plural = "Asientos de Inversores"