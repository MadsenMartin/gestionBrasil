import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DialogUpdateCertificado } from "./dialogUpdateCertificado";
import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion";
import { delete_generico } from "@/endpoints/api";
import { useState } from "react";
import { Registro } from "@/types/genericos";

export function DropdownMenuCertificado({updateItem, deleteItem, toast, cobranza}: {updateItem:any, deleteItem:any, toast:any, cobranza: Registro}) {
    const [open, setOpen] = useState(false)
    
    const handleDelete = async () => {
        const response = await delete_generico({model: "certificados", id: cobranza.certificado})
        if (response.status != 204) {
            toast("Error al eliminar el certificado")
            return
        } else {
            toast("Certificado eliminado correctamente")
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
                    mensaje="¿Está seguro que desea eliminar el certificado? Esta operación no eliminará los cobros asociados."
                    onConfirm={handleDelete}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}