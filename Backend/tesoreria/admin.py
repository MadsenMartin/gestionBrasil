from django.contrib import admin
from tesoreria.models.archivos import Archivo
from tesoreria.models import Caja, Tarea, Registro, Presupuesto, EstadoPresupuesto, Echeq, Comentario, Notificacion,DolarMEP, subimputaciones, PagoFactura, IndiceCAC
from simple_history.admin import SimpleHistoryAdmin
from tesoreria.admin_filters import NroDocumentoFilter, ObservacionFilter, ProveedorFilter
# Register your models here.
@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    search_fields = ('caja',)
    list_display = ('caja', 'moneda', 'activo')

@admin.register(Registro)
class RegistroAdmin(SimpleHistoryAdmin):
    list_display = (
        'id', 'tipo_reg', 'fecha_reg', 'caja', 'get_proveedor',
        'cliente_proyecto', 'imputacion',
        'get_total', 'get_op_rec',
        'moneda', 'realizado', 'activo',
    )
    list_filter = (
        ProveedorFilter, ObservacionFilter, NroDocumentoFilter,
        'cliente_proyecto', 'imputacion', 'sub_imputacion', 'unidad_de_negocio', 'tipo_reg', 'moneda', 'realizado', 'activo', 'caja', 'fecha_reg',
    )
    search_fields = (
        'proveedor__razon_social',
        'proveedor__nombre_fantasia_pila',
        'cliente_proyecto__cliente_proyecto',
        'imputacion__imputacion',
        'observacion',
        'nro_documento',
    )
    date_hierarchy = 'fecha_reg'
    list_select_related = ('caja', 'proveedor', 'cliente_proyecto', 'imputacion')
    autocomplete_fields = ('proveedor', 'cliente_proyecto', 'imputacion',
                           'unidad_de_negocio', 'presupuesto', 'caja_contrapartida',
                           )
    raw_id_fields = ('documento',)
    readonly_fields = ('id',)
    ordering = ('-fecha_reg', '-id')
    list_per_page = 50

    fieldsets = (
        (None, {
            'fields': (
                'id', 'tipo_reg', 'fecha_reg', 'añomes_imputacion',
                'realizado', 'activo',
            )
        }),
        ('Imputación', {
            'fields': (
                'caja', 'caja_contrapartida', 'unidad_de_negocio', 'cliente_proyecto',
                'proveedor', 'observacion', 'imputacion', 'sub_imputacion',
                'presupuesto',
            )
        }),
        ('Montos', {
            'fields': (
                'moneda', 'tipo_de_cambio',
                'monto_gasto_ingreso_neto', 'iva_gasto_ingreso', 'monto_op_rec',
            )
        }),
        ('Documentación', {
            'fields': ('nro_documento', 'numero_cheque', 'documento',),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Proveedor', ordering='proveedor__razon_social')
    def get_proveedor(self, obj):
        if not obj.proveedor:
            return '-'
        return obj.proveedor.nombre_fantasia_pila or obj.proveedor.razon_social

    @admin.display(description='Total', ordering='monto_gasto_ingreso_neto')
    def get_total(self, obj):
        neto = obj.monto_gasto_ingreso_neto or 0
        iva = obj.iva_gasto_ingreso or 0
        total = neto + iva
        if total == 0:
            return '-'
        return f'{total:,.0f}'

    @admin.display(description='Op/Rec', ordering='monto_op_rec')
    def get_op_rec(self, obj):
        v = obj.monto_op_rec or 0
        if v == 0:
            return '-'
        return f'{v:,.0f}'


class PresupuestoAdmin(admin.ModelAdmin):
    search_fields = ('proveedor__razon_social', 'proveedor__nombre_fantasia', 'observacion', 'cliente_proyecto__cliente_proyecto')
admin.site.register(Presupuesto, PresupuestoAdmin)
admin.site.register(PagoFactura)
admin.site.register(EstadoPresupuesto)
admin.site.register(Echeq)
#admin.site.register(CertificadoObra)
admin.site.register(Comentario)
admin.site.register(Notificacion)
admin.site.register(DolarMEP)
admin.site.register(Tarea)
class SubImputacionAdmin(admin.ModelAdmin):
    search_fields = ('nombre',)
    list_display = ('nombre', 'descripcion')
admin.site.register(subimputaciones.SubImputacion, SubImputacionAdmin)
admin.site.register(IndiceCAC)
admin.site.register(subimputaciones.SubImputacionMapping)