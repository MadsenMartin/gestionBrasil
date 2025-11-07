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
import { delete_generico } from "@/endpoints/api"
import { Registro } from "@/types/genericos"
import { DialogoUpdateRegistro } from "./dialogUpdateRegistro"
import { DialogConfirmacion } from "../dialogs/dialogConfirmacion"
import { DialogRealizarRegistro } from "../pagos/dialogRealizarRegistro"
import { DialogoRegistrosAsociados } from "./dialogoRegistrosAsociados"
import { DialogCargaArchivo } from "./dialogCargaArchivo"
import { DialogoAsientoInversor } from "../inversiones/dialogAsientoInversor"
import { HistorialRegistroDialog } from "./historialRegistro"
import { generarRecibo } from "./reciboTemplate"
import { useState } from "react"

type DropdownMenuRegistroProps = {
  registro: Registro
  updateItem: (updatedItem: Registro) => void
  deleteItem: (deletedItemId: number) => void
  toast: Function
}

export function DropdownMenuRegistro({ registro, updateItem, deleteItem, toast }: DropdownMenuRegistroProps) {
  const [showHistorial, setShowHistorial] = useState(false)

  const generar_recibo = (pago: Registro) => {
    console.log("Generando recibo para el pago: ", pago)
    generarRecibo(pago)
    toast('Recibo generado exitosamente')
  }

  const deleteRegistro = async () => {
    try {
      const response = await delete_generico({ model: 'registros', id: registro.id })
      if (response.status === 204) {
        deleteItem(registro.id)
        toast('Registro eliminado exitosamente')
      } else {
        throw new Error('Error en la respuesta del servidor.')
      }
    } catch (error) {
      toast('Error al eliminar el registro: ' + error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">...</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {registro.realizado
              ? null
              : <DialogRealizarRegistro
                registro={registro}
                toast={toast}
                updateItem={updateItem}
                trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Realizar</DropdownMenuItem>}
              />}
            <DialogoUpdateRegistro
              initialData={registro}
              toast={toast}
              updateItem={updateItem}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  Editar
                </DropdownMenuItem>
              }
            />
            <DialogConfirmacion
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  Eliminar
                </DropdownMenuItem>
              }
              mensaje="¿Está seguro de que desea eliminar el registro?"
              onConfirm={deleteRegistro}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowHistorial(true); }}>
            Ver historial
          </DropdownMenuItem>
          <DialogoRegistrosAsociados registro={registro} trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Ver registros asociados</DropdownMenuItem>
          } />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { if (registro.proveedor != null) generar_recibo(registro) }}>Generar recibo</DropdownMenuItem>
          <DialogCargaArchivo
            registro={registro.id}
            toast={toast}
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Cargar archivo</DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />

          <DialogoAsientoInversor
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Ver asiento inversor
              </DropdownMenuItem>
            }
            registro_data={registro}
          />

        </DropdownMenuContent>
      </DropdownMenu>
      
      <HistorialRegistroDialog 
        isOpen={showHistorial}
        onClose={setShowHistorial}
        registro_id={registro.id}
        registro_str={`${registro.tipo_reg} - ${registro.fecha_reg} - ${registro.proveedor || 'Sin proveedor'} - ${registro.observacion || 'Sin observación'}`}
      />
    </>
  )
}