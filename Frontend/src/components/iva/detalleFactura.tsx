import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Documento } from "@/types/genericos";
import { useEffect } from "react";

type DetallePagoProps = {
    isOpen: boolean
    onClose: () => void
    factura: Documento
  }

export function DetalleFactura({factura, isOpen, onClose}: DetallePagoProps){ {
    const isPDF = factura?.archivo?.toLowerCase().endsWith('.pdf')

    useEffect(() => {
        if (isOpen) {
            console.log(factura.archivo)
        }
    }, [isOpen])

    const InfoField = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      )

    return(
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[95vh] max-w-7xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        Detalle de la factura
                        <Badge variant="secondary">
                            {factura.tipo_documento} {factura.serie}-{factura.numero}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>
        <div className="grid grid-cols-4 gap-6">
            <Card className="col-span-3">
            <CardContent className="p-4">
                {isPDF ? (
                <iframe
                    src={`${window.location.origin}${factura?.archivo}`}
                    className="h-[65vh] w-full rounded-lg"
                    title="Document Preview"
                />
                ) : (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                    No se puede mostrar una vista previa. El archivo no es un PDF o no existe.
                    </AlertDescription>
                </Alert>
                )}
            </CardContent>
            </Card>

            <Card>
            <CardContent className="p-4">
                <ScrollArea className="h-[65vh] pr-4">
                <div className="grid gap-4">
                    <InfoField label="Proveedor" value={factura.proveedor} />
                    <Separator />
                    <InfoField
                    label="Documento"
                    value={`${factura.tipo_documento} ${factura.serie}-${factura.numero}`}
                    />
                    <Separator />
                    <InfoField label="Fecha" value={factura.fecha_documento.split("-").reverse().join("/")} />
                    <Separator />
                    <InfoField label="Unidad de negocio" value={factura.unidad_de_negocio} />
                    <Separator />
                    <InfoField label="Cliente/Proyecto" value={factura.cliente_proyecto} />
                    <Separator />
                    <InfoField label="Imputación" value={factura.imputacion} />
                    <Separator />
                    <InfoField label="Concepto" value={factura.concepto} />
                    <Separator />
                    <InfoField
                    label="Neto"
                    value={new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                    }).format(Number(factura.neto))}
                    />
                    <Separator />
                    <InfoField
                    label="IVA"
                    value={new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                    }).format(Number(factura.iva))}
                    />
                    <Separator />
                    <InfoField
                    label="Importe total"
                    value={new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                    }).format(factura.total)}
                    />
                    <Separator />
                    <InfoField label="Moneda" value={factura.moneda_display} />
                    <Separator />
                    <InfoField label="Tipo de cambio" value={factura.tipo_de_cambio} />
                </div>
                </ScrollArea>
            </CardContent>
            </Card>
        </div>
        </DialogContent>
        </Dialog>
    )
}
}