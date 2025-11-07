import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropDownMenuPresupuesto } from "../dropdown/dropdownMenuPresupuestos";
import { Button } from "../../ui/button";
import { FilterBuilder } from "./popoverFiltroPresupuestos";
import { ArrowUp, ArrowDown } from "lucide-react"
import { TableBuilder } from "../../general/modelFilter";
import { TableRowSkeleton } from "./skeletonPresupuesto";
import { DialogNuevoPresupuesto } from "../dialogNuevoPresupuesto";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { PresupuestoDetalleDialog } from "../dropdown/acciones/detallePresupuesto";
import { useEffect, useState } from "react";

export function TablaPresupuestos({ toast }) {
    const { handleOrdenar, ordenPor, orden, fields, headers, headersCapitalized, filters, setFilters, setSearch, CAMPO_NOMBRE_MAP, data: presupuestosFiltrados, isLoading, updateItem, addItem, deleteItem, asignarRef } = TableBuilder("presupuestos")

    // Hook genérico para manejar URL filters
    const { updateFiltersWithUrl, clearAllFilters, searchParams } = useUrlFilters(filters, setFilters, {
        urlFields: ['estado', 'proveedor', 'cliente_proyecto', 'id'],
        defaultOperators: {
            estado: 'equals',
            proveedor: 'contains',
            cliente_proyecto: 'contains',
            id: 'equals'
        }
    });

    // Estado para controlar el diálogo de detalle
    const [detallePresupuesto, setDetallePresupuesto] = useState(null);
    const [showDetalle, setShowDetalle] = useState(false);
    const [autoTrigger, setAutoTrigger] = useState(false);
    const [lastDetalleId, setLastDetalleId] = useState(null);

    // Efecto para detectar parámetro 'detalle' y abrir el diálogo
    useEffect(() => {
        const detalleId = searchParams.get('detalle');
        
        // Solo proceder si el ID cambió o si tenemos datos y no hemos procesado este ID
        if (detalleId && detalleId !== lastDetalleId && presupuestosFiltrados?.length > 0) {
            const presupuesto = presupuestosFiltrados.find(p => p.id.toString() === detalleId);
            if (presupuesto) {
                setLastDetalleId(detalleId);
                setDetallePresupuesto(presupuesto);
                setShowDetalle(true);
                // Trigger automático después de un pequeño delay
                setTimeout(() => setAutoTrigger(true), 100);
            }
        } else if (!detalleId && lastDetalleId) {
            // Solo limpiar si realmente se removió el parámetro
            setShowDetalle(false);
            setDetallePresupuesto(null);
            setAutoTrigger(false);
            setLastDetalleId(null);
        }
    }, [searchParams, presupuestosFiltrados, lastDetalleId]);

    const formatDate = (dateString: string) => {
        return dateString.split('-').reverse().join('/')
    }

    const formatCurrency = (amount: string) => {
        return parseFloat(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <FilterBuilder
                    filters={filters}
                    fields={fields}
                    onChange={updateFiltersWithUrl}
                    onReset={clearAllFilters}
                />

                <Input
                    type="text"
                    placeholder="Buscar..."
                    className="w-1/3"
                    onChange={(e) => setSearch(e.target.value)}
                />

                <DialogNuevoPresupuesto toast={toast} addItem={addItem} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {headersCapitalized?.map((header, index) => (
                                <TableHead key={header} className={`${(header === "Monto"||header=== "Saldo")? "justify-items-end":""} ${(header === "Estado")? "pl-5":""} font-medium`}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="flex text-left hover:bg-muted p-0"
                                    >
                                        {header}

                                        {/* Si el campo por el que se está ordenando es igual al campo actual, se muestra la flecha*/}
                                        {headers[index] + (CAMPO_NOMBRE_MAP[headers[index]] ?? "") === ordenPor &&
                                            (orden === 'asc' ? <ArrowUp className="h-4 w-4" /> :
                                                <ArrowDown className="h-4 w-4" />)
                                        }
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {presupuestosFiltrados?.map((presupuesto, i) => presupuesto && presupuesto.fecha && (
                            <TableRow ref={asignarRef(i)} key={presupuesto.id} className="hover:bg-muted/50">
                                <TableCell>{formatDate(presupuesto.fecha)}</TableCell>
                                <TableCell className="font-medium">{presupuesto.proveedor}</TableCell>
                                <TableCell>{presupuesto.cliente_proyecto}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                    {presupuesto.observacion}
                                </TableCell>
                                <TableCell className="text-end font-medium">
                                    {formatCurrency(presupuesto.monto)}
                                </TableCell>
                                <TableCell className="text-end font-medium">
                                    {formatCurrency(presupuesto.saldo)}
                                </TableCell>
                                <TableCell className="pl-5">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${presupuesto.estado === "Aprobado"
                                        ? "bg-green-100 text-green-700"
                                        : presupuesto.estado === "Rechazado"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-700"
                                        }`}>
                                        {presupuesto.estado}
                                    </span>
                                </TableCell>
                                <TableCell className="text-2xl">
                                    <Checkbox  checked={presupuesto.aprobado === "Aprobado"} disabled />
                                </TableCell>
                                <TableCell>
                                    <DropDownMenuPresupuesto
                                        presupuesto={presupuesto}
                                        updateItem={updateItem}
                                        deleteItem={deleteItem}
                                        toast={toast}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {isLoading && Array.from({ length: 10 }).map((_, index) => (
                            <TableRowSkeleton key={`skeleton-${index}`} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Diálogo de detalle automático cuando hay parámetro 'detalle' en URL */}
            {detallePresupuesto && showDetalle && (
                <PresupuestoDetalleDialog 
                    presupuesto={detallePresupuesto} 
                    toast={toast}
                >
                    {/* Trigger automático que se activa cuando autoTrigger es true */}
                    <button 
                        ref={(button) => {
                            if (button && autoTrigger) {
                                button.click();
                                setAutoTrigger(false);
                            }
                        }}
                        style={{ display: 'none' }}
                    />
                </PresupuestoDetalleDialog>
            )}
        </div>
    )
}