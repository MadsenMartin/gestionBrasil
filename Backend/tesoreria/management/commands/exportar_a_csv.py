import csv
from django.core.management.base import BaseCommand
from tesoreria.models import Registro

class Command(BaseCommand):
    help = 'Exportar todos los registros a un archivo CSV'

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/registros_exportados.csv'
        with open(file_path, mode='w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = [
                'caja_id', 'fecha_reg', 'tipo_reg', 'añomes_imputacion', 'unidad_de_negocio_id',
                'cliente_proyecto_id', 'proveedor_id', 'caja_contrapartida_id', 'imputacion_id',
                'observacion', 'monto_gasto_ingreso_neto', 'iva_gasto_ingreso', 'monto_op_rec', 'moneda'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=';')
            writer.writeheader()

            for registro in Registro.objects.all():
                writer.writerow({
                    'caja_id': registro.caja_id,
                    'fecha_reg': registro.fecha_reg,
                    'tipo_reg': registro.tipo_reg,
                    'añomes_imputacion': registro.añomes_imputacion,
                    'unidad_de_negocio_id': registro.unidad_de_negocio_id,
                    'cliente_proyecto_id': registro.cliente_proyecto_id,
                    'proveedor_id': registro.proveedor_id,
                    'caja_contrapartida_id': registro.caja_contrapartida_id,
                    'imputacion_id': registro.imputacion_id,
                    'observacion': registro.observacion,
                    'monto_gasto_ingreso_neto': registro.monto_gasto_ingreso_neto,
                    'iva_gasto_ingreso': registro.iva_gasto_ingreso,
                    'monto_op_rec': registro.monto_op_rec,
                    'moneda': registro.moneda
                })

        self.stdout.write(self.style.SUCCESS('Registros exportados exitosamente'))