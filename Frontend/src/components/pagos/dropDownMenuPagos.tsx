import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogPagoMDO } from "./mdo/dialogNuevoPagoMDO"

export function DropdownMenuPagos({toast}) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">...</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DialogPagoMDO
          toast={toast}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Nuevo pago MDO
            </DropdownMenuItem>
          } />
        <DropdownMenuGroup>
        </DropdownMenuGroup>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}