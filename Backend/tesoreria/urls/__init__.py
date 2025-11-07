from django.urls import path, include
from .. import views
from ..views import presupuestos
from ..views import carga_caja
from rest_framework.routers import DefaultRouter
from ..banco.conciliacion import ConciliacionCSVUploadView, CrearGastoBancario, CrearPagoDesdePlantilla, CrearPagosMultiplesDesdePlantilla
app_name = "tesoreria"
router = DefaultRouter()
router.register(r"registros", views.RegistroViewSet, basename="registro")

urlpatterns = [
    path("tipos_reg/",views.TipoRegList.as_view(), name="tipo_reg_index"),
    path("cajas/",views.CajaList.as_view(), name="caja_index"),
    path("cajas/<int:pk>/",views.CajaDetail.as_view(), name="caja_detail"),
    path("recibo/",views.GenerarReciboRegistro.as_view(), name="recibo"),
    path("pagos/", include("tesoreria.urls.pagos")),
    path("cuentas_corrientes_proveedores/",views.CuentasCorrientesProveedores.as_view(), name="cuentas_corrientes_proveedores"),
    path("cuentas_corrientes_clientes/",views.CuentasCorrientesClientes.as_view(), name="cuentas_corrientes_clientes"),
    path("mov_entre_cuentas/",views.MovimientoEntreCuentas.as_view(), name="mov_entre_cuentas"),
    path("cobranzas/",views.CobranzasList.as_view(), name="cobranzas"),
    path("cobranzas/nuevo_cobro/",views.ProcesarCobroCertificado.as_view(), name="nuevo_cobro"),
    path("cobranzas/certificados/",views.CertificadosList.as_view(), name="certificados"),
    path("cobranzas/certificados/<int:pk>/",views.CertificadoDetail.as_view(), name="certificado_detail"),
    
    # URLs para presupuestos - Mantienen la misma estructura que el ViewSet original
    path("presupuestos/", presupuestos.PresupuestoListView.as_view(), name="presupuestos-list"),
    path("presupuestos/<int:pk>/", presupuestos.PresupuestoDetailView.as_view(), name="presupuestos-detail"),
    
    # URLs adicionales para presupuestos
    path("presupuestos/estados/", presupuestos.EstadoPresupuestoCreateView.as_view(), name="estado_presupuesto_create"),
    path("presupuestos/estados/opciones/", presupuestos.EstadoPresupuestoChoicesList.as_view(), name="estado_presupuesto_options"),
    path("presupuestos/estados/<int:pk>/", presupuestos.HistorialPresupuesto.as_view(), name="presupuesto_historial"),
    path("presupuestos/comentarios/", presupuestos.ComentarioPresupuesto.as_view(), name="comentario_presupuesto"),
    path("presupuestos/actividad/", presupuestos.ActividadPresupuesto.as_view(), name="actividad_presupuesto"),
    path("presupuestos/consumos/", presupuestos.ListadoConsumosPresupuesto.as_view(), name="consumos_presupuesto"),
    path("presupuestos/consumos_fuera/", presupuestos.ListadoConsumosFueraPresupuesto.as_view(), name="consumos_fuera_presupuesto"),
    path("presupuestos/carga_archivo/", presupuestos.CargaArchivoPresupuesto.as_view(), name="carga_archivo_presupuesto"),
    path ("",include(router.urls)),
    path ("<int:pk>/realizar/",views.RealizarRegistro.as_view(), name="realizar_pago"),
    path("mep/",views.DolarMEPList.as_view(), name="mep_index"),
    path("mep/<int:pk>/",views.DolarMEPDetail.as_view(), name="mep_detail"),
    path("conciliacion/",views.ConciliacionCajaView.as_view(), name="conciliacion"),
    path("conciliacion/data/",views.ConciliacionCajaData.as_view(), name="conciliacion_data"),
    path("imputacion_facturas/",views.ImputacionFacturas.as_view(), name="imputacion_facturas"),
    path("<int:pk>/asociados/",views.RegistrosAsociados.as_view(), name="registros_asociados"),
    path("tareas/",views.TareasList.as_view(), name="tareas"),
    path("tareas/<int:pk>/",views.TareaDetail.as_view(), name="tarea_detail"),
    path("conciliacion_bancaria/",ConciliacionCSVUploadView.as_view(), name="conciliacion_bancaria"),
    path("conciliacion_bancaria/gasto_bancario/",CrearGastoBancario.as_view(), name="gasto_bancario"),
    path("conciliacion_bancaria/pago_plantilla/",CrearPagoDesdePlantilla.as_view(), name="pago_plantilla"),
    path("conciliacion_bancaria/pagos_multiples_plantilla/",CrearPagosMultiplesDesdePlantilla.as_view(), name="pagos_multiples_plantilla"),
    path("plantillas/",views.PlantillaRegistroList.as_view(), name="plantilla_index"),
    path("plantillas/<int:pk>/",views.PlantillaRegistroDetail.as_view(), name="plantilla_detail"),
    path("subir_archivo/",views.SubirArchivoRegistro.as_view(), name="cargar_archivo"),
    path("fci/",views.FCI.as_view(), name="fci"),

    path("carga_caja/", carga_caja.CargaCaja.as_view(), name="carga_caja"),
]

urlpatterns += router.urls