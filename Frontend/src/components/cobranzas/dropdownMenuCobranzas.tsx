import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DialogUpdateCertificado } from "./dialogUpdateCertificado";
import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion";
import { delete_generico } from "@/endpoints/api";
import { useState } from "react";
import { Registro } from "@/types/genericos";

export function DropdownMenuCobro({updateItem, deleteItem, toast, cobranza}: {updateItem:any, deleteItem:any, toast:any, cobranza: Registro}) {
    const [open, setOpen] = useState(false)
    
    const handleDelete = async () => {
        const response = await delete_generico({model: "registros", id: cobranza.id})
        if (response.status != 204) {
            toast("Error al eliminar la cobranza")
            return
        } else {
            toast("Cobranza eliminada correctamente")
            deleteItem(cobranza.id)
            setOpen(false)
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DialogUpdateCertificado
                    certificado={cobranza}
                    trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Editar</DropdownMenuItem>
                    }
                    toast={toast}
                    updateItem={updateItem}
                />
                <DialogConfirmacion
                    trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Eliminar</DropdownMenuItem>
                    }
                    mensaje="¿Está seguro que desea eliminar la cobranza?"
                    onConfirm={handleDelete}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}