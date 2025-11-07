import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion"
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
import { DialogNuevaPlantilla } from "./dialogNuevaPlantilla"

interface DropDownMenuPlantillaProps {
    plantilla: any
    toast: Function
    deleteItem: Function
    updateItem: Function
}

export function DropdownMenuPlantilla({ plantilla, toast, deleteItem, updateItem }: DropDownMenuPlantillaProps) {

  const handleDelete = async (plantilla: any) => {
    try {
      const response = await delete_generico({model:'plantillas_registros', id:plantilla.id})
      if (response.status === 204) {
        deleteItem(plantilla.id)
        toast("Plantilla eliminada correctamente")
      } else {
        toast("Error al eliminar la plantilla: " + response.data.message)
      }
    } catch (error) {
      toast("Error al eliminar la plantilla: " + error)
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
          <DialogNuevaPlantilla
            toast={toast}
            updateItem={updateItem}
            data={plantilla}
           />
          <DialogConfirmacion
            trigger={
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Eliminar
              </DropdownMenuItem>
            }
            onConfirm={() => handleDelete(plantilla)}
            mensaje="¿Está seguro que desea eliminar la plantilla?"
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}