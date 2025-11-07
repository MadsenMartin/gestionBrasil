import { useContext, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Filter, FilterField } from "../presupuestos/types/filters";
import { get_generico_params } from "@/endpoints/api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useIntersection } from "@mantine/hooks";
import { ScrollContainerContext } from "@/layout";
import { Registro, Documento } from "@/types/genericos";
import { Presupuesto } from "../presupuestos/types/presupuestos";

const CAMPO_NOMBRE_MAP: Record<string, string> = {
    "proveedor": "__nombre_fantasia_pila",
    "cliente_proyecto": "__cliente_proyecto",
    "imputacion": "__imputacion",
    "unidad_de_negocio": "__unidad_de_negocio",
    "caja": "__caja",
}

const headersCapitalized: Record<string, string[]> = {
    "presupuestos":
        ["Fecha", "Proveedor", "Cliente/Proyecto", "Observación", "Monto", "Saldo", "Estado", "Aprobado"],
    "registros":
        ["Caja", "Tipo reg.", "Fecha reg.", "Unidad de negocio", "Cliente/Proyecto", "Contrapartida", "Imputación", "Observación", "Presupuesto", "Neto", "IVA", "Total Gasto/Ingreso", "Monto OP/REC", "Total Gasto/Ingreso USD", "Monto OP/REC USD", "Saldo caja"],
    "documentos":
        ["Tipo", "Fecha", "Proveedor", "Receptor", "Serie", "N°", "Mes devengado", "Unidad de negocio", "Cliente/Proyecto", 
            "Imputación", "Concepto", "Comentario",
             "Moneda", "Total"],
    "cobranzas":
        ["Caja", "Tipo","Fecha","Unidad de negocio", "Cliente/Proyecto","Imputación","Observación","Neto","IVA","Monto OP/REC"],
    "dolar_mep":
        ["Fecha", "Compra", "Venta"],
    "pagos":
        ["Caja", "Fecha", "Obra", "Proveedor", "Concepto", "Monto"],
    "receptores":
        ["Razón Social", "Nombre Fantasía", "CNPJ"],
    "proveedores":
        ["Razón Social", "Nombre Fantasía", "CNPJ"],
    "clientes_proyectos":
        ["Cliente/Proyecto"],
    "plantillas_registros":
        ["Nombre", "Tipo reg.", "Unidad de negocio", "Cliente/Proyecto", "Proveedor", "Imputación", "Observación"],
    "desacopios":
        ["Fecha entrega", "Remito", "N° Pedido", "Arquitecto", "Código", "Artículo", "Cantidad", "Precio unitario", "Alícuota", "Cliente/Proyecto","Conciliado","Acopio"],
    "acopios":
        ["Fecha", "Acopiante", "Nombre", "Neto", "IVA", "Total", "Saldo"],
}
const headers: Record<string, string[]> = {
    "presupuestos":
        ["fecha", "proveedor", "cliente_proyecto", "observacion", "monto", "saldo", "estado", "aprobado"],
    "registros":
        ["caja", "tipo_reg", "fecha_reg", "unidad_de_negocio", "cliente_proyecto", "proveedor", "imputacion", "observacion", "presupuesto", "monto_gasto_ingreso_neto", "iva_gasto_ingreso", "total_gasto_ingreso", "monto_op_rec", "total_gasto_ingreso_usd", "monto_op_rec_usd", "saldo_acumulado"],
    "documentos":
        ["tipo_documento", "fecha_documento", "proveedor", "receptor", "serie", "numero", "añomes_imputacion_gasto", "unidad_de_negocio", "cliente_proyecto", "imputacion", "concepto", "comentario", "moneda", "total"],
    "cobranzas":
        ["caja", "tipo_reg", "fecha_reg", "unidad_de_negocio", "cliente_proyecto", "imputacion", "observacion", "monto_gasto_ingreso_neto", "iva_gasto_ingreso", "monto_op_rec"],
    "dolar_mep":
        ["fecha", "compra", "venta"],
    "pagos":
        ["caja", "fecha_pago", "cliente_proyecto", "proveedor", "observacion", "monto"],
    "receptores":
        ["razon_social", "nombre_fantasia_pila", "cnpj"],
    "proveedores":
        ["razon_social", "nombre_fantasia_pila", "cnpj"],
    "clientes_proyectos":
        ["cliente_proyecto"],
    "plantillas_registros":
        ["nombre", "tipo_reg", "unidad_de_negocio", "cliente_proyecto", "proveedor", "imputacion", "observacion"],
    "desacopios":
        ["fecha_entrega", "remito", "nro_pedido", "arquitecto", "codigo", "nombre", "cantidad", "unitario", "alicuota", "obra", "conciliado", "acopio"],
    "acopios":
        ["fecha", "acopiante_nombre", "nombre", "monto", "iva", "total", "saldo"],
    }

