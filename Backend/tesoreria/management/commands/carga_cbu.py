import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro
from iva.models import Persona

# Comando para importar datos desde un excel exportado como csv separado por comas con codificación utf-8
class Command(BaseCommand):
    help = 'Migrar CBUs desde agenda de proveedores de ICBC'

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/cbu.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                try:
                    cnpj = row["CNPJ/CUIL"].replace("-", "")
                    if cnpj.isdigit():
                        proveedor = Persona.objects.filter(cnpj=cnpj).first()
                        if proveedor:
                            proveedor.cbu_alias = row["CBU/ALIAS"]
                            proveedor.save()
                            self.stdout.write(self.style.SUCCESS(f'Proveedor {proveedor.nombre()} actualizado con CBU/ALIAS: {row["CBU/ALIAS"]}'))
                        else:
                            self.stdout.write(self.style.ERROR(f'Error: No se encontró el proveedor con CNPJ {cnpj}'))
                    else:
                        self.stdout.write(self.style.ERROR(f'Error: CNPJ/CUIL no válido {row["CNPJ/CUIL"]}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                    return
            self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))

