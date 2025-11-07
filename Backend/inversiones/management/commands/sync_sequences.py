from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = 'Sincroniza las secuencias de PostgreSQL con los valores máximos actuales de las tablas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--app',
            type=str,
            help='Especifica una app en particular (ej: inversiones)',
        )
        parser.add_argument(
            '--model',
            type=str,
            help='Especifica un modelo en particular (ej: AsientoInversor)',
        )

    def handle(self, *args, **options):
        app_label = options.get('app')
        model_name = options.get('model')
        
        if app_label and model_name:
            # Sincronizar un modelo específico
            try:
                model = apps.get_model(app_label, model_name)
                self.sync_sequence(model)
            except LookupError:
                self.stdout.write(
                    self.style.ERROR(f'Modelo {app_label}.{model_name} no encontrado')
                )
        elif app_label:
            # Sincronizar todos los modelos de una app
            try:
                app_config = apps.get_app_config(app_label)
                for model in app_config.get_models():
                    self.sync_sequence(model)
            except LookupError:
                self.stdout.write(
                    self.style.ERROR(f'App {app_label} no encontrada')
                )
        else:
            # Sincronizar todos los modelos
            for model in apps.get_models():
                self.sync_sequence(model)

    def sync_sequence(self, model):
        """Sincroniza la secuencia de PostgreSQL para un modelo específico"""
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
                
                if max_id is None:
                    max_id = 1
                else:
                    max_id += 1
                
                # Obtener el nombre de la secuencia
                sequence_name = f"{table_name}_{pk_field.column}_seq"
                
                # Verificar si la secuencia existe
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_class 
                        WHERE relname = %s AND relkind = 'S'
                    )
                """, [sequence_name])
                
                sequence_exists = cursor.fetchone()[0]
                
                if sequence_exists:
                    # Sincronizar la secuencia
                    cursor.execute(f"SELECT setval('{sequence_name}', %s, false)", [max_id])
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Secuencia sincronizada: {sequence_name} -> {max_id}'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Secuencia no encontrada: {sequence_name}'
                        )
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Error sincronizando {table_name}: {str(e)}'
                    )
                )