type ModelFilterReturn = {
    handleOrdenar: (header: string) => void,
    ordenPor: string,
    orden: string,
    fields: FilterField[],
    headers: string[],
    headersCapitalized: string[],
    filters: Filter[],
    setFilters: (filters: Filter[]) => void,
    setSearch: (search: string) => void,
    data: any[],
    isLoading: boolean,
    CAMPO_NOMBRE_MAP: Record<string, string>,
    queryClient: any,
    updateItem: (updatedItem: any) => void,
    addItem: (newItem: any) => void,
    queryKey: any,
    asignarRef: (i: number) => any
    deleteItem: (deletedItemId: number) => void
}

/**
* Función que junto al componente FilterBuilder maneja los filtros y las llamadas a la API de los diferentes modelos
* 
* @param {string} model - Nombre del modelo a filtrar
* @param {Presupuesto[] | Registro[] | Documento[]} data - Datos iniciales
* @returns {Object} - Objeto con los datos filtrados, los campos, los headers y los filtros
*/
export function TableBuilder(model: string, ordenInicial?, refOffset?): ModelFilterReturn {
    const [ordenPor, setOrdenPor] = useState<string>(ordenInicial? ordenInicial: headers[model][0]+(CAMPO_NOMBRE_MAP[headers[model][0]] ?? ""))
    const [orden, setOrden] = useState<string>('asc')
    const [filters, setFilters] = useState<Filter[]>([])
    const debouncedFilters = useDebounce(filters, 600)
    const [search, setSearch] = useState<string>('')
    const debouncedSearch = useDebounce(search, 600)

    const fetchData = async (queryParams = {}) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const response = await get_generico_params({ model: model, params: queryParams });
        return response.data;
    };



    /** Función que transforma los filtros obtenidos del componente FilterBuilder  
     * en una cadena de query params para enviar directo a la API
     * @returns {string} - Query params
    */
    const getQueryParams = (): string => {
        const queryParams = debouncedFilters.map((filter) => {
            if (filter.operator === 'contains') {
                return `${filter.field}${CAMPO_NOMBRE_MAP[filter.field] ?? ""}__icontains=${filter.value}`
            } else if (filter.operator === 'startsWith') {
                return `${filter.field}${CAMPO_NOMBRE_MAP[filter.field] ?? ""}__startswith=${filter.value}`
            } else if (filter.operator === 'endsWith') {
                return `${filter.field}${CAMPO_NOMBRE_MAP[filter.field] ?? ""}__endswith=${filter.value}`
            } else if (filter.operator === 'isEmpty') {
                return `${filter.field}__isnull=true`
            } else if (filter.operator === 'isNotEmpty') {
                return `${filter.field}__isnull=false`
            } else if (filter.operator === 'greaterThan') {
                return `${filter.field}__gt=${filter.value}`
            } else if (filter.operator === 'lessThan') {
                return `${filter.field}__lt=${filter.value}`
            } else {
                return `${filter.field}${CAMPO_NOMBRE_MAP[filter.field] ?? ""}=${filter.value}`
            }
        })
        if (ordenPor) {
            queryParams.push(`ordering=${orden === 'asc' ? '-' : ''}${ordenPor}`)
        }
        if (debouncedSearch !== '') {
            queryParams.push(`search=${debouncedSearch}`)
        }
        return queryParams.join('&')
    }

    const estadoOptions = [
        { value: '1', label: 'Cargado' },
        { value: '2', label: 'Aprobado' },
        { value: '3', label: 'Completo' },
        { value: '4', label: 'Excedido' },
        { value: '5', label: 'Ampliado' },
        { value: '99', label: 'Rechazado' },
    ]

    /**
     * Campos de los filtros para cada modelo
     */
    const fields: Record<string,FilterField[]> = {
        "presupuestos": [
            { id: "proveedor", label: "Proveedor", type: "text" },
            { id: "estado", label: "Estado", type: "select", options: estadoOptions },
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
            { id: "observacion", label: "Observación", type: "text" },
            { id: "monto", label: "Monto", type: "number" },
            { id: "saldo", label: "Saldo", type: "number" },
            { id: "fecha", label: "Fecha", type: "date" }
        ],
        "registros": [
            { id: "caja", label: "Caja", type: "text" },
            { id: "tipo_reg", label: "Tipo reg.", type: "text" },
            { id: "fecha_reg", label: "Fecha reg.", type: "date" },
            { id: "unidad_de_negocio", label: "Unidad de negocio", type: "text" },
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
            { id: "proveedor", label: "Proveedor", type: "text" },
            { id: "imputacion", label: "Imputación", type: "text" },
            { id: "observacion", label: "Observación", type: "text" },
            { id: "monto_gasto_ingreso_neto", label: "Neto", type: "number" },
            { id: "iva_gasto_ingreso", label: "IVA", type: "number" },
            { id: "monto_op_rec", label: "Monto OP/REC", type: "number" },
            { id: "saldo_caja", label: "Saldo caja", type: "number" }
        ],
        "documentos": [
            { id: "proveedor", label: "Proveedor", type: "text" },
            { id: "tipo_documento", label: "Tipo Documento", type: "text" },
            { id: "fecha_documento", label: "Fecha Documento", type: "date" },
            { id: "receptor", label: "Receptor", type: "text" },
            { id: "serie", label: "Serie", type: "text" },
            { id: "numero", label: "Número", type: "text" },
            { id: "añomes_imputacion_gasto", label: "Mes de devengado", type: "text" },
            { id: "unidad_de_negocio", label: "Unidad de negocio", type: "text" },
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
            { id: "imputacion", label: "Imputación", type: "text" },
            { id: "concepto", label: "Concepto", type: "text" },
            { id: "comentario", label: "Comentario", type: "text" },
            { id: "neto", label: "Neto", type: "number" },
            { id: "iva", label: "IVA", type: "number" },
            { id: "moneda", label: "Moneda", type: "text" },
            { id: "tipo_de_cambio", label: "Tipo de cambio", type: "number" },
            { id: "total", label: "Total", type: "number" }
        ],
        "cobranzas": [
            { id: "caja", label: "Caja", type: "text" },
            { id: "tipo_reg", label: "Tipo reg.", type: "text" },
            { id: "fecha_reg", label: "Fecha reg.", type: "date" },
            { id: "unidad_de_negocio", label: "Unidad de negocio", type: "text" },
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
            { id: "imputacion", label: "Imputación", type: "text" },
            { id: "observacion", label: "Observación", type: "text" },
            { id: "monto_gasto_ingreso_neto", label: "Neto", type: "number" },
            { id: "iva_gasto_ingreso", label: "IVA", type: "number" },
            { id: "monto_op_rec", label: "Monto OP/REC", type: "number" },
        ],
        "dolar_mep": [
            { id: "fecha", label: "Fecha", type: "date" },
            { id: "compra", label: "Compra", type: "number" },
            { id: "venta", label: "Venta", type: "number" },
        ],
        "pagos": [
            { id: "caja", label: "Caja", type: "text" },
            { id: "fecha_reg", label: "Fecha reg.", type: "date" },
            { id: "proveedor", label: "Proveedor", type: "text" },
            { id: "imputacion", label: "Imputación", type: "text" },
            { id: "observacion", label: "Observación", type: "text" },
            { id: "monto_op_rec", label: "Monto OP/REC", type: "number" },
            { id: "moneda_display", label: "Moneda", type: "text" }
        ],
        "receptores": [
            { id: "razon_social", label: "Razón Social", type: "text" },
            { id: "nombre_fantasia_pila", label: "Nombre Fantasía", type: "text" },
            { id: "cnpj", label: "CNPJ", type: "text" },
        ],
        "proveedores": [
            { id: "razon_social", label: "Razón Social", type: "text" },
            { id: "nombre_fantasia_pila", label: "Nombre Fantasía", type: "text" },
            { id: "cnpj", label: "CNPJ", type: "text" },
        ],
        "clientes_proyectos": [
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
        ],
        "plantillas_registros": [
            { id: "nombre", label: "Nombre", type: "text" },
            { id: "tipo_reg", label: "Tipo reg.", type: "text" },
            { id: "unidad_de_negocio", label: "Unidad de negocio", type: "text" },
            { id: "cliente_proyecto", label: "Cliente/Proyecto", type: "text" },
            { id: "imputacion", label: "Imputación", type: "text" },
            { id: "observacion", label: "Observación", type: "text" },
        ],
    }

    const handleOrdenar = (header: string) => {
        if (ordenPor === header + (CAMPO_NOMBRE_MAP[header] ?? "")) {
            orden === 'desc' ? setOrden('asc') : setOrdenPor('')
        } else {
            setOrdenPor(header + (CAMPO_NOMBRE_MAP[header] ?? ""))
            setOrden('desc')
        }
    }

    const queryKey = [model, debouncedFilters, debouncedSearch, ordenPor, orden]

    const { data, fetchNextPage, isLoading, isFetchingNextPage } = useInfiniteQuery({
        queryKey: queryKey,
        queryFn: async ({ pageParam = 1 }) => {
            const queryParams = new URLSearchParams(getQueryParams());
            queryParams.append('page', String(pageParam));
            const response = await fetchData(queryParams);
            return response;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.next) {
                const urlParams = new URLSearchParams(new URL(lastPage.next).search);
                const nextPage = urlParams.get('page');
                return nextPage ? Number(nextPage) : undefined;
            } else {
                return undefined;
            }
        },
        refetchOnWindowFocus: false, // Para que no se recargue la página al cambiar de pestaña o ventana
    });

    const dataFiltrada: Registro[]|Presupuesto[]|Documento[] = data?.pages?.flatMap((page) => page.results)

    const queryClient = useQueryClient();

    /** Función para añadir un item, recibe la respuesta de la  
     * API al crear un objeto y lo coloca al principio de la lista.  
    * Evita tener que invalidar el query para refrescar la lista  
    * (evitando llamadas innecesarias a la API).
    */
    const addItem = (newItem: any) => {
        newItem.estado = "Cargado"
        queryClient.setQueryData<{ pages: { results: any[] }[] }>(queryKey, (oldData) => {
            if (!oldData) return;
            return {
                ...oldData,
                pages: [
                    {
                        ...oldData.pages[0],
                        results: [newItem, ...oldData.pages[0].results],
                    },
                    ...oldData.pages.slice(1),
                ],
            };
        });
    };

    /** Función para actualizar un item.  
     * Recibe el item completo y lo reemplaza en la lista  
     * Evita tener que invalidar el query para refrescar la lista  
     * (evitando llamadas innecesarias a la API).
     * @param updatedItem - Item actualizado
     * @returns void
     */
    const updateItem = (updatedItem: any) => {
        queryClient.setQueryData<{ pages: { results: any[] }[] }>(
            queryKey,
            (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        results: page.results.map(item =>
                            item.id === updatedItem.id ? updatedItem : item
                        ),
                    })),
                };
            }
        );
    };

    /** Función para eliminar un item.  
     * Recibe el id del item a eliminar y lo quita de la lista.  
     * Evita tener que invalidar el query para refrescar la lista  
     * (evitando llamadas innecesarias a la API).
     * @param deletedItemId - Id del item a eliminar
     * @returns void
     */
    const deleteItem = (deletedItemId: number) => {
        queryClient.setQueryData<{ pages: { results: any[] }[] }>(
            queryKey,
            (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        results: page.results.filter(item => item.id !== deletedItemId),
                    })),
                };
            }
        );
    }

    // Acá se obtiene el contenedor de scroll para detectar si el usuario llegó al final de la lista
    const scrollContainerRef = useContext(ScrollContainerContext);
    // Acá se crea un hook para detectar si el usuario llegó al final de la lista
    const { ref, entry } = useIntersection({
        root: scrollContainerRef.current,
        threshold: 0.25,
    });

    /** Método para asignar la referencia al último elemento de la lista  
     * Para detectar si el usuario llegó al final  
     * Este método se aplica a cada elemento de la tabla, para  
     * determinar si es el último
     * @param {number} i - Índice del elemento en la lista
     * @returns {React.RefObject | null} - Referencia al último elemento o null
     */
    const asignarRef = (i) => {
        if (i === dataFiltrada.length + (refOffset? refOffset: -10) - 1) {
            return ref
        } else {
            return null
        }
    }

    // Acá se detecta si el usuario llegó al final de la lista y se carga la siguiente página
    useEffect(() => {
        if (entry?.isIntersecting && !isLoading) {
            fetchNextPage();
        }
    }, [entry?.isIntersecting, fetchNextPage]);

    return { handleOrdenar, ordenPor, orden, fields: fields[model], headers: headers[model], headersCapitalized: headersCapitalized[model], filters, setFilters, setSearch, data: dataFiltrada, isLoading: (isLoading || isFetchingNextPage), CAMPO_NOMBRE_MAP, queryClient, updateItem, addItem, queryKey, asignarRef, deleteItem }
}