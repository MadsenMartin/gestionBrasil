import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { get_generico_params } from "@/endpoints/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Registro } from "@/types/genericos";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function ListadoConsumosFueraPresupuesto({trigger, presupuesto}) {
    const [showDialog, setShowDialog] = useState(false);
    const [consumos, setConsumos] = useState<Registro[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount: string) => {
        return parseFloat(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
    }

    const formatDate = (dateString: string) => {
        return dateString.split('-').reverse().join('/')
    }

    useEffect(() => {
        const fetchConsumos = async () => {
            if (showDialog) {
                console.log(presupuesto)
                const response = await get_generico_params({model: "consumos_fuera_presupuesto", params: { presupuesto: presupuesto.id }});
                setConsumos(response.data);
                setLoading(false);
            }
        }
        fetchConsumos();
    }, [showDialog, presupuesto])

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-screen-2xl">
                <DialogHeader>
                <div className="p-4 flex justify-between">
                    <DialogTitle className="font-bold">Consumos fuera del presupuesto</DialogTitle>
                    <Badge variant="outline" className="font-medium w-fit">
                        {presupuesto.cliente_proyecto} - {presupuesto.proveedor} - {presupuesto.observacion}
                    </Badge>
                </div>
                </DialogHeader>
                <DialogDescription>Consumos del proveedor y cliente/proyecto fuera del presupuesto</DialogDescription>
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                            <span className="text-muted-foreground">Cargando consumos...</span>
                        </div>
                    </div>
                ) : consumos.length > 0 ? (
                    <div className="p-4">
                        <ScrollArea className="w-full h-[700px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Caja</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo reg.</TableHead>
                                    <TableHead>Cliente/Proyecto</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Imputación</TableHead>
                                    <TableHead>Observación</TableHead>
                                    <TableHead>Presupuesto</TableHead>
                                    <TableHead>Total gasto/ingreso</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {consumos.map(consumo => (
                                    <TableRow key={consumo.id}>
                                        <TableCell>{consumo.caja}</TableCell>
                                        <TableCell>{formatDate(consumo.fecha_reg)}</TableCell>
                                        <TableCell>{consumo.tipo_reg}</TableCell>
                                        <TableCell>{consumo.cliente_proyecto}</TableCell>
                                        <TableCell>{consumo.proveedor}</TableCell>
                                        <TableCell>{consumo.imputacion}</TableCell>
                                        <TableCell>{consumo.observacion}</TableCell>
                                        <TableCell>{consumo.presupuesto}</TableCell>
                                        <TableCell>{formatCurrency((+consumo.monto_gasto_ingreso_neto + +consumo.iva_gasto_ingreso).toString())}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                </div>) :
                <div className="p-4 text-muted-foreground text-center">No hay consumos fuera del presupuesto</div>}
                <DialogDescription></DialogDescription>
            </DialogContent>
        </Dialog>
    )
}