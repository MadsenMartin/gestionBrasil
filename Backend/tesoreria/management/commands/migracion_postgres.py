import json
import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

class Command(BaseCommand):
    help = 'Carga un archivo de backup respetando las dependencias'

    def add_arguments(self, parser):
        parser.add_argument('backup_file', type=str, help='Archivo de backup JSON')

    @transaction.atomic
    def handle(self, *args, **options):
        backup_file = options['backup_file']
        
        # Orden corregido - grupos ANTES que usuarios
        model_order = [
            'auth.group',                    # Primero los grupos
            'auth.permission',               # Luego permisos
            'auth.user',                     # Después usuarios
            'tesoreria.caja',
            'iva.persona', 
            'iva.unidaddenegocio',
            'iva.clienteproyecto',
            'iva.imputacion',
            'tesoreria.presupuesto',
            'tesoreria.dolarmep',
            'tesoreria.certificadoobra',
            'presupuestos_cliente.presupuestocliente',
            'presupuestos_cliente.itempresupuestocliente',
            'tesoreria.registro',
            'inversiones.inversor',
            'iva.tiposdocumento',
            'iva.documento',
        ]
        
        self.stdout.write("Leyendo archivo de backup...")
        with open(backup_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Agrupar por modelo
        models_data = {}
        for item in data:
            model = item['model']
            if model not in models_data:
                models_data[model] = []
            models_data[model].append(item)
        
        self.stdout.write(f"Modelos encontrados: {sorted(models_data.keys())}")
        
        # Cargar en orden
        for model in model_order:
            if model in models_data:
                self.stdout.write(f"Cargando {len(models_data[model])} registros de {model}...")
                
                # Crear archivo temporal
                temp_file = f'temp_{model.replace(".", "_")}.json'
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(models_data[model], f, ensure_ascii=False)
                
                try:
                    call_command('loaddata', temp_file, verbosity=0)
                    self.stdout.write(self.style.SUCCESS(f"✓ {model}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ Error en {model}: {e}"))
                    # Mostrar contenido del primer registro para debug
                    if models_data[model]:
                        self.stdout.write(f"Primer registro: {models_data[model][0]}")
                    raise
                finally:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
        
        # Cargar modelos restantes que no están en el orden definido
        loaded_models = set(model_order)
        remaining_models = set(models_data.keys()) - loaded_models
        
        if remaining_models:
            self.stdout.write(f"Cargando modelos adicionales: {remaining_models}")
            for model in sorted(remaining_models):
                self.stdout.write(f"Cargando {len(models_data[model])} registros de {model}...")
                
                temp_file = f'temp_{model.replace(".", "_")}.json'
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(models_data[model], f, ensure_ascii=False)
                
                try:
                    call_command('loaddata', temp_file, verbosity=0)
                    self.stdout.write(self.style.SUCCESS(f"✓ {model}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"⚠ Error en {model}: {e}"))
                    # No hacer raise para modelos adicionales
                finally:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
        
        self.stdout.write(self.style.SUCCESS("Backup cargado exitosamente!"))