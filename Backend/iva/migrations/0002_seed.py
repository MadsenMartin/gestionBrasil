#import tesoreria.models
import iva.models
import shared.models
from django.db import migrations

municipios = ['Porto Belo', 'Florianopolis', 'Itapema', 'Canelinha', 'Tijucas', 'OLIS']
tipos_documento = ['DANFE', 'NF-e', 'NFS-e', 'Boleto', 'IPTU', 'Orçamento', 'Cuenta de servicios']
unidades_negocio = ['Constructora', 'Indirectos']
monedas = ['R$', 'U$D']
imputaciones = ['Mov. entre cuentas', 'Diferencia de cambio']
'''imputaciones += [
    '27 - Otros (volquetes, baños químicos, seguridad e higiene, limpieza de obra, etc)',
    'Gestoría',
    'Energia Electrica',
    'Celular',
    'Agua',
    'Honorarios Profesionales',
    'Sueldos',
    '13 - Carpinteria y puertas interiores',
    'Expensas lotes',
    'Alquiler Departamento',
    'Telefonia',
    'Impuestos prov. y munic.',
    '28 - Trabajos de terminación para entrega de obra',
    '02 - Tareas preliminares (cercado, medidores de luz, etc)',
    'Mantenimiento maquinarias y otros'
]'''


def seed_data(apps, schema_editor):
        [iva.models.Imputacion.objects.get_or_create(imputacion=imputacion, activo=True) for imputacion in imputaciones]
        [shared.models.Moneda.objects.get_or_create(nombre=moneda, activo=True) for moneda in monedas]
        [iva.models.TiposDocumento.objects.get_or_create(tipo_documento=tipo, activo=True) for tipo in tipos_documento]
        iva.models.Persona.objects.get_or_create(razon_social='Proveedor Genérico', proveedor_receptor=1, activo=True)
        iva.models.Persona.objects.get_or_create(razon_social='CONCEPTUAL DEVELOPER BR LTDA', proveedor_receptor=2, cnpj='53.303.800/0001-48', nombre_fantasia='Conceptual')
        [iva.models.UnidadDeNegocio.objects.get_or_create(unidad_de_negocio=unidad) for unidad in unidades_negocio]
        iva.models.ClienteProyecto.objects.get_or_create(cliente_proyecto='Indirectos')
        [shared.models.Municipio.objects.get_or_create(nombre=municipio) for municipio in municipios]
        #iva.models.Caja.objects.create(caja='Santander BRL', activo=True, moneda=shared.models.Moneda.objects.get(nombre='BRL'), codigo='BSRS')
        #iva.models.Caja.objects.create(caja='Chase USD', activo=True, moneda=shared.models.Moneda.objects.get(nombre='USD'), codigo='CHAS')
        #iva.models.Caja.objects.create(caja='Caja Santi R$', activo=True, moneda=shared.models.Moneda.objects.get(nombre='BRL'), codigo='CRSSS')

def noop(apps, schema_editor):
    return

class Migration(migrations.Migration):

    dependencies = [
        ('iva', '0001_initial'),
        ('tesoreria', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_data, noop),
    ]