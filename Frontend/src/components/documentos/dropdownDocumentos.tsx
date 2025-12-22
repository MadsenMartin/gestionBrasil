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
import { DialogAyuda } from "../ayuda/dialogAyuda"
import { DialogExportacionComprobantes } from "./dialogExportacionComprobantes"

type DropdownDocumentosProps = {
  setSelectMode: any
}

export function DropdownDocumentos({setSelectMode}: DropdownDocumentosProps) {

    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">...</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setSelectMode((prev: any) => !prev)}>
              Imputar documentos
            </DropdownMenuItem>
            </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DialogExportacionComprobantes
            trigger={<DropdownMenuItem onSelect={(e) => {e.preventDefault()}}>Exportar comprobantes</DropdownMenuItem>}
          />

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DialogAyuda
              trigger={<DropdownMenuItem onSelect={(e) => {e.preventDefault()}}>Ayuda</DropdownMenuItem>}
              componente="Tabla Documentos"
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
}