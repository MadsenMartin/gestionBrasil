import { FileText, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PagoFactura } from "@/types/genericos"
import { useState } from "react"
import { PDFPreview } from "../tesoreria/dialogoRegistrosAsociados"

type DetallePagoProps = {

    pago: PagoFactura
    trigger: React.ReactNode
  }

  export function DetallePago({ pago, trigger }: DetallePagoProps) {
    const [isOpen, onClose] = useState(false)
  
    const InfoField = ({ label, value }: { label: string; value: string | number }) => (
      <div className="flex flex-col space-y-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[95vh] max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Detalle del pago
            <Badge variant="secondary">
              {pago.fecha_pago.split("-").reverse().join("/")} {pago.proveedor} - 
              {pago.monto}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pago" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pago" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Pago
            </TabsTrigger>
            <TabsTrigger value="documento" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pago" className="mt-4">
            <div className="grid grid-cols-4 gap-6">
              <Card className="col-span-3 h-[80vh]">
                <CardContent className="p-4">
                  <PDFPreview
                    url={pago.op}
                    />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-4 p-4">
                  <InfoField label="Fecha" value={pago.fecha_pago.split("-").reverse().join("/")} />
                  <Separator />
                  <InfoField
                    label="Importe"
                    value={new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    }).format(pago.monto)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documento" className="mt-4">
            <ScrollArea className="h-[80vh] pr-4">
            <div className="grid grid-cols-4 gap-6">
              {pago.documentos.map((documento) => (
                <>
              <Card className="col-span-3">
                <CardContent className="p-4">
                  <PDFPreview
                    url={documento.archivo}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[65vh] pr-4">
                    <div className="grid gap-4">
                      <InfoField label="Proveedor" value={documento.proveedor} />
                      <Separator />
                      <InfoField
                        label="Documento"
                        value={`${documento.tipo_documento} ${documento.serie}-${documento.numero}`}
                      />
                      <Separator />
                      <InfoField label="Fecha" value={documento.fecha_documento.split("-").reverse().join("/")} />
                      <Separator />
                      <InfoField label="Unidad de negocio" value={documento.unidad_de_negocio} />
                      <Separator />
                      <InfoField label="Cliente/Proyecto" value={documento.cliente_proyecto} />
                      <Separator />
                      <InfoField label="Imputación" value={documento.imputacion} />
                      <Separator />
                      <InfoField label="Concepto" value={documento.concepto} />
                      <Separator />
                      <InfoField
                        label="Total"
                        value={new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(Number(documento.total))}
                      />
                      <Separator />
                      <InfoField
                        label="Impuestos retidos"
                        value={new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(Number(documento.impuestos_retidos))}
                      />
                      <Separator />
                      <InfoField label="Moneda" value={documento.moneda_display} />
                      <Separator />
                      {/*<InfoField label="Tipo de cambio" value={documento.tipo_de_cambio} />*/}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              </>
              ))}
            </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}