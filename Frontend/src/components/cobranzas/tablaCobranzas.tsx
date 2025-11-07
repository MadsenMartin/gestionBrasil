import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { DialogNuevoCertificado } from "./nuevoCertificado";
import { TableBuilder } from "../general/modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { ArrowDown, ArrowUp } from "lucide-react";
import { TableRowSkeleton } from "../presupuestos/tabla/skeletonPresupuesto";
import { SelectorTipoCobro } from "./nuevoCobroDropdown";
import { DropdownMenuCertificado } from "./dropdownMenuCertificado";
import { DropdownMenuCobro } from "./dropdownMenuCobranzas";

export function TablaCobranzas({ toast }: { toast: Function }) {
    const { handleOrdenar, ordenPor, orden, fields, headers, headersCapitalized, filters, setFilters, CAMPO_NOMBRE_MAP, data: cobranzasFiltradas, isLoading, updateItem, addItem, deleteItem, asignarRef } = TableBuilder("cobranzas", "fecha_reg")

    const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return dateString.split('-').reverse().join('/')
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <FilterBuilder
                    filters={filters}
                    fields={fields}
                    onChange={setFilters}
                    onReset={() => setFilters([])}
                />
                <div className="space-x-1">
                    <DialogNuevoCertificado toast={toast} addItem={addItem} />
                    <SelectorTipoCobro toast={toast} addItem={addItem} />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {headersCapitalized?.map((header, index) => (
                                <TableHead key={header}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="flex text-left hover:bg-muted p-0"
                                    >
                                        {header}
                                        {headers[index] + (CAMPO_NOMBRE_MAP[headers[index]] ?? "") === ordenPor &&
                                            (orden === 'asc' ? <ArrowUp className="h-4 w-4" /> :
                                                <ArrowDown className="h-4 w-4" />)}
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cobranzasFiltradas?.map((cobranza, index) => (
                            <TableRow ref={asignarRef(index)} key={cobranza.id}>
                                <TableCell>{cobranza.caja}</TableCell>
                                <TableCell>{cobranza.tipo_reg}</TableCell>
                                <TableCell>{formatDate(cobranza.fecha_reg)}</TableCell>
                                <TableCell>{cobranza.unidad_de_negocio}</TableCell>
                                <TableCell>{cobranza.cliente_proyecto}</TableCell>
                                <TableCell>{cobranza.imputacion}</TableCell>
                                <TableCell>{cobranza.observacion}</TableCell>
                                <TableCell>
                                    {formatCurrency(cobranza.monto_gasto_ingreso_neto, 'ARS')}
                                </TableCell>
                                <TableCell>{formatCurrency(cobranza.iva_gasto_ingreso, 'ARS')}</TableCell>
                                <TableCell>{formatCurrency(cobranza.monto_op_rec, 'ARS')}</TableCell>
                                <TableCell>{cobranza.saldo_caja ? formatCurrency(cobranza.saldo_caja.saldo, 'ARS') : ''}</TableCell>
                                <TableCell>
                                    {cobranza.tipo_reg === 'FCV'
                                        ? <DropdownMenuCertificado updateItem={updateItem} deleteItem={deleteItem} toast={toast} cobranza={cobranza} />
                                        : <DropdownMenuCobro updateItem={updateItem} deleteItem={deleteItem} toast={toast} cobranza={cobranza} />
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                        {isLoading && Array.from({ length: 10 }).map((_, index) => (
                            <TableRowSkeleton key={`skeleton-${index}`} />
                        ))}
                    </TableBody>

                </Table>
            </div>
        </div>
    )
}