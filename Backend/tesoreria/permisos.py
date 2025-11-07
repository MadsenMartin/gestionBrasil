from rest_framework import permissions
from django.contrib.auth.models import User

class Administracion1(permissions.BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.groups.filter(name='Administración - 1').exists()
    
class Administracion2(permissions.BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.groups.filter(name='Administración - 2').exists()

class Administracion3(permissions.BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.groups.filter(name='Administración - 3').exists()
    
class Administracion4(permissions.BasePermission):
    def has_permission(self, request, view):
        user: User = request.user
        return user.groups.filter(name='Administración - 4').exists()