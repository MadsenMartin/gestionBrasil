import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Presupuesto
from iva.models import Persona, ClienteProyecto
from decimal import Decimal, InvalidOperation

class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def convert_to_decimal(self, value):
        if not value:
            return None  # Retorna None para valores vacíos
        try:
            # Reemplaza la coma por un punto para la conversión a Decimal
            value = value.replace(',', '.')
            # Convierte a Decimal y asegura dos decimales
            return Decimal(value).quantize(Decimal('0.00'))
        except (InvalidOperation, Exception):
            return None

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/presupuestos_csv.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                try:
                    monto_value = self.convert_to_decimal(row['monto'])
                    # Puedes imprimir para depuración
                    Presupuesto.objects.create(
                        proveedor=Persona.objects.get(nombre_fantasia=row["proveedor"]) if row["proveedor"] != '' else None,
                        cliente_proyecto=ClienteProyecto.objects.get(cliente_proyecto=row["cliente_proyecto"]) if row["cliente_proyecto"] != '' else None,
                        observacion=row["concepto"] if row["concepto"] != '' else None,
                        monto=monto_value,
                        saldo=monto_value,
                        fecha="2019-01-01",
                        aprobado=2,
                        estado=2
                    )
                except Exception as e:
                    print("Fila: ", row)
                    self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                    return

        self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))