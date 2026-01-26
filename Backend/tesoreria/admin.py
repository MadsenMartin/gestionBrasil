from django.contrib import admin
from tesoreria.models.archivos import Archivo
from tesoreria.models import Caja, Tarea, Registro, Presupuesto, EstadoPresupuesto, Echeq, CertificadoObra, Comentario, Notificacion,DolarMEP,Retencion, subimputaciones, PagoFactura, IndiceCAC
from simple_history.admin import SimpleHistoryAdmin
# Register your models here.
admin.site.register(Caja)

class RegistroAdmin(SimpleHistoryAdmin):
    autocomplete_fields = ('documento', 'presupuesto', 'proveedor')
    search_fields = ('documento__proveedor__razon_social',) 

class PresupuestoAdmin(admin.ModelAdmin):
    search_fields = ('proveedor__razon_social', 'proveedor__nombre_fantasia', 'observacion', 'cliente_proyecto__cliente_proyecto')

admin.site.register(Registro, RegistroAdmin)
admin.site.register(Presupuesto, PresupuestoAdmin)
admin.site.register(PagoFactura)
admin.site.register(EstadoPresupuesto)
admin.site.register(Echeq)
admin.site.register(CertificadoObra)
admin.site.register(Comentario)
admin.site.register(Notificacion)
admin.site.register(DolarMEP)
admin.site.register(Retencion)
admin.site.register(Tarea)
admin.site.register(subimputaciones.SubImputacion)
admin.site.register(IndiceCAC)
admin.site.register(subimputaciones.SubImputacionMapping)