import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ComboboxAPIFormless } from "@/components/comboboxes/ComboboxAPI"
import { crear_pago_desde_plantilla } from "@/endpoints/api"
import { Loader2 } from "lucide-react"

interface DialogPagoPlantillaProps {
    trigger: React.ReactNode
    toast: any
    movimiento: any
    onSuccess: (movimiento: any) => void
}

export function DialogPagoPlantilla({ trigger, toast, movimiento, onSuccess }: DialogPagoPlantillaProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    const handlePlantillaChange = (value: string | number) => {
        setPlantillaSeleccionada(typeof value === 'string' ? parseInt(value) : value)
    }

    const monto = movimiento.credito 
        ? Math.abs(parseFloat(movimiento.credito.replace(",", ".")))
        : Math.abs(parseFloat(movimiento.debito.replace(",", ".")))

    const handleSubmit = async () => {
        if (!plantillaSeleccionada) {
            toast.error("Debe seleccionar una plantilla")
            return
        }

        setLoading(true)
        try {
            const response = await crear_pago_desde_plantilla(movimiento, plantillaSeleccionada, monto)
            
            if (response.status === 201) {
                toast.success("Pago creado exitosamente desde plantilla")
                onSuccess(movimiento)
                setShowDialog(false)
                setPlantillaSeleccionada(null)
            }
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.response?.data?.error || "Error al crear el pago desde plantilla"
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Pago desde Plantilla</DialogTitle>
                    <DialogDescription>
                        Seleccione una plantilla para crear el registro de pago.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plantilla" className="text-right">
                            Plantilla
                        </Label>
                        <div className="col-span-3">
                            <ComboboxAPIFormless
                                model="plantillas_registros"
                                fieldToShow="nombre"
                                fieldToSend="id"
                                onValueChange={handlePlantillaChange}
                                placeholder="Seleccionar plantilla..."
                            />
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p><strong>Fecha:</strong> {movimiento.fecha}</p>
                        <p><strong>Concepto:</strong> {movimiento.concepto}</p>
                        <p><strong>Descripción:</strong> {movimiento.sub_tipo}</p>
                        <p><strong>Monto:</strong> ${monto.toFixed(2)}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear Pago"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
