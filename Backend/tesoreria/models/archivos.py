from django.db import models

class Archivo(models.Model):
    '''
    Modelo para almacenar archivos subidos por los usuarios, pensado para almacenar documentos asociados a registros de caja.
    '''
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    archivo = models.FileField(upload_to='archivos/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    usuario = models.CharField(max_length=255)

    def __str__(self):
        return f"Archivo subido por {self.usuario} el {self.fecha_subida}"