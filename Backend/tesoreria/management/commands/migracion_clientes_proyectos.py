import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro
from iva.models import ClienteProyecto, UnidadDeNegocio

# Comando para importar datos desde un excel exportado como csv separado por comas con codificación utf-8
class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/clientes_proyectos_gestion.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            constructora = UnidadDeNegocio.objects.get(unidad_de_negocio="Constructora")
            for row in reader:
                try:
                    ClienteProyecto.objects.create(
                        unidad_de_negocio=UnidadDeNegocio.objects.get(unidad_de_negocio=row["unidad_de_negocio"]) if row["unidad_de_negocio"] != '' else constructora,
                        cliente_proyecto=row["cliente_proyecto"],
                    ).save()
                except Exception as e:
                    print("Fila: ", row)
                    self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                    return

        self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))

    def convert_to_decimal(self, value):
        if value and value != '':
            return value.replace('.', '').replace(',', '.')
        return None