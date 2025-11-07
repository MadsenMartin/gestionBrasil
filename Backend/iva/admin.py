from django.contrib import admin
from .models import *
# Register your models here.

class PersonaAdmin(admin.ModelAdmin):
    search_fields = ('razon_social', 'nombre_fantasia', 'cnpj')

admin.site.register(Persona, PersonaAdmin)
admin.site.register(TiposDocumento)
class DocumentoAdmin(admin.ModelAdmin):
    search_fields = ('proveedor__razon_social', 'numero', 'serie', 'fecha_documento')

admin.site.register(Documento, DocumentoAdmin)

admin.site.register(EstadoDocumento)
admin.site.register(Imputacion)
admin.site.register(ClienteProyecto)
admin.site.register(UnidadDeNegocio)
