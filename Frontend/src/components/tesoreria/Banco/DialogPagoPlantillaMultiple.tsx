import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ComboboxAPIFormless } from "@/components/comboboxes/ComboboxAPI"
import { crear_pago_desde_plantilla } from "@/endpoints/api"
import { Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DialogPagoPlantillaMultipleProps {
    trigger: React.ReactNode
    toast: any
    movimientos: any[]
    onSuccess: (movimientos: any[]) => void
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export function DialogPagoPlantillaMultiple({ trigger, toast, movimientos, onSuccess }: DialogPagoPlantillaMultipleProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    const handlePlantillaChange = (value: string | number) => {
        setPlantillaSeleccionada(typeof value === 'string' ? parseInt(value) : value)
    }

    const totalMonto = movimientos.reduce((total, movimiento) => {
        const monto = movimiento.credito 
            ? Math.abs(parseFloat(movimiento.credito.replace(",", ".")))
            : Math.abs(parseFloat(movimiento.debito.replace(",", ".")))
        return total + monto
    }, 0)

    const handleSubmit = async () => {
        if (!plantillaSeleccionada) {
            toast.error("Debe seleccionar una plantilla")
            return
        }

        setLoading(true)
        let exitosos = []
        let errores = []

        try {
            // Procesar cada movimiento secuencialmente
            for (const movimiento of movimientos) {
                try {
                    const monto = movimiento.credito 
                        ? Math.abs(parseFloat(movimiento.credito.replace(",", ".")))
                        : Math.abs(parseFloat(movimiento.debito.replace(",", ".")))
                    
                    const response = await crear_pago_desde_plantilla(movimiento, plantillaSeleccionada, monto)
                    
                    if (response.status === 201) {
                        exitosos.push(movimiento)
                    }
                } catch (error: any) {
                    console.error(`Error procesando movimiento ${movimiento.id}:`, error)
                    errores.push({
                        movimiento,
                        error: error.response?.data?.error || "Error desconocido"
                    })
                }
            }

            // Mostrar resultados
            if (exitosos.length > 0) {
                toast.success(`${exitosos.length} pagos creados exitosamente desde plantilla`)
                onSuccess(exitosos)
            }

            if (errores.length > 0) {
                toast.error(`${errores.length} pagos fallaron. Ver consola para detalles.`)
            }

            if (exitosos.length === movimientos.length) {
                setShowDialog(false)
                setPlantillaSeleccionada(null)
            }

        } catch (error: any) {
            console.error(error)
            toast.error("Error general al procesar los pagos")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Crear Pagos desde Plantilla</DialogTitle>
                    <DialogDescription>
                        Seleccione una plantilla para aplicar a los {movimientos.length} movimientos seleccionados
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
                                fieldToShow="observacion"
                                fieldToSend="id"
                                placeholder="Seleccione una plantilla"
                                onValueChange={handlePlantillaChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right font-semibold">
                            Total:
                        </Label>
                        <div className="col-span-3 font-semibold">
                            {formatCurrency(totalMonto)}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h4 className="font-medium mb-2">Movimientos a procesar:</h4>
                        <ScrollArea className="h-[300px] border rounded">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movimientos.map((movimiento, index) => {
                                        const monto = movimiento.credito 
                                            ? Math.abs(parseFloat(movimiento.credito.replace(",", ".")))
                                            : Math.abs(parseFloat(movimiento.debito.replace(",", ".")))
                                        
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{movimiento.fecha}</TableCell>
                                                <TableCell>{movimiento.concepto}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(monto)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!plantillaSeleccionada || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear {movimientos.length} Pagos
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
