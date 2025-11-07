'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ComboboxAPI } from '../comboboxes/ComboboxAPI'
import { useForm, useFieldArray } from "react-hook-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

// Define types for factura and imputacion
type FacturaVarios = {
    id: number;
    numero: string;
    proveedor: string;
    total: number;
    neto: number;
    iva: number;
};

type Imputacion = {
    factura_id?: number;
    cliente_proyecto?: number;
    monto?: number;
};

type DialogProps = {
    isOpen: boolean;
    onClose: () => void;
    facturas: FacturaVarios[];
    onConfirm: (imputaciones: Imputacion[]) => void;
};

// Define schema for validation
const imputacionSchema = z.object({
    imputaciones: z.array(z.object({
        factura_id: z.number(),
        cliente_proyecto: z.number().nullable(),
        monto: z.coerce.number()
    }))
});

type ImputacionFormValues = z.infer<typeof imputacionSchema>;

export function DialogoImputacionMultiple({ isOpen, onClose, facturas, onConfirm }: DialogProps) {
    // Setup form with react-hook-form
    const form = useForm<ImputacionFormValues>({
        resolver: zodResolver(imputacionSchema),
        defaultValues: {
            imputaciones: []
        }
    });

    // Initialize imputations for each factura
    useEffect(() => {
        if (isOpen && facturas.length > 0) {
            // Reset any previous data
            form.reset({
                imputaciones: facturas.map(factura => ({
                    factura_id: factura.id,
                    cliente_proyecto: null,
                    monto: Number(factura.neto) + Number(factura.iva) // Default to total amount
                }))
            });
        }
    }, [isOpen, facturas, form]);

    const { fields, append, remove } = useFieldArray({
        name: "imputaciones",
        control: form.control
    });

    // Group imputations by factura for display
    const imputacionesPorFactura = facturas.reduce((acc, factura) => {
        acc[factura.id] = fields.filter(field => 
            form.getValues(`imputaciones.${fields.indexOf(field)}.factura_id`) === factura.id
        );
        return acc;
    }, {});

    // Add a new imputacion for a specific factura
    const addImputacion = (facturaId: number) => {
        append({
            factura_id: facturaId,
            cliente_proyecto: null,
            monto: 0
        });
    };

    // Calculate total percentage for a factura's imputaciones
    const calcularTotalMonto = (facturaId: number) => {
        return fields
            .filter(field => form.getValues(`imputaciones.${fields.indexOf(field)}.factura_id`) === facturaId)
            .reduce((sum, field) => {
                const index = fields.indexOf(field);
                const monto = Number(form.getValues(`imputaciones.${index}.monto`)) || 0;
                return sum + monto;
            }, 0);
    };

    const onSubmit = (data: ImputacionFormValues) => {
        // Validate that total percentage for each factura is 100%
        const isValid = facturas.every(factura => {
            const totalMonto = calcularTotalMonto(factura.id);
            return Math.abs(factura.neto + factura.iva - totalMonto) < 0.01; // Allow for floating point imprecision
        });

        if (isValid) {
            onConfirm(data.imputaciones);
        } else {
            // Show error message - could be handled through form state
            alert("El total debe coincidir con el de la factura.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[95vh]">
                <DialogHeader>
                    <DialogTitle>Imputar facturas a múltiples clientes/proyectos</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {facturas.map(factura => (
                                <div key={factura.id} className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">
                                            {factura.numero} - {factura.proveedor}
                                        </h3>
                                        <span className="font-semibold">${factura.total.toFixed(2)}</span>
                                    </div>
                                    
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cliente/Proyecto</TableHead>
                                                <TableHead>Monto</TableHead>
                                                <TableHead className="w-[100px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {imputacionesPorFactura[factura.id]?.map((field) => {
                                                const fieldIndex = fields.indexOf(field);
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell>
                                                                            <ComboboxAPI
                                                                                id={`imputaciones.${fieldIndex}.cliente_proyecto`}
                                                                                model="clientes_proyectos"
                                                                                fieldToShow="cliente_proyecto"
                                                                                fieldToSend="id"
                                                                                control={form.control}
                                                                                formLabel={false}
                                                                                className="w-full"
                                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField
                                                                control={form.control}
                                                                name={`imputaciones.${fieldIndex}.monto`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <div className="flex items-center">
                                                                            <span className="mr-2">$</span>
                                                                                <Input
                                                                                    type="number"
                                                                                    inputMode='decimal'
                                                                                    step="0.01"
                                                                                    {...field}
                                                                                    className="w-32"
                                                                                />
                                                                                
                                                                            </div>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button 
                                                                type="button" 
                                                                variant="destructive" 
                                                                size="sm"
                                                                onClick={() => remove(fieldIndex)}
                                                                disabled={imputacionesPorFactura[factura.id]?.length <= 1}
                                                            >
                                                                Eliminar
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    
                                    <div className="flex justify-between items-center">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => addImputacion(factura.id)}
                                        >
                                            Agregar Imputación
                                        </Button>
                                        <div className="text-sm">
                                            Total: ${calcularTotalMonto(factura.id).toFixed(2)}
                                            {Math.abs(calcularTotalMonto(factura.id) - factura.total) > 0.01 && (
                                                <span className="ml-2 text-red-500">
                                                    (Debe sumar ${factura.neto + factura.iva})
                                                </span>

                                            )}
                                        </div>
                                    </div>
                                    <Separator />
                                </div>
                            ))}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    Confirmar Imputaciones
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}