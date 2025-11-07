import { Documento } from "@/types/genericos";
import { useState } from "react";

export function ImputarDocumentos(toast: Function) {
    const [selectMode, setSelectMode] = useState(false)
    const [checkedItems, setCheckedItems] = useState<number[]>([])
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState<Documento[]>([])

    const handleCheck = (id: number) => {
        setCheckedItems(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const imputar = async (docs: Documento[]) => {
        if (checkedItems.length === 0) {
            toast("Seleccione al menos un documento")
            return
        }
        docs = docs.filter((doc) => checkedItems.includes(doc.id))

        const docs_incompletos = docs.filter((doc) => doc.proveedor === null || doc.imputacion === null || doc.fecha_documento === null || doc.cliente_proyecto === null)
        if (docs_incompletos.length > 0) {
            if (docs_incompletos.length === 1) {
                toast("Complete los datos del documento " + docs_incompletos[0].proveedor + " " + docs_incompletos[0].serie + "-" + docs_incompletos[0].numero)
                return
            }
            toast("Complete los datos de los documentos seleccionados")
            return
        }

        setDocumentosSeleccionados(docs)
    }

    return ({ imputar, selectMode, setSelectMode, handleCheck, documentosSeleccionados })
}
