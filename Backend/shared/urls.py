from django.urls import path, include
from rest_framework import routers
from .views import MunicipioViewSet, MonedaViewSet

router = routers.DefaultRouter()
router.register(r'municipios', MunicipioViewSet)
router.register(r'monedas', MonedaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]