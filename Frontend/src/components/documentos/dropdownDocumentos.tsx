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
import { DialogCargaMisComprobantes } from "./dialogCargaMisComprobantes"
import { DialogAyuda } from "../ayuda/dialogAyuda"
import { DialogExportacionComprobantes } from "./dialogExportacionComprobantes"

type DropdownDocumentosProps = {
  toast: any,
  setSelectMode: any
}

export function DropdownDocumentos({toast, setSelectMode}: DropdownDocumentosProps) {

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
            <DialogCargaMisComprobantes
              trigger={<DropdownMenuItem onSelect={(e) => {e.preventDefault()}}>Importar mis comprobantes</DropdownMenuItem>}
              toast={toast}
            />
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