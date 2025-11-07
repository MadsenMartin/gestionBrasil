import { generar_transferencia_masiva } from "@/endpoints/api";
import { useState } from "react";

export function GenerarTransferenciaMasiva(toast: Function) {
    const [selectMode, setSelectMode] = useState(false)
    const [checkedItems, setCheckedItems] = useState<number[]>([])

    const handleCheck = (id: number) => {
        setCheckedItems(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const transferir = async () => {
        if (checkedItems.length === 0) {
            toast("Seleccione al menos un registro")
            return
        }

        console.log("Registros seleccionados para transferencia:", checkedItems)
        generar_transferencia_masiva(checkedItems)
    }

    return ({ transferir, selectMode, setSelectMode, handleCheck })
}