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
import { DetallePago } from "./detallePago"
import { PagoFactura } from "@/types/genericos"
import { DialogConfirmacion } from "../dialogs/dialogConfirmacion"
import { handleDelete } from "../general/crudsGenericos"

type DropdownMenuPagoProps = {
  pago: PagoFactura
  toast: (message: string) => void
}

export function DropdownMenuPago({pago, toast}: DropdownMenuPagoProps) {
    return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">...</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DetallePago pago={pago} trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Detalle
              </DropdownMenuItem>
              } />
              <DropdownMenuItem onClick={null}>
                Editar
              </DropdownMenuItem>
              <DialogConfirmacion
                title="Eliminar Pago"
                mensaje="¿Estás seguro de que deseas eliminar este pago? Esta acción eliminará los registros relacionados (FC, OP, RETH)"
                trigger={
                  <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                    Eliminar
                  </DropdownMenuItem>
                }
                onConfirm={() => handleDelete({
                  model: "pagos",
                  id: pago.id,
                  toast: toast
                })}
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver historial</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }