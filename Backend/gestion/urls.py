"""
URL configuration for gestion project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from .views import UserDataView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from iva import views
from tesoreria.views import NotificacionesList

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api', include(router.urls)),
    path('api/user/', UserDataView.as_view(), name="user_data"),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/iva/', include('iva.urls')),
    path('api/tesoreria/', include('tesoreria.urls')),
    path('api/reportes/', include('reportes.urls')),
    path('api/inversiones/', include('inversiones.urls')),
    path('api/notificaciones/', NotificacionesList.as_view(), name="notificaciones"),
    path('api/shared/', include('shared.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
