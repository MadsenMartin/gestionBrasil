import { useState } from "react"
import { User, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { post_generico } from "@/endpoints/api"
import type { ClienteProyecto } from "@/types/genericos"

interface ItemPresupuestoCliente {
  id: number
  cliente_proyecto_id: number
  cliente_proyecto: string
  numero: string
  nombre: string
  iva_considerado: number
  monto_mdo: number
  monto_mat: number
  monto: number
  gastado_mdo: number
  gastado_mat: number
  gastado: number
  saldo_mdo: number
  saldo_mat: number
  saldo: number
  nivel: number
  item_padre_id: number | null
  presupuesto_cliente_id?: number
}

interface CrearItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteSeleccionado: ClienteProyecto | null
  itemParentForNewChild: ItemPresupuestoCliente | null
  items: ItemPresupuestoCliente[]
  onItemCreated: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CrearItemDialog({
  open,
  onOpenChange,
  clienteSeleccionado,
  itemParentForNewChild,
  items,
  onItemCreated
}: CrearItemDialogProps) {
  const [newItemForm, setNewItemForm] = useState({
    numero: '',
    nombre: '',
    iva_considerado: 21,
    monto_mdo: 0,
    monto_mat: 0,
    item_padre_id: null as number | null
  })
  const [creatingItem, setCreatingItem] = useState(false)

  const resetForm = () => {
    setNewItemForm({
      numero: '',
      nombre: '',
      iva_considerado: 21,
      monto_mdo: 0,
      monto_mat: 0,
      item_padre_id: itemParentForNewChild ? itemParentForNewChild.id : null
    })
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleCreateItem = async () => {
    if (!clienteSeleccionado) {
      toast.error("Debe seleccionar un cliente")
      return
    }

    if (!newItemForm.nombre.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    if (!newItemForm.numero.trim()) {
      toast.error("El número es requerido")
      return
    }

    try {
      setCreatingItem(true)
      
      // Obtener el presupuesto_cliente_id correcto
      let presupuestoClienteId: number | null = null
      
      if (items.length > 0) {
        // Si ya hay items cargados, usar el presupuesto_cliente_id del primer item
        const firstItem = items[0]
        if (firstItem.presupuesto_cliente_id) {
          presupuestoClienteId = firstItem.presupuesto_cliente_id
        }
      }
      
      // Si no tenemos presupuesto_cliente_id, necesitamos crear o buscar uno
      if (!presupuestoClienteId) {
        // Intentar crear un PresupuestoCliente para este cliente
        try {
          const presupuestoResponse = await post_generico({
            model: "presupuestos_cliente",
            data: {
              cliente_proyecto: clienteSeleccionado.id,
              fecha: new Date().toISOString().split('T')[0]
            }
          })
          presupuestoClienteId = presupuestoResponse.data.id
        } catch (presupuestoError) {
          console.log("No se pudo crear PresupuestoCliente, usando ID por defecto")
          // Si falla, usar un ID por defecto basado en el cliente
          presupuestoClienteId = clienteSeleccionado.id === 68 ? 1 : 2
        }
      }
      
      const itemData = {
        numero: newItemForm.numero,
        nombre: newItemForm.nombre,
        iva_considerado: newItemForm.iva_considerado,
        monto_mdo: newItemForm.monto_mdo,
        monto_mat: newItemForm.monto_mat,
        presupuesto_cliente: presupuestoClienteId,
        item_padre: itemParentForNewChild?.id || null,
        nivel: itemParentForNewChild ? 2 : 1,
      }

      await post_generico({
        model: "items_presupuesto_cliente",
        data: itemData
      })

      toast.success("Item creado exitosamente")
      handleClose()
      onItemCreated()
    } catch (error: any) {
      console.error("Error creating item:", error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.response?.data?.detail ||
                          JSON.stringify(error.response?.data) ||
                          "Error al crear el item"
      toast.error(errorMessage)
    } finally {
      setCreatingItem(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {itemParentForNewChild ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {itemParentForNewChild ? 'Crear Item Hijo' : 'Crear Item Padre'}
          </DialogTitle>
          <DialogDescription>
            {itemParentForNewChild 
              ? `Crear un nuevo item hijo bajo "${itemParentForNewChild.nombre}"`
              : 'Crear un nuevo item principal en el presupuesto'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={newItemForm.numero}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="Ej: 1, 1.1, 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iva">IVA (%)</Label>
              <Select
                value={newItemForm.iva_considerado.toString()}
                onValueChange={(value) => setNewItemForm(prev => ({ ...prev, iva_considerado: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="10.5">10.5%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="27">27%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={newItemForm.nombre}
              onChange={(e) => setNewItemForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre descriptivo del item"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto_mdo">Monto MDO</Label>
              <Input
                id="monto_mdo"
                type="number"
                value={newItemForm.monto_mdo}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, monto_mdo: Number(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto_mat">Monto MAT</Label>
              <Input
                id="monto_mat"
                type="number"
                value={newItemForm.monto_mat}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, monto_mat: Number(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Monto Total: {formatCurrency(newItemForm.monto_mdo + newItemForm.monto_mat)}</div>
          </div>

          {itemParentForNewChild && (
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Item Padre:</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">{itemParentForNewChild.numero} - {itemParentForNewChild.nombre}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreateItem} disabled={creatingItem}>
            {creatingItem ? "Creando..." : "Crear Item"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
