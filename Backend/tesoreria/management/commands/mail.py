from django.core.mail import send_mail
from django.core.management.base import BaseCommand
import time

class Command(BaseCommand):
    help = 'Envía un correo electrónico de prueba'

    def handle(self, *args, **kwargs):
        self.stdout.write('Intentando enviar correo...')
        
        try:
            # Establece un timeout para la operación
            start_time = time.time()
            
            send_mail(
                "Correo de prueba",
                "Este es un mensaje de prueba desde Django.",
                "martinm@estudiotrivelloni.com.ar",
                ["martinf.madsen159@gmail.com"],
                fail_silently=False,
            )
            
            elapsed_time = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f'Correo enviado exitosamente en {elapsed_time:.2f} segundos'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error al enviar correo: {str(e)}'))