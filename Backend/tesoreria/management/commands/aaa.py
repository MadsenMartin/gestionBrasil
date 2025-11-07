import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro
from iva.models import Persona

# Comando para importar datos desde un excel exportado como csv separado por comas con codificación utf-8
class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def handle(self, *args, **kwargs):
        personas = Persona.objects.all()
        for persona in personas:
            persona.razon_social = persona.nombre_fantasia
            persona.save()