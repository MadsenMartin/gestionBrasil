from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from datetime import datetime
from io import BytesIO
from django.core.files import File
from tesoreria.models import Caja

def generar_pdf_orden_pago(nombre_archivo, proveedor_datos, medios_pago: dict, documentos):
    # Configuración básica
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    ancho, alto = A4

    empresa_datos = {
    'nombre': 'Quinto Diseño SRL',
    'direccion': 'Caminante 80, 1er piso, oficina 108',
    'localidad': 'Nordelta - Buenos Aires - Argentina',
}

    # Encabezado con datos de la empresa
    c.setFont("Helvetica-Bold", 12)
    c.drawString(150, alto - 40, "ORDEN DE PAGO PROVEEDOR",)
    
    # Logo (posición aproximada)
    c.drawImage("jt.png", 50, alto - 110, width=100, height=100, mask='auto')
    
    # Datos de la empresa
    c.setFont("Helvetica", 10)
    c.drawString(150, alto - 60, empresa_datos['nombre'])
    c.drawString(150, alto - 75, empresa_datos['direccion'])
    c.drawString(150, alto - 90, empresa_datos['localidad'])
    
    # Fecha
    c.drawString(500, alto - 40, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    
    c.line(50, alto - 117, 550, alto - 117)

    # Datos del proveedor
    c.drawString(50, alto - 140, f"OP NRO.: {proveedor_datos['op_nro']}")
    c.drawString(350, alto - 140, f"CNPJ: {proveedor_datos['cnpj']}")
    c.drawString(50, alto - 160, f"Proveedor: {proveedor_datos['nombre']}")
    c.line(50, alto - 190, 550, alto - 190)
    
    # Sección de Medios de Pago
    y_pos = alto - 200
    
    # Encabezados de medios de pago
    c.setFont("Helvetica", 9)
    c.drawString(50, y_pos, "Medio de Pago")
    c.drawString(150, y_pos, "Banco")
    c.drawString(200, y_pos, "Interno")
    c.drawString(250, y_pos, "Número")
    c.drawString(400, y_pos, "Fecha Depósito")
    c.drawString(500, y_pos, "Pesos")
    
    # Línea separadora
    c.line(50, y_pos - 5, 550, y_pos - 5)
    
    # Datos de medios de pago
    y_pos -= 20
    total_medios = 0

    cajas = Caja.objects.filter(caja__in=[medio['caja'] for medio in medios_pago]).values('caja', 'codigo')
    cajas_dict = {caja['caja']: caja['codigo'] or "" for caja in cajas}

    for medio in medios_pago:
        c.drawString(50, y_pos, str(medio['tipo']))
        c.drawString(150, y_pos, "ICBC" if str(medio["caja"]) == "Banco ICBC" else "")
        c.drawString(200, y_pos, cajas_dict.get(str(medio['caja']),""))
        if medio['numero_certificado']:
            c.drawString(250, y_pos, str(medio['numero_certificado']))
        fecha_array = str(medio['fecha']).split("-")
        fecha = f"{fecha_array[2]}/{fecha_array[1]}/{fecha_array[0]}"
        c.drawString(400, y_pos, fecha)
        c.drawRightString(550, y_pos, f"$ {(medio['monto']*medio['tipo_de_cambio'] if medio['tipo_de_cambio'] else medio['monto']):,.2f}")
        y_pos -= 20
        total_medios += medio['monto']
        
    # Total del medio de pago
    c.line(450, y_pos, 550, y_pos)
    c.drawString(400, y_pos - 15, "Total pagos:")
    c.drawRightString(550, y_pos - 15, f"$ {total_medios:,.2f}")
    y_pos -= 30
    
    # Sección de Documentos Cancelados
    y_pos -= 20
    c.setFont("Helvetica", 9)

    c.line(50, y_pos-5, 550, y_pos-5)

    c.drawString(50, y_pos, "Documento cancelado:")
    c.drawString(300, y_pos, "Interno")
    c.drawString(500, y_pos, "Pesos")

    c.line(50, y_pos+10, 550, y_pos+10)
    
    y_pos -= 30
    total_docs = 0
    for doc in documentos:
        c.drawString(50, y_pos, f"{doc.tipo_documento} {doc.serie}-{doc.numero}")
        c.drawString(300, y_pos, str(doc.id))
        total = doc.neto + doc.iva + doc.percepcion_de_iibb + doc.percepcion_de_iva + doc.exento + doc.no_gravado
        c.drawRightString(550, y_pos, f"$ {total:,.2f}")
        total_docs += total
        y_pos -= 20
    
    # Total de documentos
    c.line(450, y_pos, 550, y_pos)
    c.drawString(400, y_pos - 15, "Total documentos:")
    c.drawRightString(550, y_pos - 15, f"$ {total_docs:,.2f}")
    
    # Sección de firmas
    y_pos = 100
    c.setFont("Helvetica", 10)
    c.drawString(400, y_pos, "Firma:")
    c.line(400, y_pos - 20, 550, y_pos - 20)
    
    c.drawString(400, y_pos - 40, "Aclaración:")
    c.line(400, y_pos - 60, 550, y_pos - 60)
    
    c.drawString(400, y_pos - 80, "DNI:")
    c.line(400, y_pos - 100, 550, y_pos - 100)
    
    # Tabla de cuenta (esquina inferior izquierda)
    c.drawString(50, y_pos, "Aclaraciones")
    c.rect(50, y_pos - 60, 300, 50)
    
    # Nombre del archivo en pie de página
    c.setFont("Helvetica", 8)
    
    # Generar PDF para enviarlo a Django
    c.setTitle(nombre_archivo)
    c.save()

    buffer.seek(0)
    pdf = File(buffer, name="op.pdf")
    return pdf