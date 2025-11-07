import csv
from django.core.management.base import BaseCommand
from tesoreria.models import Registro
from django.db import transaction

class Command(BaseCommand):
    help = 'Actualiza el tipo_de_cambio de registros de tesoreria según un CSV con columnas ID y tipo_de_cambio'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Archivo CSV con columnas ID y tipo_de_cambio')

    @transaction.atomic
    def handle(self, *args, **options):
        file = f"tesoreria/management/commands/{options['csv_file']}"
        try:
            with open(file, newline='', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile, delimiter=";")
                actualizados = 0
                no_encontrados = []
                for row in reader:
                    try:
                        registro_id = int(row['ID'])
                        tipo_de_cambio = float(row['tipo_de_cambio'])
                        try:
                            registro = Registro.objects.get(id=registro_id)
                            registro.tipo_de_cambio = tipo_de_cambio
                            registro.save()
                            actualizados += 1
                            self.stdout.write(f'Registro {registro_id} actualizado a tipo_de_cambio {tipo_de_cambio}')
                        except Registro.DoesNotExist:
                            no_encontrados.append(registro_id)
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'Error en fila: {row} - {e}'))
                self.stdout.write(self.style.SUCCESS(f'{actualizados} registros actualizados.'))
                if no_encontrados:
                    self.stdout.write(self.style.WARNING(f'IDs no encontrados: {no_encontrados}'))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'Archivo {file} no encontrado.'))