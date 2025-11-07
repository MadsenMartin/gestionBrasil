import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from iva.models import Persona, ClienteProyecto, Imputacion, Documento, TiposDocumento, UnidadDeNegocio
from decimal import Decimal, InvalidOperation
import time
from django.db import transaction
from rest_framework import serializers
import os
from django.core.files import File


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

    @transaction.atomic
    def handle(self, *args, **kwargs):
        file_path = os.path.join('iva','management','commands','migracion_documentos.csv')
        with open(file_path, newline='', encoding='latin-1') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            total_rows = sum(1 for row in open(file_path, encoding='latin-1')) - 1  # Cuenta las filas excluyendo el encabezado
            processed_rows = 0
            update_interval = 100  # Muestra el progreso cada 100 filas
            start_time = time.time()

            for row in reader:
                try:
                    obra = ClienteProyecto.objects.filter(cliente_proyecto=row["cliente_proyecto"]).first()
                    indirectos = UnidadDeNegocio.objects.filter(unidad_de_negocio="Indirectos").first()
                    if obra:
                        if obra.cliente_proyecto != "Indirectos":
                            unidad = obra.unidad_de_negocio
                        else:
                            unidad = indirectos
                    else:
                        unidad = None
                    documento = {
                        "tipo_documento":row["tipo_documento"],
                        "fecha_documento": row["fecha_documento"],
                        "proveedor": self.get_or_create_proveedor(row, True).pk,
                        "receptor": self.get_or_create_proveedor(row, False).pk,
                        "serie": row["serie"],
                        "numero": row["numero"],
                        "añomes_imputacion_gasto": row["añomes_imputacion_gasto"],
                        "unidad_de_negocio": unidad.pk if unidad else None,
                        "cliente_proyecto": obra.pk if obra else None,
                        "imputacion": Imputacion.objects.filter(imputacion=row["imputacion"]).first(),
                        "concepto": row["concepto"],
                        "comentario": row["comentario"],
                        "neto": self.convert_to_decimal(row["neto"]),
                        "iva": self.convert_to_decimal(row["iva"]),
                        "percepcion_de_iva": self.convert_to_decimal(row["percepcion_de_iva"]),
                        "percepcion_de_iibb": self.convert_to_decimal(row["percepcion_de_iibb"]),
                        "no_gravado": self.convert_to_decimal(row["no_gravado"]),
                        "exento": self.convert_to_decimal(row["exento"]),
                        "moneda": 1 if row["moneda"] == "AR$" else 2,
                        "tipo_de_cambio": self.convert_to_decimal(row["tipo_de_cambio"]),
                        "archivo": self.handle_file(row["archivo"]),
                    }
                    documento = DocumentoSerializer(data=documento)
                    if not documento.is_valid():
                        raise Exception(f'Error de validación: {documento.errors}')
                    else:
                        documento.save()

                except Exception as e:
                    print("Fila: ", row)
                    self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                    transaction.set_rollback(True)
                    return

                processed_rows += 1

                if processed_rows % update_interval == 0:
                    elapsed_time = time.time() - start_time
                    self.stdout.write(f'Procesando fila: {processed_rows}/{total_rows} - Tiempo transcurrido: {elapsed_time:.2f} segundos')

        self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))
    
    def handle_file(self, filepath):
        """
        Convert a file path string to a Django File object or return None
        """
        if not filepath or not filepath.strip():
            return None
        
        # If filepath is a relative path, make it absolute
        parts = filepath.split('\\')
        for i in range(len(parts)):
            if parts[i].endswith('.'):
                parts[i] = parts[i][:-1]
        filepath = os.path.join(*parts)
        if not os.path.isabs(filepath):
            filepath = os.path.join(settings.BASE_DIR, filepath)
        
        if os.path.exists(filepath):
            try:
                # Open the file
                file_obj = open(filepath, 'rb')
                django_file = File(file_obj)
                
                # Get the filename and truncate if needed
                filename = os.path.basename(filepath)
                # Keep the file extension but truncate the name part if too long
                if len(filename) > 100:
                    name, ext = os.path.splitext(filename)
                    # Truncate the name to fit within 100 chars including extension
                    max_name_length = 99 - len(ext)  # -1 for safety
                    name = name[:max_name_length]
                    filename = name + ext
                
                # Set the truncated name
                django_file.name = filename
                
                return django_file
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error al abrir el archivo {filepath}: {e}'))
                return None
        else:
            self.stdout.write(self.style.WARNING(f'Archivo no encontrado: {filepath}'))
            return None

    def get_or_create_proveedor(self, row, is_proveedor=True):
        try:
            prefix = "proveedor_" if is_proveedor else "receptor_"
            razon_social = row.get(f"{prefix}razon_social", None) if row.get(f"{prefix}razon_social", None) != "NULL" else None
            cnpj = row.get(f"{prefix}cnpj", None) if row.get(f"{prefix}cnpj", None) != "NULL" else None
            nombre_fantasia = row.get(f"{prefix}nombre_fantasia", None) if row.get(f"{prefix}nombre_fantasia", None) != "NULL" else None
            empleado = row.get(f"{prefix}empleado", "") == "1" if is_proveedor else False 
            activo = row.get(f"{prefix}activo", "1") == "1"
            persona = None
            
            # Only filter on fields that are not empty
            if razon_social:
                persona = Persona.objects.filter(razon_social=razon_social).first()
                
            if not persona and cnpj:
                persona = Persona.objects.filter(cnpj=cnpj).first()
                
            if not persona and nombre_fantasia:
                persona = Persona.objects.filter(nombre_fantasia=nombre_fantasia).first()
            
            if not persona and (razon_social or cnpj or nombre_fantasia):
                try:
                    # Use a separate transaction to ensure this saves independently
                    with transaction.atomic():
                        persona = Persona(
                            razon_social=razon_social,
                            cnpj=cnpj,
                            nombre_fantasia=nombre_fantasia,
                            empleado=empleado,
                            proveedor_receptor=is_proveedor,
                            activo=activo
                        )
                        persona.save()
                        # Force a refresh from DB to ensure we get a complete object
                        persona.refresh_from_db()
                except Exception as inner_e:
                    self.stdout.write(self.style.ERROR(f'Error al crear persona: {inner_e}'))
                    return None

            if not persona:
                self.stdout.write(self.style.WARNING(
                    f'No se pudo encontrar o crear el {"proveedor" if is_proveedor else "receptor"}: '
                    f'(razon_social={razon_social}, cnpj={cnpj}, nombre_fantasia={nombre_fantasia})'
                ))
                return None

            return persona
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error al crear o obtener la persona: {e}'))
            return None
        
class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento = serializers.SlugRelatedField(
        slug_field='tipo_documento',
        queryset=TiposDocumento.objects.all()
    )
    imputacion = serializers.SlugRelatedField(
        slug_field='imputacion',
        queryset=Imputacion.objects.all(),
        allow_null=True,
        required=False
    )
    concepto = serializers.CharField(allow_blank=True, required=False, allow_null=True)
    class Meta:
        model = Documento
        fields = '__all__'
