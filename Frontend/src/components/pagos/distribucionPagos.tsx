"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Caja, Documento } from "@/types/genericos"

type PagoFactura = {
  factura: number
  monto: number
  medio_pago: string
}

type DialogDistribucionPagosProps = {
  open: boolean
  onClose: () => void
  facturas: Documento[]
  medios_pago: FormaPago[]
  total_medios_pago: number
  toast: any
  setDistribucionPagos: any
}

type FormaPago = {
  id: string
  tipo: string
  caja: Caja['caja']
  monto: number
  fechaPago: Date | undefined
  tipoCambio: number | undefined
  pdfCertificado?: string
  numeroCertificado?: string
  tipoRetencion?: string
}

export function DialogDistribucionPagos({
  open,
  onClose,
  facturas,
  medios_pago,
  total_medios_pago,
  toast,
  setDistribucionPagos
}: DialogDistribucionPagosProps) {
  const [pagos, setPagos] = useState<PagoFactura[]>([])
  const [remainingAmount, setRemainingAmount] = useState(total_medios_pago)

  useEffect(() => {
    setPagos(
      facturas.map((factura) => ({
        factura: factura.id,
        monto: 0,
        medio_pago: medios_pago[0]?.id || ""
      }))
    )
    setRemainingAmount(total_medios_pago)
  }, [facturas, medios_pago, total_medios_pago])

  const handlePaymentChange = (index: number, value: string) => {
    const newAmount = Number(value)
    const oldAmount = pagos[index].monto
    const invoice = facturas.find((f) => f.id === pagos[index].factura)
    
    if (invoice && newAmount <= invoice.total && newAmount >= 0) {
      const difference = newAmount - oldAmount
      if (remainingAmount - difference >= 0) {
        const newPagos = [...pagos]
        newPagos[index].monto = newAmount
        setPagos(newPagos)
        setRemainingAmount(remainingAmount - difference)
      } else {
        toast("El monto excede el total disponible para pago.")
      }
    } else {
      toast("El monto no puede exceder el total de la factura o ser negativo.")
    }
  }

  const handleSave = () => {
    if (remainingAmount > 0) {
      toast(`Aún quedan $${remainingAmount.toFixed(2)} por distribuir.`)
    } else {
      // Here you can handle saving the payment distribution
      setDistribucionPagos(pagos)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Distribución de pagos</DialogTitle>
        <Card>
          <CardContent>
            <div className="grid gap-4 p-4">
              {pagos.map((pago, index) => {
                const invoice = facturas.find((f) => f.id === pago.factura)
                return (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <span className="w-1/3">Factura {invoice?.numero} del {invoice?.fecha_documento}</span>
                    <Input
                      type="number"
                      value={pago.monto}
                      onChange={(e) => handlePaymentChange(index, e.target.value)}
                      min={0}
                      max={invoice?.total}
                      step={0.01}
                      className="w-1/3"
                    />
                    <span className="w-1/3 text-right">
                      Total: {invoice?.total.toFixed(2)}
                    </span>
                  </div>
                )
              })}
              <div className="text-right font-bold">
                Restante: {remainingAmount.toFixed(2)}
              </div>
              <Button onClick={handleSave}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
