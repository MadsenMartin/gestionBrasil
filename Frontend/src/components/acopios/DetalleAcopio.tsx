import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Acopio, DBDesacopio } from '@/types/acopios';
import axios from 'axios';
import { URL_MAP } from '@/endpoints/api';

interface DetalleAcopioProps {
    acopio: Acopio | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DetalleAcopio({ acopio, open, onOpenChange }: DetalleAcopioProps) {
    const [desacopios, setDesacopios] = useState<DBDesacopio[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && acopio) {
            fetchDesacopios();
        }
    }, [open, acopio]);

    const fetchDesacopios = async () => {
        if (!acopio) return;
        
        setLoading(true);
        try {
            const response = await axios.get(`${URL_MAP.acopios}${acopio.id}/desacopios/`);
            setDesacopios(response.data.results || []);
        } catch (error) {
            console.error('Error fetching desacopios:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return dateString?.split('-').reverse().join('/');
    };

    const totalDesacopios = desacopios.reduce((sum, desacopio) => 
        sum + (desacopio.unitario * desacopio.cantidad * (1 + desacopio.alicuota / 100)), 0
    );

    if (!acopio) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalle del Acopio: {acopio.nombre}</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(acopio.total)}</div>
                            <p className="text-xs text-muted-foreground">
                                Neto: {formatCurrency(acopio.monto)} + IVA: {formatCurrency(acopio.iva)}
                            </p>
                            <p className="text-xs text-muted-foreground">Fecha: {formatDate(acopio.fecha)}</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Desacopios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDesacopios)}</div>
                            <p className="text-xs text-muted-foreground">{desacopios.length} desacopios</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${acopio.saldo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(acopio.saldo)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {acopio.saldo > 0 ? 'Disponible' : 'Agotado'}
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Acopiante</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold">{acopio.acopiante_nombre}</div>
                            <p className="text-xs text-muted-foreground">T/C: {acopio.tipo_de_cambio}</p>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-3">Desacopios Asociados</h3>
                    {loading ? (
                        <div className="text-center py-8">Cargando desacopios...</div>
                    ) : desacopios.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay desacopios para este acopio
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead className="text-right">Unitario</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Obra</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {desacopios.map((desacopio) => (
                                        <TableRow key={desacopio.id}>
                                            <TableCell>
                                                {formatDate(desacopio.fecha_entrega)}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{desacopio.nombre}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {desacopio.codigo}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{desacopio.cantidad}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(desacopio.unitario)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(
                                                    desacopio.unitario * desacopio.cantidad * (1 + desacopio.alicuota / 100)
                                                )}
                                            </TableCell>
                                            <TableCell>{desacopio.obra}</TableCell>
                                            <TableCell>
                                                <Badge variant={desacopio.conciliado ? "default" : "secondary"}>
                                                    {desacopio.conciliado ? "Conciliado" : "Pendiente"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}