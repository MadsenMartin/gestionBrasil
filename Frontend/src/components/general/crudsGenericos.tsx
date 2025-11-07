import { delete_generico, post_generico } from "@/endpoints/api"

export const MODEL_SINGULAR_MAP = {
    registros: 'Registro',
    tipos_reg: 'Tipo de registro',
    documentos: 'Documento',
    proveedores: 'Proveedor',
    receptores: 'Receptor',
    cajas: 'Caja',
    imputaciones: 'Imputación',
    tipos_documento: 'Tipo de documento',
    unidades_de_negocio: 'Unidad de negocio',
    clientes_proyectos: 'Cliente/Proyecto',
    pagos: 'Pago',
    certificados: 'Certificado',
    cobranzas: 'Cobranza',
    presupuestos: 'Presupuesto',
    estados_presupuesto: 'Estado de presupuesto',
    comentarios_presupuesto: 'Comentario de presupuesto',
    actividad_presupuesto: 'Actividad de presupuesto',
    notificaciones: 'Notificación',
    dolar_mep: 'Dólar MEP',
    recibo: 'Recibo',
    personas: 'Persona',
    tareas: 'Tarea',
    usuario: 'Usuario',
    plantillas_registros: 'Plantilla de registro',
    mis_comprobantes: 'Mis comprobantes',
}

export const handleDelete = async ({model, id, toast}: {model: string, id:number, toast: Function}) => {
        try {
            const response = await delete_generico({ model: model, id: id })
            if (response.status === 204) {
                toast(`${MODEL_SINGULAR_MAP[model]} eliminado correctamente`)
            } else {
                toast(`Error al eliminar ${MODEL_SINGULAR_MAP[model]}: ` + response.data)
            }
        } catch (error) {
            if (error.response) {
                toast(`Error al eliminar ${MODEL_SINGULAR_MAP[model]}: ` + error.response.data.detail)
            } else {
                toast(`Error al eliminar ${MODEL_SINGULAR_MAP[model]}: ` + error.message)
            }
        }
    }

export const handlePost = async ({model, data, toast}: {model: string, data: any, toast: Function}) => {
    try {
        const response = await post_generico({ model: model, data: data })
        if (response.status === 201 || response.status === 200) {
            toast(`${MODEL_SINGULAR_MAP[model]} creado correctamente`)
            return response.data
        } else {
            toast(`Error al crear ${MODEL_SINGULAR_MAP[model]}: ` + response.data)
        }
    } catch (error) {
        if (error.response) {
            toast(`Error al crear ${MODEL_SINGULAR_MAP[model]}: ` + error.response.data.detail)
            return null
        } else {
            toast(`Error al crear ${MODEL_SINGULAR_MAP[model]}: ` + error.message)
            return null
        }
    }
}