"""Filtros de texto libre para la barra lateral del admin.

Los `list_filter` estándar de Django renderizan un <select> con todas las
opciones posibles. Para proveedor (miles de personas) o para observación eso es
inviable, así que `InputFilter` dibuja un cuadro de texto y filtra por
`icontains`.
"""

from django.contrib import admin
from django.contrib.admin.views.main import SEARCH_VAR
from django.db.models import Q


class InputFilter(admin.SimpleListFilter):
    template = "admin/input_filter.html"
    placeholder = ""

    def lookups(self, request, model_admin):
        # No hay opciones predefinidas: el valor lo tipea el usuario.
        return []

    def has_output(self):
        # Sin esto el filtro no se dibuja, porque `lookups` viene vacío.
        return True

    def choices(self, changelist):
        # SimpleListFilter siempre emite primero la opción "Todos". Le colgamos
        # el resto de la query para que el <form> del template no pierda los
        # otros filtros ni la búsqueda cuando se envía.
        todos = next(super().choices(changelist))
        pares = []
        for clave, valores in changelist.get_filters_params().items():
            if clave == self.parameter_name:
                continue
            pares.extend((clave, valor) for valor in valores)
        if changelist.query:
            pares.append((SEARCH_VAR, changelist.query))
        todos["query_parts"] = pares
        yield todos


class ProveedorFilter(InputFilter):
    parameter_name = "proveedor_contiene"
    title = "Proveedor contiene"
    placeholder = "ARBA, Loma Negra…"

    def queryset(self, request, queryset):
        texto = self.value()
        if not texto:
            return queryset
        return queryset.filter(
            Q(proveedor__razon_social__icontains=texto)
            | Q(proveedor__nombre_fantasia_pila__icontains=texto)
        )


class ObservacionFilter(InputFilter):
    parameter_name = "observacion_contiene"
    title = "Observación contiene"
    placeholder = "texto de la observación"

    def queryset(self, request, queryset):
        texto = self.value()
        if not texto:
            return queryset
        return queryset.filter(observacion__icontains=texto)


class NroDocumentoFilter(InputFilter):
    parameter_name = "nro_documento_contiene"
    title = "Nro. documento contiene"
    placeholder = "0001-00012345"

    def queryset(self, request, queryset):
        texto = self.value()
        if not texto:
            return queryset
        return queryset.filter(nro_documento__icontains=texto)
