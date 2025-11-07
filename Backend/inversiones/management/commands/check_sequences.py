from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = 'Verifica el estado de las secuencias de PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--app',
            type=str,
            help='Especifica una app en particular (ej: inversiones)',
        )

    def handle(self, *args, **options):
        app_label = options.get('app')
        
        if app_label:
            try:
                app_config = apps.get_app_config(app_label)
                models_to_check = app_config.get_models()
            except LookupError:
                self.stdout.write(
                    self.style.ERROR(f'App {app_label} no encontrada')
                )
                return
        else:
            models_to_check = apps.get_models()

        self.stdout.write(
            self.style.HTTP_INFO('Estado de las secuencias de PostgreSQL:')
        )
        self.stdout.write('-' * 80)
        
        for model in models_to_check:
            self.check_sequence(model)

    def check_sequence(self, model):
        """Verifica el estado de la secuencia para un modelo específico"""
        if not hasattr(model, '_meta'):
            return
            
        # Buscar el campo de clave primaria
        pk_field = model._meta.pk
        if not pk_field or not hasattr(pk_field, 'auto_created') or not pk_field.auto_created:
            return
            
        table_name = model._meta.db_table
        
        with connection.cursor() as cursor:
            try:
                # Obtener el valor máximo actual de la tabla
                cursor.execute(f"SELECT MAX({pk_field.column}) FROM {table_name}")
                max_id = cursor.fetchone()[0]
                
                # Contar registros
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                
                # Obtener el nombre de la secuencia
                sequence_name = f"{table_name}_{pk_field.column}_seq"
                
                # Verificar si la secuencia existe y obtener su valor actual
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_class 
                        WHERE relname = %s AND relkind = 'S'
                    )
                """, [sequence_name])
                
                sequence_exists = cursor.fetchone()[0]
                
                if sequence_exists:
                    cursor.execute(f"SELECT last_value FROM {sequence_name}")
                    sequence_value = cursor.fetchone()[0]
                    
                    # Verificar si hay problema
                    problem = ""
                    if max_id and sequence_value <= max_id:
                        problem = " ⚠️  PROBLEMA DETECTADO"
                    
                    self.stdout.write(
                        f"{model._meta.label:30} | Max ID: {max_id or 'N/A':>6} | "
                        f"Secuencia: {sequence_value:>6} | Registros: {count:>6}{problem}"
                    )
                else:
                    self.stdout.write(
                        f"{model._meta.label:30} | Max ID: {max_id or 'N/A':>6} | "
                        f"Secuencia: NO EXISTE | Registros: {count:>6}"
                    )
                    
            except Exception as e:
                self.stdout.write(
                    f"{model._meta.label:30} | ERROR: {str(e)}"
                )
