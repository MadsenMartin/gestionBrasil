import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import DolarMEP

# Comando para importar datos desde un excel exportado como csv separado por comas con codificación utf-8
class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/mep_csv.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                try:
                    DolarMEP.objects.create(
                        fecha=row["fecha"],
                        compra=self.convert_to_decimal(row["Compra"]),
                        venta=self.convert_to_decimal(row["Venta"]),
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