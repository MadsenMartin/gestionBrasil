from rest_framework.filters import BaseFilterBackend

class AllFieldsFilterBackend(BaseFilterBackend):
    """
    Filtra y ordena por cualquier campo o relación que exista en el modelo,
    basándose en los parámetros de la query. 
    Ejem: ?campo=valor, ?otro_campo=otro_valor, ?ordering=un_campo
    """
    def filter_queryset(self, request, queryset, view):
        query_params = request.query_params

        for param, value in query_params.items():
            # Ignoramos paginación y otros parámetros reservados que quieras excluir
            if param in ['page', 'page_size']:
                continue

            if param == 'ordering':
                # Aplica orden: ?ordering=campo o ?ordering=-campo
                queryset = queryset.order_by(value)
            else:
                # Aplica filtro exacto: ?campo=valor
                # Ojo: si el campo no existe o no es de tipo "exact", lanzará error.
                queryset = queryset.filter(**{param: value})

        return queryset