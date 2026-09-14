#import tesoreria.models
import iva.models
import shared.models
from django.conf import settings
from django.db import migrations, models


def seed_data(apps, schema_editor):
        iva.models.Imputacion.objects.get_or_create(imputacion='Mov. entre cuentas', activo=True)
        shared.models.Moneda.objects.get_or_create(nombre='R$', activo=True)
        shared.models.Moneda.objects.get_or_create(nombre='U$D', activo=True)
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