from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

app_name = "iva"
urlpatterns = [
    path("", views.DocumentoList.as_view(), name="index"),
    path("clientes_proyectos/", views.ClienteProyectoList.as_view(), name="clientes_proyectos"),
    path("clientes_proyectos/<int:pk>/",views.ClienteProyectoDetail.as_view(),name="cliente_proyecto_detail"),
    path("tipos_documento/", views.TipoDocumentoList.as_view(), name="tipos_documento"),
    path("activos/", views.DocumentoActivoViewSet.as_view(), name="documentos_activos"),
    path("impagos/", views.DocumentoImpagoViewSet.as_view(), name="documentos_impagos"),
    path("inactivos/", views.DocumentoInactivoViewSet.as_view(), name="documentos_inactivos"),
    path("imputaciones/", views.ImputacionList.as_view(), name="imputacion"),
    path("proveedores/", views.ProveedorList.as_view(), name="proveedor"),
    path("personas/<int:pk>/",views.PersonaDetail.as_view(),name="persona_detail"),
    path("receptores/",views.ReceptorList.as_view(),name="receptores"),
    path("unidades_de_negocio/",views.UnidadDeNegocioList.as_view(), name="unidades_de_negocio"),
    path('<int:pk>/', views.DocumentoDetail.as_view(), name="documento_detail"),
    path('<int:pk>/historial/',views.HistorialDocumento.as_view(), name="historial"),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout, name='logout'),
    path('<int:pk>/restaurar/', views.RestaurarDocumento.as_view(), name='restaurar_documento'),
    path('exportar/', views.ExportarDocumentos.as_view(), name='exportar_archivos'),
    path('pagar_documento/', views.InformarPagoDocumento.as_view(), name='pagar_documento'),
]

urlpatterns = format_suffix_patterns(urlpatterns)