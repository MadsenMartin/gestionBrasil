import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogoEstadosDocumento } from "./historialDocumento"
import { DetalleDocumento } from "../dialogs/detalle-documento"
import { DialogTransferencia } from "../pagos/nuevaTransferencia"
import { DialogConfirmacion } from "../dialogs/dialogConfirmacion"
import { delete_generico } from "@/endpoints/api"
import { DialogNuevoDocumento } from "../documentos/dialgoNuevoDocumento"
import { useState } from "react"
import { InformarPagoDocumentoDialog } from "../pagos/documentos/informarPagoDocumento"

type DropdownMenuDocumentoProps = {
  doc: any,
  updateItem: any,
  deleteItem: any,
  toast: any,
}

export function DropdownMenuDocumento({ doc, updateItem, deleteItem, toast }: DropdownMenuDocumentoProps) {

  const [open, setOpen] = useState(false)
  const handleDelete = async (documento: any) => {
    try {
      const response = await delete_generico({model:'documentos', id:documento.id})
      if (response.status === 204) {
        deleteItem(documento.id)
        toast("Documento eliminado correctamente")
      } else {
        toast("Error al eliminar el documento: " + response.data.message)
      }
    } catch (error) {
      toast("Error al eliminar el documento: " + error)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">...</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DetalleDocumento
            currentDoc={doc}
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Detalle
              </DropdownMenuItem>
            }
          />
          <DialogNuevoDocumento
            toast={toast}
            updateDocumento={updateItem}
            data={doc}
           />
          <DialogConfirmacion
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Eliminar
              </DropdownMenuItem>
            }
            onConfirm={() => handleDelete(doc)}
            mensaje="¿Está seguro que desea eliminar el documento?"
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DialogTransferencia
              facturaInicial={doc}
              toast={toast}
              onClose={() => setOpen(false)}
              updateItem={updateItem}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  Generar OP
                </DropdownMenuItem>
              }
            />
            <InformarPagoDocumentoDialog
              documento={doc}
              updateItem={updateItem}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  Informar pago
                </DropdownMenuItem>
              }
            />
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DialogoEstadosDocumento
          documento_id={doc?.id}
          documento_str={`${doc?.proveedor} - ${doc?.tipo_documento} ${doc?.serie}-${doc?.numero}`}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Ver historial
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}