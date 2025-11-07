import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro, Caja, Presupuesto
from iva.models import Persona, ClienteProyecto, UnidadDeNegocio, Imputacion
from decimal import Decimal, InvalidOperation
import time

class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def convert_to_decimal(self, value):
        if not value:
            return None  # Retorna None para valores vacíos
        try:
            # Reemplaza la coma por un punto para la conversión a Decimal
            value = value.replace(',', '.')
            # Convierte a Decimal y asegura dos decimales
            return Decimal(value)
            #return Decimal(value).quantize(Decimal('0.00'))
        except (InvalidOperation, Exception):
            return None

    def handle(self, *args, **kwargs):
        file_path = 'tesoreria/management/commands/Migracion_db_total_2.3.csv'
        with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            total_rows = sum(1 for row in open(file_path, encoding='utf-8-sig')) - 1  # Cuenta las filas excluyendo el encabezado
            processed_rows = 0
            update_interval = 100  # Muestra el progreso cada 100 filas
            start_time = time.time()

            for row in reader:
                if row['Tipo Doc'] == '':
                    continue
                try:
                    Registro.objects.create(
                        fecha_reg=row["Fecha Reg"],
                        tipo_reg=row["Tipo Doc"],
                        nro_documento=row["# Doc"] if row["# Doc"] != '' else None,
                        añomes_imputacion=row["Añomes mov. en cta."],
                        unidad_de_negocio=UnidadDeNegocio.objects.get(id=row["unidad_de_negocio"]) if row["unidad_de_negocio"] != '' else None,
                        cliente_proyecto=ClienteProyecto.objects.get(id=row["cliente_proyecto"]) if row["cliente_proyecto"] != '' else None,
                        proveedor=Persona.objects.get(id=row["proveedor"]) if row["proveedor"] != '' else None,
                        caja_contrapartida=Caja.objects.get(id=row["caja_contrapartida"]) if row["caja_contrapartida"] != '' else None,
                        imputacion=Imputacion.objects.get(id=row["imputacion"]) if row["imputacion"] != '' else None,
                        observacion=row["Observaciones"] if row["Observaciones"] != '' else None,
                        presupuesto=Presupuesto.objects.get(id=row["presupuesto"]) if row["presupuesto"] != '' else None,
                        monto_gasto_ingreso_neto=self.convert_to_decimal(row["Monto Gasto / Ingreso (s/IVA)"]),
                        iva_gasto_ingreso=self.convert_to_decimal(row["IVA Gasto / Ingreso"]),
                        monto_op_rec=self.convert_to_decimal(row["Monto OP/REC"]),
                        caja=Caja.objects.get(id=row["caja"]) if row["caja"] != '' else None,
                        realizado=True,
                        numero_cheque=row["# Cheque / Trx"] if row["# Cheque / Trx"] != '' else None,
                        tipo_de_cambio=1.00,
                        moneda=1,
                    )
                except Exception as e:
                    print("Fila: ", row)
                    self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                    return

                processed_rows += 1

                if processed_rows % update_interval == 0:
                    elapsed_time = time.time() - start_time
                    self.stdout.write(f'Procesando fila: {processed_rows}/{total_rows} - Tiempo transcurrido: {elapsed_time:.2f} segundos')

        self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))