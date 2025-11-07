from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black
from reportlab.lib.units import cm
import datetime
from .models import Registro
import locale
from io import BytesIO
from django.core.files import File
from django.http import HttpResponse


CODIGOS_CAJAS = {
    "Caja Santi": 'CSS',
    "Caja Fer": 'CFG',
    "Caja USD Santi": 'CUSDSS',
    "Banco ICBC": 'ICBC',
}

def dividir_num(num: str) -> list:
    return [num[i:i+3] for i in range(0, len(num), 3)]

casos_especiales = {
    10: "diez",
    11: "once",
    12: "doce",
    13: "trece",
    14: "catorce",
    15: "quince"
}

def armar_cientos(num: str) -> str:
    unidades =['', 'uno','dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
    decenas = ['', 'dieci', 'veinti', 'treinta y ', 'cuarenta y ', 'cincuenta y ', 'sesenta y ', 'setenta y ', 'ochenta y ', 'noventa y ']
    centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']
    
    cientos = int(num[0]) if len(num) > 2 else 0

    if int(num[-2:]) in casos_especiales:
        return (f"{centenas[cientos]} " if cientos != 0 else '') + casos_especiales[int(num[-2:])]

    decena, unidad = num[-2:]
    return (f"{centenas[cientos]} " if cientos != 0 else '') + decenas[int(decena)] + unidades[int(unidad)]

def numeros_a_palabras(numero:int) -> str:
    if numero == 0:
        return 'Cero'
    elif numero == 1000000:
        return 'Un millon'
    
    en_palabras = ''
    
    str_numero = str(numero)
    longitud_num = len(str_numero)

    unidades =['', 'uno','dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
    otros = ['', 'mil', 'millon']


    for i, parte in enumerate(dividir_num(str_numero[::-1])):
        parte = parte[::-1]
        num = int(parte)
        # print(parte)

        if num == 0: continue
        if len(str(num)) == 1: en_palabras =  unidades[num] + f"{otros[i]} " + en_palabras
        elif num > 15:
            resultado = armar_cientos(parte).strip()

            if resultado[-1] == 'i':
                resultado = resultado[:-1] + ('e' if parte[-2] == '2' else 'a')
            elif resultado == 'ciento': 
                resultado = 'cien'
            
            if i == 0: 
                en_palabras += f"{resultado} "
            else:
                en_palabras = resultado + f" {otros[i]} " + en_palabras
        else:
            en_palabras = casos_especiales[num] + f" {otros[i]} " + en_palabras
    
    if en_palabras.startswith('uno'):
        en_palabras = ('un ' if i > 1 else '') + en_palabras[3:]
    return en_palabras.strip()

def generate_receipt(registro: Registro, pagador:str) -> File:

    buffer = BytesIO()
    date_parts = str(registro.fecha_reg).split("-")
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Color principal (azul oscuro)
    blue_color = HexColor('#000080')
    c.setStrokeColor(blue_color)
    c.setFillColor(blue_color)
    
    # Fuente y título
    c.setFont("Helvetica-Bold", 14)
    # "RECIBÍ" en la parte superior izquierda:
    c.drawString(2*cm, height - 3*cm, "RECIBÍ")
    
    # Ajuste de fecha. Por defecto, intentamos mostrar el mes en español.
    try:
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
    except:
        pass  # Si falla, por ejemplo en Windows sin locale, se deja inglés
    month_name = datetime.date(1900, int(date_parts[1]), 1).strftime('%B')

    # Línea de fecha, similar a: ", de ___ de 20___ Nº ___"
    # Ajustamos la posición. Partiremos de un x base y dejaremos espacios subrayados.
    c.setFont("Helvetica", 12)
    x_base = 7*cm
    # Espacio subrayado para el día (por ejemplo 2 espacios subrayados)
    day_line = "_"*3
    c.drawString(x_base+1.2*cm, height - 3*cm, day_line)
    # Imprimimos el día sobre la línea subrayada
    c.setFillColor(black)
    c.drawString(x_base+1.2*cm, height - 3*cm, date_parts[2])
    c.setFillColor(blue_color)

    c.drawString(x_base+2.3*cm, height - 3*cm, "de")
    # Espacio subrayado para el mes
    month_line = "_" * 12
    c.drawString(x_base+3.0*cm, height - 3*cm, month_line)
    c.setFillColor(black)
    c.drawString(x_base+3.5*cm, height - 3*cm, month_name)
    c.setFillColor(blue_color)

    c.drawString(x_base+6*cm, height - 3*cm, "de 20")
    # Año subrayado
    year_line = "_"*3
    c.drawString(x_base+7.1*cm, height - 3*cm, year_line)
    c.setFillColor(black)
    c.drawString(x_base+7.2*cm, height - 3*cm, date_parts[0][2:])
    c.setFillColor(blue_color)

    # Número de recibo
    c.drawString(x_base+8.5*cm, height - 3*cm, "Nº")
    nro_line = "_"*6
    c.drawString(x_base+9*cm, height - 3*cm, nro_line)
    c.setFillColor(black)
    c.drawString(x_base+9.1*cm, height - 3*cm, f"{registro.pk} {CODIGOS_CAJAS[registro.caja.caja]}")
    c.setFillColor(blue_color)

    # Ahora la línea de "RECIBÍ de"
    # Ubicamos debajo de "RECIBÍ", aproximadamente 1 cm más abajo
    c.setFont("Helvetica", 12)
    c.drawString(2*cm, height - 4*cm, "de")
    line_recibi_de = "_"*70
    c.drawString(2.8*cm, height - 4*cm, line_recibi_de)
    # Aquí se podría colocar el nombre de la persona que paga, si existiera el campo
    c.setFillColor(black)
    c.drawString(3*cm, height - 4*cm, pagador)
    c.setFillColor(blue_color)

    # "La cantidad de"
    c.drawString(2*cm, height - 6*cm, "La cantidad de")
    cant_line = "_"*61
    c.drawString(5*cm, height - 6*cm, cant_line)
    c.setFillColor(black)
    print(int(-registro.monto_op_rec))
    if registro.moneda == 1:
        c.drawString(5*cm, height - 6*cm, f"Pesos {numeros_a_palabras(int(-registro.monto_op_rec))}")
    else:
        c.drawString(5*cm, height - 6*cm, f"Dólares {numeros_a_palabras(int(-registro.monto_op_rec/registro.tipo_de_cambio))}")
    c.setFillColor(blue_color)

    # "en concepto de"
    c.drawString(2*cm, height - 8*cm, "en concepto de")
    concept_line = "_"*60
    c.drawString(5.5*cm, height - 8*cm, concept_line)
    c.setFillColor(black)
    c.drawString(5.5*cm, height - 8*cm, registro.observacion)
    c.setFillColor(blue_color)

    # "Son"
    c.drawString(2*cm, height - 10*cm, "Son")
    son_line = "_"*30
    c.drawString(3*cm, height - 10*cm, son_line)
    c.setFillColor(black)
    if registro.moneda == 1:
        c.drawString(3.2*cm, height - 10*cm, f"${-registro.monto_op_rec} {registro.get_moneda_display()}")
    else:
        c.drawString(3.2*cm, height - 10*cm, f"{-registro.monto_op_rec/registro.tipo_de_cambio} {registro.get_moneda_display()}")
    c.setFillColor(blue_color)

    # Si se desean líneas decorativas a la izquierda, podemos dibujarlas:
    # Por ejemplo, líneas a la izquierda:
        # Color principal (azul oscuro)
    blue_color = HexColor('#00008035', hasAlpha=True)
    c.setStrokeColor(blue_color)
    c.setFillColor(blue_color)
    y_start = height - 2.08*cm
    for i in range(20):
        c.line(20*cm, y_start - i*0.5*cm, 1.5*cm, y_start - i*0.5*cm)

    # Guardamos el PDF
    c.save()

    buffer.seek(0)
    pdf = File(buffer, name=f"recibo{registro.pk}_{registro.caja}.pdf")
    return HttpResponse(pdf, content_type='application/pdf')