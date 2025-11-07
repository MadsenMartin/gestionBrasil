from django.contrib import admin
from .models import Inversor, PorcentajeInversion, AsientoInversor

# Register your models here.
admin.site.register(Inversor)
admin.site.register(PorcentajeInversion)
admin.site.register(AsientoInversor)