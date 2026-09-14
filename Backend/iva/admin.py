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
class ImputacionAdmin(admin.ModelAdmin):
    search_fields = ('imputacion',)
    list_display = ('imputacion',)
admin.site.register(Imputacion, ImputacionAdmin)
class ClienteProyectoAdmin(admin.ModelAdmin):
    search_fields = ('cliente_proyecto',)
    list_display = ('cliente_proyecto',)
admin.site.register(ClienteProyecto, ClienteProyectoAdmin)
class UnidadDeNegocioAdmin(admin.ModelAdmin):
    search_fields = ('unidad_de_negocio',)
    list_display = ('unidad_de_negocio',)
admin.site.register(UnidadDeNegocio, UnidadDeNegocioAdmin)
