from rest_framework import filters


class StableOrderingFilter(filters.OrderingFilter):
    """
    OrderingFilter que agrega 'pk' como desempate al final del ordenamiento.

    El OrderingFilter de DRF reemplaza el order_by del queryset, por lo que si se ordena
    por un campo no único (ej: fecha_documento) el orden entre empates queda indefinido
    y la paginación puede repetir u omitir registros entre páginas.
    """

    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        if ordering and not any(campo.lstrip('-') in ('pk', 'id') for campo in ordering):
            ordering = list(ordering) + ['pk']
        return ordering
