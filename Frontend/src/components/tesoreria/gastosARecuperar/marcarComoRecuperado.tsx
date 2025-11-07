import { post_generico } from "@/endpoints/api";
import { useState } from "react";
import { toast } from "sonner";

export function MarcarComoRecuperado(onSuccess) {
    const [selectMode, setSelectMode] = useState(false)
    const [checkedItems, setCheckedItems] = useState<number[]>([])

    const handleCheck = (id: number) => {
        setCheckedItems(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const marcar_como_recuperado = async () => {
        if (checkedItems.length === 0) {
            toast("Seleccione al menos un registro")
            return
        }

        const data = { ids: checkedItems }

        try {
            const response = await post_generico({ data: data, model: 'marcar_como_recuperado' })
            if (response.status === 200) {
                toast.success("Registros marcados como recuperados")
                setSelectMode(false)
                onSuccess(checkedItems)
                setCheckedItems([])
            }
        } catch (error) {
            console.error("Error al marcar como recuperados:", error)
            toast.error("Error al marcar como recuperados")
        }
    }

    return ({ marcar_como_recuperado, selectMode, setSelectMode, handleCheck })
}