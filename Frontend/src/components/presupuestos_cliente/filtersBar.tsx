import { Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComboboxAPIFormless } from "../comboboxes/ComboboxAPI"
import type { ClienteProyecto } from "@/types/genericos"

interface FiltersBarProps {
  clienteSeleccionado: ClienteProyecto | null
  onClienteChange: (item: ClienteProyecto) => void
  onLoadData: (clienteId: string) => void
  onCreateNewItem: () => void
}

export function FiltersBar({
  clienteSeleccionado,
  onClienteChange,
  onLoadData,
  onCreateNewItem
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <ComboboxAPIFormless
        model={"items_presupuesto_clientes_proyectos"}
        fieldToShow="cliente_proyecto"
        fieldToSend="id"
        onValueChange={(value) => onLoadData(String(value))}
        placeholder={clienteSeleccionado ? clienteSeleccionado.cliente_proyecto : "Seleccionar Cliente"}
        onItemChange={onClienteChange}
      />
      <Button 
        variant="outline" 
        onClick={onCreateNewItem}
        disabled={!clienteSeleccionado}
      >
        <Plus className="h-4 w-4 mr-2" />
        Item presupuesto
      </Button>
      <Button disabled={true} variant="outline" size="icon">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
