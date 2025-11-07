import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableBuilder } from "../../general/modelFilter";
import { FilterBuilder } from "../../presupuestos/tabla/popoverFiltroPresupuestos";
import { HeaderTablaRegistros } from "../headerTablaRegistros";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Columns} from "lucide-react";
import { Registro } from "@/types/genericos";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import { Checkbox } from "../../ui/checkbox";
import { MarcarComoRecuperado } from "./marcarComoRecuperado";

export function TablaGastosARecuperar() {
    const { handleOrdenar, ordenPor, orden, fields, headers, headersCapitalized, filters, setFilters, setSearch, data: registrosFiltrados, isLoading, asignarRef, CAMPO_NOMBRE_MAP, deleteItem } = TableBuilder("registros", "fecha_reg", -25)

    const onSuccess = (ids: number[]) => {
        ids.map(id => deleteItem(id))
    }

    const { marcar_como_recuperado, selectMode, setSelectMode, handleCheck } = MarcarComoRecuperado(onSuccess)

    useEffect(() => {
        setFilters([{ id: '1', field: 'presupuesto', operator: 'equals', value: '1' }])
    }, [])

    const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return dateString.split('-').reverse().join('/')
    }

    const columnasIniciales = headersCapitalized.filter(header => header !== 'Neto' && header !== 'IVA' && header !== 'Presupuesto' && header !== 'Total Gasto/Ingreso USD' && header !== 'Monto OP/REC USD').slice(0,-1)

    const [visibleColumns, setVisibleColumns] = useState(() => {
        return columnasIniciales.reduce((acc, header) => {
            acc[header] = true;
            return acc;
        }, {});
    });

    const toggleColumnVisibility = (header) => {
        setVisibleColumns(prev => ({
            ...prev,
            [header]: !prev[header]
        }));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 mb-4">
                <div className="flex gap-2">
                    <FilterBuilder filters={filters} fields={fields} onChange={setFilters} onReset={() => setFilters([])} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Columns className="h-4 w-4" />
                                Columnas
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {headersCapitalized.map((header) => (
                                <DropdownMenuCheckboxItem
                                    key={header}
                                    checked={visibleColumns[header]}
                                    onCheckedChange={() => toggleColumnVisibility(header)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {header}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex gap-2">
                    {!selectMode && (
                        <Button className={'max-w-32'} onClick={() => setSelectMode(true)}>Seleccionar</Button>
                    )}
                    {selectMode && (
                        <>
                            <Button className="bg-green-600" onClick={marcar_como_recuperado} >Marcar como recuperados</Button>
                            <Button className="max-w-24" variant="outline" onClick={() => setSelectMode(false)}>Cancelar</Button>
                        </>
                    )}
                </div>
            </div>
                <Input
                        placeholder="Buscar"
                        className="w-full"
                        onChange={(e) => {
                            setSearch(e.target.value)
                        }}
                        />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {selectMode && <TableHead className="w-[50px]"></TableHead>}
                            {headersCapitalized.map((header, index) => (
                                visibleColumns[header] && (
                                    <HeaderTablaRegistros
                                        key={index}
                                        header={headers[index]}
                                        handleOrdenar={handleOrdenar}
                                        ordenPor={ordenPor}
                                        orden={orden}
                                        headerCapitalized={header}
                                        hoverTitle={header}
                                        ordenPorCompleto={headers[index] + (CAMPO_NOMBRE_MAP[headers[index]] ?? "")}
                                        type={["IVA", "Neto", "Monto OP/REC", "Saldo caja", "Total Gasto/Ingreso", "Total Gasto/Ingreso USD", "Monto OP/REC USD"].includes(header) ? "number" : null}
                                    />
                                )
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrosFiltrados && registrosFiltrados?.map((registro: Registro, i) => (
                            <TableRow ref={asignarRef(i)} key={registro?.caja + registro?.id} className={`${registro.realizado ? "" : "bg-slate-200  dark:bg-zinc-800"} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                                {selectMode &&
                                    <TableCell>
                                    {<Checkbox onCheckedChange={() => handleCheck(registro.id)} />}
                                    </TableCell>
                                }
                                {visibleColumns['Caja'] && <TableCell>{registro?.caja}</TableCell>}
                                {visibleColumns['Tipo reg.'] && <TableCell>{registro?.tipo_reg}</TableCell>}
                                {visibleColumns['Fecha reg.'] && <TableCell>{formatDate(registro?.fecha_reg)}</TableCell>}
                                {visibleColumns['Unidad de negocio'] && <TableCell>{registro?.unidad_de_negocio}</TableCell>}
                                {visibleColumns['Cliente/Proyecto'] && <TableCell>{registro?.cliente_proyecto}</TableCell>}
                                {visibleColumns['Contrapartida'] && <TableCell>{registro?.proveedor ? registro.proveedor : registro?.caja_contrapartida}</TableCell>}
                                {visibleColumns['Imputación'] && <TableCell>{registro?.imputacion}</TableCell>}
                                {visibleColumns['Observación'] && <TableCell>{registro?.observacion || null}</TableCell>}
                                {visibleColumns['Presupuesto'] && <TableCell>{registro?.presupuesto}</TableCell>}
                                {visibleColumns['Neto'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.monto_gasto_ingreso_neto, 'ARS')}</TableCell>}
                                {visibleColumns['IVA'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.iva_gasto_ingreso, 'ARS')}</TableCell>}
                                {visibleColumns['Total Gasto/Ingreso'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.total_gasto_ingreso,'ARS')}</TableCell>}
                                {visibleColumns['Monto OP/REC'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.monto_op_rec, 'ARS')}</TableCell>}
                                {visibleColumns['Total Gasto/Ingreso USD'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.total_gasto_ingreso_usd, 'USD')}</TableCell>}
                                {visibleColumns['Monto OP/REC USD'] && <TableCell className="text-right font-medium">{formatCurrency(registro?.monto_op_rec_usd, 'USD')}</TableCell>}
                            </TableRow>
                        ))}
                        {(!registrosFiltrados || isLoading) && Array.from({ length: 10 }).map((_, index) => (
                            <TableRow key={index} className='h-7'></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}