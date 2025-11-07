import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActualizarEstadoPresupuestoDialog } from "./acciones/actualizarEstadoPresupuestoDialog"
import { EstadosPresupuestoDialog } from "./acciones/historialPresupuestos"
import { useState } from "react"
import { Presupuesto } from "../types/presupuestos"
import { PresupuestoDetalleDialog } from "./acciones/detallePresupuesto"
import { delete_generico } from "@/endpoints/api"
import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion"
import { DialogUpdatePresupuesto } from "../dialogUpdatePrespuesto"
import { ListadoConsumosPresupuesto } from "./acciones/listadoConsumosPpto"
import { DialogCargaArchivo } from "./acciones/dialogCargaArchivo"
import { ListadoConsumosFueraPresupuesto } from "./acciones/listadoConsumosFueraPresupuesto"

interface DropdownMenuPresupuestoProps {
    presupuesto: Presupuesto
    toast: any
    updateItem: (updatedItem: any) => void
    deleteItem: (deletedItemId: number) => void
}

export function DropDownMenuPresupuesto({ presupuesto, toast, updateItem, deleteItem }: DropdownMenuPresupuestoProps) {
    const [showForm, setShowForm] = useState(false)
    const [showHistorial, setShowHistorial] = useState(false)

    const deletePresupuesto = async () => {
        try {
            const response = await delete_generico({ model: 'presupuestos', id: presupuesto.id })
            if (response.status === 204) {
                deleteItem(presupuesto.id)
                toast('Presupuesto eliminado exitosamente')
            } else {
                throw new Error('Error en la respuesta del servidor.')
            }
        } catch (error) {
            toast('Error al eliminar el presupuesto: ' + error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <PresupuestoDetalleDialog presupuesto={presupuesto} toast={toast}>
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            Detalle
                        </DropdownMenuItem>
                    </PresupuestoDetalleDialog>
                    <DialogUpdatePresupuesto toast={toast} updateItem={updateItem} initialData={presupuesto} trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                            Editar
                        </DropdownMenuItem>
                    } />
                    <DialogConfirmacion onConfirm={deletePresupuesto} mensaje={`¿Está seguro de que desea eliminar el presupuesto ${presupuesto.nombre}?`}
                        trigger={
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                                Eliminar
                            </DropdownMenuItem>}
                    />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DialogCargaArchivo
                        presupuesto={presupuesto.id}
                        toast={toast}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault() }}>
                                Cargar archivo
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowForm(true); }}>
                        Actualizar estado
                    </DropdownMenuItem>
                    <ActualizarEstadoPresupuestoDialog presupuesto={presupuesto} showForm={showForm} setShowForm={setShowForm} toast={toast} updateItem={updateItem} />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowHistorial(true); }}>
                    Ver historial
                </DropdownMenuItem>
                <EstadosPresupuestoDialog presupuesto_id={presupuesto.id} isOpen={showHistorial} onClose={setShowHistorial} />
                <ListadoConsumosPresupuesto
                    trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Lista de consumos</DropdownMenuItem>
                    }
                    presupuesto={presupuesto}
                />
                <ListadoConsumosFueraPresupuesto
                    trigger={
                        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Consumos fuera del ppto</DropdownMenuItem>
                    }
                    presupuesto={presupuesto}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}