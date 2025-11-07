from . import views
from django.urls import path
app_name = "reportes"
urlpatterns = [
    path("gastos_por_obra/", views.GastoPorObra.as_view(), name="gasto_por_obra"),
    path("gastos_por_unidad/", views.GastoPorUnidad.as_view(), name="gasto_por_unidad"),
    path("gastos_por_proveedor/", views.GastoPorProveedor.as_view(), name="gasto_por_proveedor"),
    path("presupuestos_por_proveedor/", views.PresupuestosPorProveedor.as_view(), name="presupuestos_por_proveedor"),
    path("presupuestos_por_cliente_proyecto/", views.PresupuestosPorClienteProyecto.as_view(), name="presupuestos_por_obra"),
    path("gastos_por_casa/", views.GastosPorCasa.as_view(), name="gasto_por_casa"),
    path("cuentas_corrientes/", views.CuentasCorrientes.as_view(), name="cuentas_corrientes"),
    path("db_total/", views.DB_Total.as_view(), name="db_total"),
    path('mdo_vs_ppto/', views.MDOVSPresupuesto.as_view(), name='mdo_vs_ppto'),
    path('mdo_vs_ppto_x_entidad/', views.MDOVSPresupuestoPorProveedor.as_view(), name='mdo_vs_ppto_x_entidad'),
    path('movimientos_de_caja/', views.MovimientosDeCaja.as_view(), name='movimientos_de_caja'),
]