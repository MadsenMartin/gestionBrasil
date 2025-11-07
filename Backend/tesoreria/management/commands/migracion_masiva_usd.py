import csv
from django.conf import settings
from django.core.management.base import BaseCommand
from tesoreria.models import Registro, Caja, Presupuesto, DolarMEP
from iva.models import Persona, ClienteProyecto, UnidadDeNegocio, Imputacion
from decimal import Decimal, InvalidOperation
import time
from django.db import transaction
from django.db.models.functions import Coalesce
from django.db.models import Value, Sum, DecimalField
from datetime import datetime
from django.db.models.signals import post_save
from tesoreria.signals import crear_tareas_aprobacion

class Command(BaseCommand):
    help = 'Importar datos desde un archivo CSV'

    def add_arguments(self, parser):
        parser.add_argument('caja', type=str, help='El nombre de la caja de la cual se consultará el saldo al finalizar la importación')
        parser.add_argument('csv_file', type=str, help='El nombre del archivo CSV a importar (debe estar en tesoreria/management/commands/)')

    def convert_to_decimal(self, value):
        if not value:
            return None  # Retorna None para valores vacíos
        try:
            # Reemplaza la coma por un punto para la conversión a Decimal
            if value.__contains__(','):
                #self.stdout.write(self.style.WARNING(value))
                value = value.replace(',', '.')
                #self.stdout.write(self.style.SUCCESS(value))
                value = Decimal(value).quantize(Decimal('0.0000'))
                #self.stdout.write(self.style.SUCCESS(value))
                return value
            else: 
                value = value.replace(',', '.')
                # Convierte a Decimal y asegura dos decimales
                return Decimal(value)
            #return Decimal(value).quantize(Decimal('0.00'))
        except (InvalidOperation, Exception):
            return None

    def get_proveedor_caja(self,registro) -> tuple[Persona|None, Caja|None]:
        contrapartida:str = registro['Contrapartida']
        tipo_reg = registro['Tipo Doc']
        if contrapartida == '' or not contrapartida:
            return None, None
        if tipo_reg == 'MC':
            return None, self.get_caja(contrapartida)
        else:
            proveedor = Persona.objects.filter(nombre_fantasia__icontains=contrapartida.lower()).first()
            if not proveedor:
                self.stdout.write(self.style.WARNING(f'No se encontró el proveedor {contrapartida}'))
                while True:
                    confirm = input("¿Desea buscar el proveedor manualmente? (s/n): ").strip().lower()
                    if confirm == 's':
                        contrapartida = input("Ingrese el proveedor: ").strip()
                        proveedor = Persona.objects.filter(nombre_fantasia__icontains=contrapartida.lower()).first()
                        if proveedor:
                            self.stdout.write(self.style.SUCCESS(f'Proveedor encontrado: {proveedor}'))
                            return proveedor, None
                        else:
                            self.stdout.write(self.style.ERROR(f'No se encontró el proveedor {contrapartida}'))
                            confirm = None
                    elif confirm == 'n':
                        while True:
                            confirm = input("¿Desea crear un nuevo proveedor? (s/n): ").strip().lower()
                            if confirm == 's':
                                try:
                                    proveedor = Persona.objects.create(nombre_fantasia=contrapartida)
                                    self.stdout.write(self.style.SUCCESS(f'Proveedor creado: {proveedor}'))
                                    return proveedor, None
                                except Exception as e:
                                    self.stdout.write(self.style.ERROR(f'Error al crear el proveedor {contrapartida}: {e}'))
                                    raise e
                            elif confirm == 'n':
                                self.stdout.write(self.style.ERROR('No se creó el proveedor, el registro se cargará sin proveedor'))
                                return None, None
                            else:
                                self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
                                confirm = None
                    else:
                        self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
            else:
                return proveedor, None
    
    def get_cliente_proyecto(self, cliente_proyecto:str) -> ClienteProyecto|None:
        if cliente_proyecto == '' or not cliente_proyecto:
            return None
        proyecto_instance = ClienteProyecto.objects.filter(cliente_proyecto=cliente_proyecto).first()
        if not proyecto_instance:
            self.stdout.write(self.style.WARNING(f'No se encontró el cliente/proyecto {cliente_proyecto}, reintentando...'))
            proyecto_instance = ClienteProyecto.objects.filter(cliente_proyecto__icontains=cliente_proyecto.lower()).first()
            if proyecto_instance:
                self.stdout.write(self.style.SUCCESS(f'Cliente/proyecto encontrado: {proyecto_instance}'))
                return proyecto_instance
            else:
                while True:
                    confirm = input("¿Desea buscar el cliente/proyecto manualmente? (s/n): ").strip().lower()
                    if confirm == 's':
                        cliente_proyecto = input("Ingrese el cliente/proyecto: ").strip()
                        proyecto_instance = ClienteProyecto.objects.filter(cliente_proyecto=cliente_proyecto).first()
                        if proyecto_instance:
                            self.stdout.write(self.style.SUCCESS(f'Cliente/proyecto encontrado: {proyecto_instance}'))
                            return proyecto_instance
                        else:
                            self.stdout.write(self.style.ERROR(f'No se encontró el cliente/proyecto {cliente_proyecto}'))
                            confirm = None
                    elif confirm == 'n':
                        while True:
                            confirm = input("¿Desea crear un nuevo cliente/proyecto? (s/n): ").strip().lower()
                            if confirm == 's':
                                try:
                                    proyecto_instance = ClienteProyecto.objects.create(cliente_proyecto=cliente_proyecto)
                                    self.stdout.write(self.style.SUCCESS(f'Cliente/proyecto creado: {proyecto_instance}'))
                                    return proyecto_instance
                                except Exception as e:
                                    self.stdout.write(self.style.ERROR(f'Error al crear el cliente/proyecto {cliente_proyecto}: {e}'))
                                    raise e
                            elif confirm == 'n':
                                self.stdout.write(self.style.ERROR('No se creó el cliente/proyecto, el registro se cargará sin cliente/proyecto'))
                                return None
                            else:
                                self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
                                confirm = None
                    else:
                        self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
        else:
            return proyecto_instance

    def get_presupuesto(self, nombre:str, proveedor: Persona, row: list[str]) -> Presupuesto:
        partes = nombre.split(' - ')
        proveedor_busqueda = None if partes[1] == '' else (Persona.objects.filter(nombre_fantasia=partes[1]).first() or proveedor)
        observacion = " - ".join(partes[2:]) if len(partes) > 1 else None
        cliente_proyecto = ClienteProyecto.objects.filter(cliente_proyecto__icontains=partes[0].lower()).first() if partes[0] != '' else None
        # Construcción dinámica de filtros
        filtros: dict[str, object] = {'proveedor': proveedor_busqueda}
        if cliente_proyecto:
            filtros['cliente_proyecto'] = cliente_proyecto
        if observacion:
            filtros['observacion__icontains'] = observacion.lower()

        presupuesto = Presupuesto.objects.filter(**filtros).first()
        if presupuesto:
            return presupuesto
        self.stdout.write(self.style.WARNING(f'No se encontró el presupuesto {nombre} de la linea {row['Reg']}'))
        
        # Buscar presupuestos por cliente/proyecto y proveedor para mostrar opciones
        presupuestos = Presupuesto.objects.filter(
            proveedor=proveedor_busqueda,
            cliente_proyecto__cliente_proyecto=partes[0],
            activo=True,
        )
        if presupuestos.exists():
            self.stdout.write("Opciones de presupuestos encontrados:")
            for i, presupuesto in enumerate(presupuestos):
                self.stdout.write(f"{i+1}. {presupuesto}")
            input_num = input("Seleccione el número del presupuesto que desea usar (o presione Enter para buscar manualmente): ").strip()
            if input_num.isdigit() and 1 <= int(input_num) <= len(presupuestos):
                presupuesto = presupuestos[int(input_num) - 1]
                self.stdout.write(self.style.SUCCESS(f'Presupuesto seleccionado: {presupuesto}'))
                return presupuesto

        while True:
            confirm = input("¿Desea buscar el presupuesto manualmente? (s/n): ").strip().lower()
            if confirm == 's':
                obra = input(f"Ingrese el cliente/proyecto (default: {partes[0]}): ").strip()
                if obra == '': obra = partes[0]

                while True:
                    proveedor = input(f"Ingrese el proveedor (default: {proveedor if proveedor else ''}): ").strip()
                    if proveedor != '': proveedor_busqueda = Persona.objects.filter(nombre_fantasia=proveedor).first()
                    if not proveedor_busqueda:
                        self.stdout.write(self.style.ERROR(f'No se encontró el proveedor {proveedor}'))
                        proveedor = None
                    else:
                        break

                observacion = input(f"Ingrese la observación del presupuesto (default: {partes[2] if len(partes)>1 else ''}): ").strip()
                if observacion == '': observacion = partes[2] if len(partes)>1 else ''
                presupuesto = Presupuesto.objects.filter(
                    proveedor=proveedor_busqueda,
                    cliente_proyecto__cliente_proyecto=obra,
                    observacion=observacion,
                ).first()
                if presupuesto:
                    self.stdout.write(self.style.SUCCESS(f'Presupuesto encontrado: {presupuesto}'))
                    return presupuesto
                else:
                    self.stdout.write(self.style.ERROR(f'No se encontró el presupuesto {partes[0]} - {proveedor if proveedor else ""} - {observacion} de la linea {row['Reg']}'))
                    confirm = None
            elif confirm == 'n':
                break
            else:
                self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
        
        while True:
            confirm = input("¿Desea crear un nuevo presupuesto? (s/n): ").strip().lower()
            if confirm == 's':
                #if len(partes) > 1 and partes[1] != '' and partes[1].lower() != proveedor.nombre_fantasia.lower():
                #    self.stdout.write(self.style.WARNING(f'El proveedor {proveedor.nombre_fantasia} no coincide con el presupuesto {nombre}'))
                fecha = input("Ingrese la fecha del presupuesto (default 2019-01-01): ").strip()
                if fecha == '': fecha = '2019-01-01'
                monto = input("Ingrese el monto del presupuesto (default: 0): ").strip()
                if monto == '': monto = 0
                post_save.disconnect(sender=Presupuesto, receiver=crear_tareas_aprobacion)
                try:
                    presupuesto = Presupuesto.objects.create(
                        fecha=fecha,
                        cliente_proyecto=ClienteProyecto.objects.get(cliente_proyecto=partes[0]),
                        proveedor=proveedor,
                        observacion=partes[2],
                        activo=True,
                        monto=monto
                    )
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error al crear el presupuesto {nombre}: {e}'))
                    post_save.connect(sender=Presupuesto, receiver=crear_tareas_aprobacion)
                    raise e
                self.stdout.write(self.style.SUCCESS(f'Presupuesto creado: {nombre}'))
                post_save.connect(sender=Presupuesto, receiver=crear_tareas_aprobacion)
                return presupuesto
            elif confirm == 'n':
                self.stdout.write(self.style.ERROR('No se creó el presupuesto, el registro se cargará sin presupuesto'))
                return None
            else:
                self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
    
    def get_caja(self, caja:str) -> Caja|None:
        if caja == '' or not caja:
            return None
        caja_instance = Caja.objects.filter(caja=caja).first()
        if not caja_instance:
            self.stdout.write(self.style.WARNING(f'No se encontró la caja {caja}'))
            while True:
                confirm = input("¿Desea buscar la caja manualmente? (s/n): ").strip().lower()
                if confirm == 's':
                    caja = input("Ingrese la caja: ").strip()
                    caja_instance = Caja.objects.filter(caja=caja).first()
                    if caja_instance:
                        self.stdout.write(self.style.SUCCESS(f'Caja encontrada: {caja_instance}'))
                        return caja_instance
                    else:
                        self.stdout.write(self.style.ERROR(f'No se encontró la caja {caja}'))
                        confirm = None
                elif confirm == 'n':
                    while True:
                        confirm = input("¿Desea crear una nueva caja? (s/n): ").strip().lower()
                        if confirm == 's':
                            try:
                                caja_instance = Caja.objects.create(caja=caja)
                                self.stdout.write(self.style.SUCCESS(f'Caja creada: {caja_instance}'))
                                return caja_instance
                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f'Error al crear la caja {caja}: {e}'))
                                raise e
                        elif confirm == 'n':
                            self.stdout.write(self.style.ERROR('No se creó la caja, el registro se cargará sin caja'))
                            return None
                        else:
                            self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
                            confirm = None
                else:
                    self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
        else:
            return caja_instance
    
    def controlar_mc(self, row: dict, caja_contrapartida: str|None, caja: Caja):
        if not caja_contrapartida:
            return
        else:
            if row['Tipo Doc'] == 'MC':
                balance = Registro.objects.filter(
                    caja_contrapartida=caja_contrapartida,
                    activo=True,
                    fecha_reg=row['Fecha Reg'],
                    monto_op_rec=-self.convert_to_decimal(row['Monto OP/REC'])).exists()
                if not balance:
                    self.stdout.write(self.style.ERROR(f'No se encontró el balance de MC para la caja {caja_contrapartida.caja} en la fecha {row["Fecha Reg"]} con el monto {row["Monto OP/REC"]}'))
                    while True:
                        confirm = input("¿Desea crear un nuevo balance de MC? (s/n): ").strip().lower()
                        if confirm == 's':
                            try:
                                Registro.objects.create(
                                    fecha_reg=datetime.strptime(row["Fecha Reg"], "%Y-%m-%d").date() if row["Fecha Reg"] else None,
                                    tipo_reg='MC',
                                    caja_contrapartida=self.get_caja(caja),
                                    monto_op_rec=-self.convert_to_decimal(row['Monto OP/REC']),
                                    activo=True,
                                    caja=self.get_caja(caja_contrapartida),
                                    realizado=True,
                                    observacion=row['Observaciones'] if row['Observaciones'] != '' else None,
                                    imputacion=Imputacion.objects.get(imputacion=row["Imputación"]) if row["Imputación"] != '' else None,
                                    añomes_imputacion=row["Añomes mov. en cta."],
                                    tipo_de_cambio=Decimal(1.00),
                                    moneda=1)
                                self.stdout.write(self.style.SUCCESS(f'Balance de MC creado para la caja {caja_contrapartida.caja} en la fecha {row["Fecha Reg"]} con el monto {row["Monto OP/REC"]}'))
                                return
                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f'Error al crear el balance de MC: {e}'))
                                raise e
                        elif confirm == 'n':
                            self.stdout.write(self.style.ERROR('No se creó el balance de MC, el registro se cargará sin balance de MC'))
                            return
                        else:
                            self.stdout.write(self.style.ERROR('Opción no válida. Por favor, ingrese "s" o "n".'))
                            confirm = None
            else:
                self.stdout.write(self.style.ERROR(f'El tipo de documento {row["Tipo Doc"]} no es MC, pero el registro tiene una caja contrapartida {caja_contrapartida.caja}'))
                return
    
    def get_tipo_cambio(self, row: dict) -> Decimal:
        try:
            if row['Tipo de cambio'] == '1' or row['Tipo de cambio'] == '':
                return DolarMEP.objects.get(fecha=row['Fecha Reg']).venta
            else:
                return Decimal(row['Tipo de cambio'])
        except DolarMEP.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'No se encontró el tipo de cambio para la fecha {row["Fecha Reg"]}'))
            return Decimal(1.00)


    @transaction.atomic
    def handle(self, *args, **kwargs):
        file:str = kwargs['csv_file']
        caja:str = kwargs['caja']
        if file.__contains__('.') and not file.endswith('.csv'):
            self.stdout.write(self.style.ERROR('El archivo debe tener formato CSV UTF-8'))
            return
        elif not file.__contains__('.'):
            file = file + '.csv'
        file_path = f'tesoreria/management/commands/{file}'

        # Try para manejar el caso de que el archivo no exista
        try:
            with open(file_path, newline='', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile, delimiter=';')
                total_rows = sum(1 for row in open(file_path, encoding='utf-8-sig')) - 1  # Cuenta las filas excluyendo el encabezado
                processed_rows = 0
                update_interval = 100  # Muestra el progreso cada 100 filas
                start_time = time.time()

                for row in reader:
                    if row['Tipo Doc'] == '':
                        self.stdout.write(self.style.WARNING(f'Fila {row["Reg"]} sin tipo de documento, se omite'))
                        continue
                    try:
                        # Obtener el proveedor y la caja de contrapartida
                        proveedor, caja_contrapartida = self.get_proveedor_caja(row)
                        tc = self.get_tipo_cambio(row)
                        print("TC: ", tc)
                        print("Monto OP/REC: ", self.convert_to_decimal(row['Monto OP/REC'])*tc)
                        #print("TC: ", tc)
                        Registro.objects.create(
                            fecha_reg=datetime.strptime(row["Fecha Reg"], "%Y-%m-%d").date() if row["Fecha Reg"] else None,  # Convierte la fecha
                            tipo_reg=row["Tipo Doc"],
                            nro_documento=row["# Doc"] if row["# Doc"] != '' else None,
                            añomes_imputacion=row["Añomes mov. en cta."],
                            unidad_de_negocio=UnidadDeNegocio.objects.get(unidad_de_negocio=row["Unidad de Negocio"]) if row["Unidad de Negocio"] != '' else None,
                            cliente_proyecto=self.get_cliente_proyecto(row["Cliente/Proyecto"]),
                            proveedor=proveedor,
                            caja_contrapartida=caja_contrapartida,
                            imputacion=Imputacion.objects.get(imputacion=row["Imputación"]) if row["Imputación"] != '' else None,
                            observacion=row["Observaciones"] if row["Observaciones"] != '' else None,
                            presupuesto=self.get_presupuesto(row["ID_Presupuesto"], proveedor, row) if row["ID_Presupuesto"] != '' else None,
                            monto_gasto_ingreso_neto=self.convert_to_decimal(row["Monto Gasto / Ingreso (s/IVA)"])* tc if row["Monto Gasto / Ingreso (s/IVA)"] else None,
                            iva_gasto_ingreso=self.convert_to_decimal(row["IVA Gasto / Ingreso"])* tc if row["IVA Gasto / Ingreso"] else None,
                            monto_op_rec=self.convert_to_decimal(row["Monto OP/REC"])* tc if row["Monto OP/REC"] else None,
                            caja=self.get_caja(row["Cuenta"]),
                            realizado=True,
                            activo=True,
                            numero_cheque=row["# Cheque / Trx"] if row["# Cheque / Trx"] != '' else None,
                            tipo_de_cambio=tc,
                            moneda=2,
                        )

                        self.controlar_mc(row, caja_contrapartida, caja)

                    except Exception as e:
                        print("Fila: ", row)
                        self.stdout.write(self.style.ERROR(f'Error al importar datos: {e}'))
                        # Si ocurre un error, se hace rollback de la transacción
                        transaction.set_rollback(True)
                        return

                    processed_rows += 1

                    if processed_rows % update_interval == 0:
                        elapsed_time = time.time() - start_time
                        self.stdout.write(f'Procesando fila: {processed_rows}/{total_rows} - Tiempo transcurrido: {elapsed_time:.2f} segundos')

                # Preguntar si se desea hacer un commit de la transacción
                caja = Caja.objects.get(caja=caja)
                
                # Obtener el saldo de la caja
                saldo_caja = Registro.objects.filter(
                        caja=caja,
                        activo=True  
                    ).aggregate(
                        saldo=Coalesce(
                            Sum('monto_op_rec', output_field=DecimalField()), 
                            Value(Decimal('0.00'))
                        )
                )['saldo']

                self.stdout.write(self.style.SUCCESS(f'Saldo de la caja: {saldo_caja}'))
                confirm = input("¿Desea hacer un commit de la transacción? (s/n): ").strip().lower()
                if confirm == 's':
                    self.stdout.write(self.style.SUCCESS('Transacción confirmada'))
                else:
                    transaction.set_rollback(True)
                    self.stdout.write(self.style.ERROR('Transacción revertida'))
                    return
            
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'El archivo {file_path} no existe'))
            return

        self.stdout.write(self.style.SUCCESS('Datos importados exitosamente'))