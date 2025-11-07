import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DialogUpdateCotizacion } from "./dialogUpdateCotizacion";
import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion";
import { delete_generico } from "@/endpoints/api";
import { useState } from "react";

export function DropdownMenuMEP({cotizacion, toast, updateItem, deleteItem}: {cotizacion: any, toast: any, updateItem: any, deleteItem: any}) {
    const [open, setOpen] = useState(false)
    
    const handleDelete = async () => {
        const response = await delete_generico({model: "dolar_mep", id: cotizacion.id})
        if (response.status != 204) {
            toast("Error al eliminar la cotización")
            return
        } else {
            toast("Cotización eliminada correctamente")
            deleteItem(cotizacion.id)
            setOpen(false)            
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DialogUpdateCotizacion
                    cotizacion={cotizacion}
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
                    mensaje="¿Está seguro que desea eliminar la cotización? Esto eliminará todos los registros de ajuste por diferencia de cambio que coincidan con la fecha de la misma."
                    onConfirm={handleDelete}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}