import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Registro } from "@/types/genericos"

export function DetalleRegistro({ dialogoAbierto = false, setDialogoAbierto = () => {}, pagoSeleccionado = null }: { dialogoAbierto?: boolean, setDialogoAbierto?: (open: boolean) => void, pagoSeleccionado?: Registro | null }) {
    return (
        <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
            <DialogContent>
                <div className="space-y-2">
                <Label htmlFor="caja">Caja</Label>
                <Input
                    id="caja"
                    value={pagoSeleccionado.caja}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="documento">Documento</Label>
                <Input
                    id="documento"
                    value={Number(pagoSeleccionado.documento)}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="fecha_reg">Fecha de registro</Label>
                <Input
                    id="fecha_reg"
                    value={pagoSeleccionado.fecha_reg}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="añomes_imputacion">Año y mes de imputación</Label>
                <Input
                    id="añomes_imputacion"
                    value={pagoSeleccionado.añomes_imputacion}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="unidad_de_negocio">Unidad de negocio</Label>
                <Input
                    id="unidad_de_negocio"
                    value={pagoSeleccionado.unidad_de_negocio}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="cliente_proyecto">Cliente/Proyecto</Label>
                <Input
                    id="cliente_proyecto"
                    value={pagoSeleccionado.cliente_proyecto}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="imputacion">Imputación</Label>
                <Input
                    id="imputacion"
                    value={pagoSeleccionado.imputacion}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="observacion">Observación</Label>
                <Input
                    id="observacion"
                    value={pagoSeleccionado.observacion}
                    disabled
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="monto_gasto_ingreso_neto">Monto gasto/ingreso neto</Label>
                <Input
                    id="monto_gasto_ingreso_neto"
                    value={
                    pagoSeleccionado.monto_gasto_ingreso_neto
                    }
                    disabled
                />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="iva_gasto_ingreso">IVA gasto/ingreso</Label>
                    <Input
                    id="iva_gasto_ingreso"
                    value={
                        pagoSeleccionado.iva_gasto_ingreso
                    }
                    disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="monto_op_rec">Monto op/rec</Label>
                    <Input
                    id="monto_op_rec"
                    value={
                        pagoSeleccionado.monto_op_rec
                    }
                    disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Input
                    id="moneda"
                    value={pagoSeleccionado.moneda}
                    disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tipo_de_cambio">Tipo de cambio</Label>
                    <Input
                    id="tipo_de_cambio"
                    value={
                        pagoSeleccionado.tipo_de_cambio
                    }
                    disabled
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}