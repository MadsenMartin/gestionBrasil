import { delete_generico } from "@/endpoints/api"
import { toast } from "sonner"

interface HandleDeleteProps {
    instancia: any
    deleteItem: (id: number) => void
    model: string
    prefix?: 'el' | 'la'
}

export const handleDelete = async ({ instancia, deleteItem, model, prefix}: HandleDeleteProps) => {
    try {
        const response = await delete_generico({ model, id: instancia.id })
        if (response.status === 204) {
            deleteItem(instancia.id)
            let capitalizedModel = model.charAt(0).toUpperCase() + model.slice(1);
            toast.success(`${capitalizedModel} ${prefix === 'el' ? 'eliminado' : 'eliminada'} correctamente`)
        } else {
            toast.error("Error al eliminar " + (prefix ? prefix + " " : "el/la ") + model + ": " + response.data.message)
        }
    } catch (error: Error | any) {
        const errorMessage = error.response?.data?.message || error.message || "Error desconocido"
        toast.error("Error al eliminar " + (prefix ? prefix + " " : "el/la ") + model + ": " + errorMessage)

    }
}