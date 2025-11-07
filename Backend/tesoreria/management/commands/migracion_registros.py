import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro

# Comando para importar datos desde un excel exportado como csv separado por comas con codificación utf-8
class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/caja_fer.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            for row in reader:
                try:
                    Registro.objects.create(
                        caja_id=row["caja"] if row["caja"] != '' else None,
                        fecha_reg=row["fecha_reg"],
                        tipo_reg=row["tipo_reg"],
                        añomes_imputacion=row["añomes_imputacion"],
                        unidad_de_negocio_id=row["unidad_de_negocio"] if row["unidad_de_negocio"] != '' else None,
                        cliente_proyecto_id=row["cliente_proyecto"] if row["cliente_proyecto"] != '' else None,
                        proveedor_id=row["proveedor"] if row["proveedor"] != '' else None,
                        caja_contrapartida_id=row["caja_contrapartida"] if row["caja_contrapartida"] != '' else None,
                        imputacion_id=row["imputacion"] if row["imputacion"] != '' else None,
                        observacion=row["observacion"],
                        monto_gasto_ingreso_neto=self.convert_to_decimal(row["monto_gasto_ingreso_neto"]),
                        iva_gasto_ingreso=self.convert_to_decimal(row["iva_gasto_ingreso"]),
                        monto_op_rec=self.convert_to_decimal(row["monto_op_rec"]),
                        moneda=1
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