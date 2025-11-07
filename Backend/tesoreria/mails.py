from django.contrib.auth.models import User
from tesoreria.models import Comentario, Presupuesto
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

def mail_mencion_comentario_presupuesto(mencionado: User,comentario: Comentario,presupuesto: Presupuesto):
    """
    Envía un correo electrónico al usuario mencionado en un comentario de presupuesto.
    """
    subject = f"{comentario.usuario} te mencionó en el presupuesto {presupuesto}"
    from_email = settings.EMAIL_HOST_USER
    
    # Context for template rendering
    context = {
        'mencionado': mencionado,
        'presupuesto': presupuesto,
        'comentario': comentario,
    }
    
    # Render the plain text content
    text_content = render_to_string(
        "emails/comentario_presupuesto.txt",
        context=context
    )
    
    # Render the HTML content
    html_content = render_to_string(
        "emails/comentario_presupuesto.html",
        context=context
    )
    
    # Create the email message
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=from_email,
        to=[mencionado.email]
    )
    
    # Attach the HTML version
    msg.attach_alternative(html_content, "text/html")
    
    # Send the email
    msg.send()

def mail_nuevo_presupuesto(presupuesto: Presupuesto):
    subject = f"Nuevo presupuesto - {presupuesto}"
    from_email = settings.EMAIL_HOST_USER
    usuarios = User.objects.filter(groups__name='Notificaciones - Tesorería')
    
    for usuario in usuarios:
        # Context for template rendering
        context = {
            'usuario': usuario,
            'presupuesto': presupuesto
        }
        
        # Render the plain text content
        text_content = render_to_string(
            "emails/presupuesto.txt",
            context=context
        )
        
        # Render the HTML content
        html_content = render_to_string(
            "emails/presupuesto.html",
            context=context
        )
        
        # Create the email message
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[usuario.email]
        )
        
        # Attach the HTML version
        msg.attach_alternative(html_content, "text/html")
        
        # Send the email
        msg.send()

def mail_gasto_a_recuperar(registro):
    """
    Envía un correo electrónico a los usuarios del grupo correspondiente cuando se registra un gasto a reembolsar por el cliente.
    El grupo depende de la unidad de negocio:
    - Si es "Inversiones" → grupo "AlertaGastoARecuperar-Inversiones"
    - Si es otra → grupo "AlertaGastoARecuperar"
    """
    from .models import Registro  # Import local para evitar imports circulares
    
    # Determinar el grupo según la unidad de negocio
    if (registro.unidad_de_negocio and 
        registro.unidad_de_negocio.unidad_de_negocio == "Inversiones"):
        grupo_nombre = "AlertaGastoARecuperar-Inversiones"
        unidad_texto = "Inversiones"
    else:
        grupo_nombre = "AlertaGastoARecuperar"
        unidad_texto = registro.unidad_de_negocio.unidad_de_negocio if registro.unidad_de_negocio else "Sin unidad"
    
    subject = f"Nuevo gasto a recuperar ({unidad_texto}) - {registro.cliente_proyecto}"
    from_email = settings.EMAIL_HOST_USER
    usuarios = User.objects.filter(groups__name=grupo_nombre)
    
    for usuario in usuarios:
        # Context for template rendering
        context = {
            'usuario': usuario,
            'registro': registro,
            'unidad_negocio': unidad_texto
        }
        
        # Render the plain text content
        text_content = render_to_string(
            "emails/gasto_a_recuperar.txt",
            context=context
        )
        
        # Render the HTML content
        html_content = render_to_string(
            "emails/gasto_a_recuperar.html",
            context=context
        )
        
        # Create the email message
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[usuario.email]
        )
        
        # Attach the HTML version
        msg.attach_alternative(html_content, "text/html")
        
        # Send the email
        msg.send()