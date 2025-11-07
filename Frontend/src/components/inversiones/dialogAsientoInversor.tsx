import type React from "react"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { get_generico_params } from "@/endpoints/api"
import type { Registro } from "@/types/genericos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormNuevoAsiento } from "./formNuevoAsiento"

export type AsientoInversor = {
  id: number
  fecha_carga: string
  inversor: number
  inversor_nombre: string
  tipo_asiento: string
  tipo_asiento_nombre: string
  registro_cliente_proyecto: string
  registro_id: number
}

interface DialogoAsientoInversorProps {
  trigger: React.ReactNode
  registro_data: Registro
}

export function DialogoAsientoInversor({ trigger, registro_data }: DialogoAsientoInversorProps) {
  const [open, setOpen] = useState(false)
  const [asiento, setAsiento] = useState<AsientoInversor | null>(null)
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const fetchAsiento = async () => {
      if (!open) return

      try {
        setLoading(true)
        const response = await get_generico_params({
          model: "asientos_inversor",
          params: { registro: registro_data.id },
        })

        if (response.data && response.data.results.length > 0) {
          setAsiento(response.data.results[0])
        } else {
          setAsiento(null)
        }
      } catch (error) {
        console.error("Error fetching asiento:", error)
        setAsiento(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAsiento()
  }, [open, registro_data.id])

  const handleAsientoCreated = (newAsiento: AsientoInversor) => {
    setAsiento(newAsiento)
    setCreando(false)
  }

  const handleAsientoUpdated = (updatedAsiento: AsientoInversor) => {
    setAsiento(updatedAsiento)
    setEditando(false)
  }

  const handleCancelCreate = () => {
    setCreando(false)
  }

  const handleCancelEdit = () => {
    setEditando(false)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Cargando información...</p>
        </div>
      )
    }

    if (creando) {
      return (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-lg font-medium">Crear Nuevo Asiento</h3>
          </div>
          <FormNuevoAsiento
            registro_data={registro_data}
            onCreated={handleAsientoCreated}
            onCancel={handleCancelCreate}
          />
        </div>
      )
    }

    if (editando && asiento) {
      return (
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-lg font-medium">Editar Asiento</h3>
          </div>
          <FormNuevoAsiento
            registro_data={registro_data}
            data={asiento}
            onCreated={handleAsientoUpdated}
            onCancel={handleCancelEdit}
          />
        </div>
      )
    }

    if (asiento) {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Header con nombre e inversor */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{asiento.inversor_nombre}</h3>
                <p className="text-muted-foreground">{asiento.tipo_asiento_nombre}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {new Date(asiento.fecha_carga).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Información adicional */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Cliente/Proyecto:</span>
                <span className="text-sm">{asiento.registro_cliente_proyecto}</span>
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={() => setEditando(true)} disabled={editando} variant="outline">
              Editar Asiento
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="font-medium mb-2">Sin asiento inversor</h3>
          <p className="text-sm text-muted-foreground mb-6">
            No se encontró un asiento inversor para este registro. Podés crear uno nuevo.
          </p>
          <Button onClick={() => setCreando(true)} disabled={creando}>
            Crear Asiento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">Asiento Inversor</DialogTitle>
          <DialogDescription>Información del asiento inversor asociado a este registro.</DialogDescription>
        </DialogHeader>

        <div className="mt-6">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
