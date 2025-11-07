from django.core.management.base import BaseCommand
from django.db.models import Q
from tesoreria.models import Registro
from decimal import Decimal

class Command(BaseCommand):
    help = 'Concilia los movimientos entre cuentas (MC) verificando que cada transferencia tenga su contrapartida'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fecha-desde',
            type=str,
            help='Fecha desde para filtrar registros (formato: YYYY-MM-DD)',
        )
        parser.add_argument(
            '--fecha-hasta',
            type=str,
            help='Fecha hasta para filtrar registros (formato: YYYY-MM-DD)',
        )
        parser.add_argument(
            '--mostrar-todos',
            action='store_true',
            help='Mostrar todos los registros MC, no solo los sin contrapartida',
        )
        parser.add_argument(
            '--caja1',
            type=int,
            help='ID de la primera caja para filtrar movimientos entre dos cajas específicas',
        )
        parser.add_argument(
            '--caja2',
            type=int,
            help='ID de la segunda caja para filtrar movimientos entre dos cajas específicas',
        )
        parser.add_argument(
            '--caja1-nombre',
            type=str,
            help='Nombre de la primera caja para filtrar movimientos entre dos cajas específicas',
        )
        parser.add_argument(
            '--caja2-nombre',
            type=str,
            help='Nombre de la segunda caja para filtrar movimientos entre dos cajas específicas',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.HTTP_INFO('=' * 60)
        )
        self.stdout.write(
            self.style.HTTP_INFO('CONCILIACIÓN DE MOVIMIENTOS ENTRE CUENTAS (MC)')
        )
        self.stdout.write(
            self.style.HTTP_INFO('=' * 60)
        )

        # Filtrar registros MC
        queryset = Registro.objects.filter(tipo_reg='MC', activo=True)
        
        # Aplicar filtros de fecha si se proporcionan
        if options['fecha_desde']:
            queryset = queryset.filter(fecha_reg__gte=options['fecha_desde'])
            self.stdout.write(f"Filtrando desde: {options['fecha_desde']}")
        
        if options['fecha_hasta']:
            queryset = queryset.filter(fecha_reg__lte=options['fecha_hasta'])
            self.stdout.write(f"Filtrando hasta: {options['fecha_hasta']}")

        # Aplicar filtro de cajas específicas si se proporcionan
        caja1_id = None
        caja2_id = None
        caja1_obj = None
        caja2_obj = None
        
        # Importar Caja al inicio para usar en cualquier caso
        from tesoreria.models import Caja
        
        # Determinar cajas por ID o por nombre
        if options['caja1'] and options['caja2']:
            caja1_id = options['caja1']
            caja2_id = options['caja2']
            try:
                caja1_obj = Caja.objects.get(id=caja1_id)
                caja2_obj = Caja.objects.get(id=caja2_id)
            except Caja.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"Una o ambas cajas no existen (IDs: {caja1_id}, {caja2_id})")
                )
                return
        elif options['caja1_nombre'] and options['caja2_nombre']:
            caja1_nombre = options['caja1_nombre']
            caja2_nombre = options['caja2_nombre']
            try:
                caja1_obj = Caja.objects.get(caja__iexact=caja1_nombre)
                caja2_obj = Caja.objects.get(caja__iexact=caja2_nombre)
                caja1_id = caja1_obj.id
                caja2_id = caja2_obj.id
            except Caja.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"Una o ambas cajas no existen (nombres: {caja1_nombre}, {caja2_nombre})")
                )
                # Mostrar cajas disponibles para ayudar al usuario
                cajas_disponibles = Caja.objects.filter(activo=True).values_list('caja', flat=True)
                self.stdout.write("Cajas disponibles:")
                for caja in cajas_disponibles:
                    self.stdout.write(f"  - {caja}")
                return
        elif (options['caja1'] or options['caja2']) and not (options['caja1'] and options['caja2']):
            self.stdout.write(
                self.style.WARNING("Para filtrar por IDs de cajas específicas, debes proporcionar ambos parámetros: --caja1 y --caja2")
            )
            return
        elif (options['caja1_nombre'] or options['caja2_nombre']) and not (options['caja1_nombre'] and options['caja2_nombre']):
            self.stdout.write(
                self.style.WARNING("Para filtrar por nombres de cajas específicas, debes proporcionar ambos parámetros: --caja1-nombre y --caja2-nombre")
            )
            return
        elif (options['caja1'] or options['caja2']) and (options['caja1_nombre'] or options['caja2_nombre']):
            self.stdout.write(
                self.style.WARNING("No puedes usar filtros por ID y por nombre al mismo tiempo. Usa solo una opción.")
            )
            return
        
        # Aplicar filtro si tenemos ambas cajas
        if caja1_id and caja2_id:
            # Filtrar movimientos que involucren estas dos cajas en cualquier dirección
            queryset = queryset.filter(
                Q(caja_id=caja1_id, caja_contrapartida_id=caja2_id) |
                Q(caja_id=caja2_id, caja_contrapartida_id=caja1_id)
            )
            
            self.stdout.write(f"Filtrando movimientos entre: {caja1_obj.caja} (ID: {caja1_id}) ↔ {caja2_obj.caja} (ID: {caja2_id})")

        movimientos_mc = queryset.order_by('fecha_reg', 'caja_id')
        
        if not movimientos_mc.exists():
            self.stdout.write(
                self.style.WARNING('No se encontraron registros de movimientos entre cuentas (MC)')
            )
            return

        self.stdout.write(f"\nTotal de registros MC encontrados: {movimientos_mc.count()}")
        self.stdout.write("-" * 60)

        registros_sin_contrapartida: list[Registro] = []
        registros_conciliados = []
        
        for movimiento in movimientos_mc:
            # Buscar la contrapartida en la caja destino
            contrapartida = self.buscar_contrapartida(movimiento)
            
            if contrapartida:
                registros_conciliados.append((movimiento, contrapartida))
                if options['mostrar_todos']:
                    self.mostrar_movimiento_conciliado(movimiento, contrapartida)
            else:
                registros_sin_contrapartida.append(movimiento)
                self.mostrar_movimiento_sin_contrapartida(movimiento)

        # Resumen final
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(
            self.style.HTTP_INFO('RESUMEN DE CONCILIACIÓN')
        )
        self.stdout.write("=" * 60)
        
        self.stdout.write(
            self.style.SUCCESS(f"Registros conciliados: {len(registros_conciliados)}")
        )
        self.stdout.write(
            self.style.ERROR(f"Registros SIN contrapartida: {len(registros_sin_contrapartida)}")
        )
        
        if registros_sin_contrapartida:
            self.stdout.write("\n" + self.style.ERROR("⚠️  REGISTROS QUE REQUIEREN ATENCIÓN:"))
            for registro in registros_sin_contrapartida:
                monto_formateado = f"${registro.monto_op_rec:,.2f}" if registro.monto_op_rec else "$0.00"
                self.stdout.write(
                    self.style.ERROR(f"  - ID {registro.id}: {registro.fecha_reg} | "
                                   f"{monto_formateado} | "
                                   f"{registro.caja.caja} → {registro.caja_contrapartida.caja if registro.caja_contrapartida else 'N/A'} - {registro.observacion}")
                )
        else:
            self.stdout.write(
                self.style.SUCCESS("\n✅ Todos los movimientos están correctamente conciliados")
            )

    def buscar_contrapartida(self, movimiento_origen):
        """
        Busca la contrapartida de un movimiento MC en la caja destino.
        La contrapartida debe tener:
        - tipo_reg = 'MC'
        - fecha_reg = misma fecha
        - caja = caja_contrapartida del movimiento origen
        - caja_contrapartida = caja del movimiento origen  
        - monto_op_rec = monto opuesto (mismo valor absoluto, signo opuesto)
        """
        if not movimiento_origen.caja_contrapartida:
            return None
            
        # Buscar contrapartida con criterios estrictos
        contrapartidas = Registro.objects.filter(
            tipo_reg='MC',
            fecha_reg=movimiento_origen.fecha_reg,
            caja=movimiento_origen.caja_contrapartida,
            caja_contrapartida=movimiento_origen.caja,
            activo=True
        )
        
        # Verificar monto opuesto
        monto_origen = movimiento_origen.monto_op_rec or Decimal('0')
        for contrapartida in contrapartidas:
            monto_contrapartida = contrapartida.monto_op_rec or Decimal('0')
            
            # Los montos deben ser opuestos (suma = 0)
            if abs(monto_origen + monto_contrapartida) < Decimal('0.01'):  # Tolerancia para decimales
                return contrapartida
                
        return None

    def mostrar_movimiento_sin_contrapartida(self, movimiento):
        """Muestra información detallada de un movimiento sin contrapartida"""
        caja_origen = movimiento.caja.caja if movimiento.caja else 'N/A'
        caja_destino = movimiento.caja_contrapartida.caja if movimiento.caja_contrapartida else 'N/A'
        monto = movimiento.monto_op_rec or Decimal('0')
        monto_formateado = f"${monto:,.2f}"
        
        self.stdout.write(
            self.style.ERROR(f"❌ SIN CONTRAPARTIDA - ID: {movimiento.id}")
        )
        self.stdout.write(f"   📅 Fecha: {movimiento.fecha_reg}")
        self.stdout.write(f"   💰 Monto: {monto_formateado}")
        self.stdout.write(f"   🏦 Desde: {caja_origen}")
        self.stdout.write(f"   🏦 Hacia: {caja_destino}")
        self.stdout.write(f"   📝 Obs: {movimiento.observacion or 'Sin observaciones'}")
        self.stdout.write("-" * 40)

    def mostrar_movimiento_conciliado(self, movimiento, contrapartida):
        """Muestra información de un movimiento correctamente conciliado"""
        caja_origen = movimiento.caja.caja if movimiento.caja else 'N/A'
        caja_destino = movimiento.caja_contrapartida.caja if movimiento.caja_contrapartida else 'N/A'
        monto_origen = movimiento.monto_op_rec or Decimal('0')
        monto_contrapartida = contrapartida.monto_op_rec or Decimal('0')
        monto_origen_formateado = f"${monto_origen:,.2f}"
        monto_contrapartida_formateado = f"${monto_contrapartida:,.2f}"
        
        self.stdout.write(
            self.style.SUCCESS(f"✅ CONCILIADO - IDs: {movimiento.id} ↔ {contrapartida.id}")
        )
        self.stdout.write(f"   📅 Fecha: {movimiento.fecha_reg}")
        self.stdout.write(f"   💰 Montos: {monto_origen_formateado} ↔ {monto_contrapartida_formateado}")
        self.stdout.write(f"   🏦 Cajas: {caja_origen} ↔ {caja_destino}")
        self.stdout.write("-" * 40)
