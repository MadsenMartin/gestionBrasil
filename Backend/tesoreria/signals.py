from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Presupuesto, Tarea, Notificacion, EstadoPresupuesto, Registro
import threading
from tesoreria.mails import mail_nuevo_presupuesto, mail_gasto_a_recuperar

# Constantes para EstadoPresupuesto
APROBADO = 2
RECHAZADO = 99

@receiver(pre_save, sender=Registro)
def alerta_gasto_a_recuperar(sender, instance, **kwargs):
    """
    Esta función envía una alerta por correo cuando un registro tiene el presupuesto "A REEMBOLSAR POR EL CLIENTE".
    Se ejecuta en pre_save para comparar el estado anterior con el nuevo.
    """
    # Verificar si el presupuesto nuevo tiene la observación "A REEMBOLSAR POR EL CLIENTE"
    presupuesto_nuevo_es_reembolso = (
        instance.presupuesto and 
        instance.presupuesto.observacion == "A REEMBOLSAR POR EL CLIENTE"
    )
    
    enviar_alerta = False
    
    if not instance.pk:
        # Caso 1: Nuevo registro
        if presupuesto_nuevo_es_reembolso:
            enviar_alerta = True
    else:
        # Caso 2: Registro existente, verificar si cambió
        if presupuesto_nuevo_es_reembolso:
            try:
                # Obtener el estado actual desde la BD (antes del cambio)
                registro_anterior = Registro.objects.select_related('presupuesto').get(pk=instance.pk)
                
                # Verificar si el presupuesto cambió
                presupuesto_cambio = registro_anterior.presupuesto != instance.presupuesto
                
                if presupuesto_cambio:
                    # El presupuesto cambió, verificar si antes NO era reembolso
                    presupuesto_anterior_era_reembolso = (
                        registro_anterior.presupuesto and 
                        registro_anterior.presupuesto.observacion == "A REEMBOLSAR POR EL CLIENTE"
                    )
                    
                    if not presupuesto_anterior_era_reembolso:
                        enviar_alerta = True
                    
            except Registro.DoesNotExist:
                # Si no existe el registro anterior (raro), enviamos alerta por seguridad
                enviar_alerta = True
    
    if enviar_alerta:
        # Enviar alerta por correo en un hilo separado
        thread = threading.Thread(
            target=mail_gasto_a_recuperar, 
            args=(instance,)
        )
        thread.daemon = True
        thread.start()


# Este decorador permite que la función que lo precede sea llamada cada vez que se guarde un objeto de la clase Presupuesto
'''@receiver(post_save, sender=Presupuesto)
def crear_tareas_aprobacion(sender, instance, created, **kwargs):
    # Esta función crea una tarea para cada usuario que pertenezca al grupo 'Administración - 1' cada vez que se crea un presupuesto.
    if created:
        # Los usuarios que pertenecen al grupo 'Administración - 1' son los aprobadores de presupuestos, por lo que reciben esta tarea
        aprobadores = User.objects.filter(groups__name='Administración - 1')
        for aprobador in aprobadores:
            Tarea.objects.create(
                presupuesto=instance,
                asignado_a=aprobador,
                estado = 1,
                descripcion=f"Aprobar/rechazar presupuesto: {instance}",
                link_to="/presupuestos/"
            )
            Notificacion.objects.create(
                usuario=aprobador,
                mensaje=f"Nuevo presupuesto pendiente de aprobación: {instance}",
            )

        # Iniciar un hilo para enviar los correos en segundo plano
        thread = threading.Thread(
            target=mail_nuevo_presupuesto, 
            args=(instance,)
        )
        thread.daemon = True  # El hilo se cerrará cuando termine el programa principal
        thread.start()


@receiver(post_save, sender=EstadoPresupuesto)
def marcar_tarea_aprobacion_como_realizada(sender, instance: EstadoPresupuesto, created, **kwargs):
    # Esta función marca como realizada la tarea de aprobación de presupuesto cada vez que se crea una instancia de EstadoPresupuesto donde estado es aprobado o rechazado.
    if created:
        if instance.estado == APROBADO:
            tareas = Tarea.objects.filter(presupuesto=instance.presupuesto)
            for tarea in tareas:
                tarea.estado = 3
                tarea.save()
                Notificacion.objects.create(
                    usuario=tarea.asignado_a,
                    mensaje=f"Presupuesto aprobado por {instance.usuario.username}: {instance.presupuesto}",
                )
        elif instance.estado == RECHAZADO:
            tareas = Tarea.objects.filter(presupuesto=instance.presupuesto)
            for tarea in tareas:
                tarea.estado = 3
                tarea.save()
                Notificacion.objects.create(
                    usuario=tarea.asignado_a,
                    mensaje=f"Presupuesto rechazado por {instance.usuario.username}: {instance.presupuesto}",
                )'''