from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

app_name = "inversiones"

urlpatterns = [
    path("inversores/", views.InversorViewSet.as_view({"get": "list", "post": "create"}), name="inversores"),
    path("inversores/<int:pk>/", views.InversorViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}), name="inversores_detail"),
    path("porcentajes_inversion/<int:pk>/", views.PorcentajeInversionViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}), name="porcentajes_inversion_detail"),
    path("asientos_inversor/<int:pk>/", views.AsientoInversorViewSet.as_view({"get": "retrieve", "put": "update", "patch": "update", "delete": "destroy"}), name="asientos_inversor_detail"),
    path("inversores/<int:pk>/porcentajes_inversion/", views.PorcentajeInversionViewSet.as_view({"get": "list"}), name="inversores_porcentajes_inversion"),
    path("inversores/<int:pk>/asientos_inversor/", views.AsientoInversorViewSet.as_view({"get": "list"}), name="inversores_asientos_inversor"),
    path("porcentajes_inversion/", views.PorcentajeInversionViewSet.as_view({"get": "list", "post": "create"}), name="porcentajes_inversion_list"),
    path("asientos_inversor/", views.AsientoInversorViewSet.as_view({"get": "list", "post": "create"}), name="asientos_inversor_list"),
]

urlpatterns = format_suffix_patterns(urlpatterns)
