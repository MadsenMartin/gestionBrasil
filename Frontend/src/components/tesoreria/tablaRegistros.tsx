import { DropdownMenuRegistro } from "./dropdownMenuRegistro";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableBuilder } from "../general/modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { HeaderTablaRegistros } from "./headerTablaRegistros";
import { DialogoNuevoRegistro } from "./dialogNuevoRegistro";
import { DropdownRegistros } from "./dropdownRegistros";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Plus, Columns, Loader2 } from "lucide-react";
import { Registro } from "@/types/genericos";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { GenerarTransferenciaMasiva } from "./generarTransferenciaMasiva";

export function TablaRegistros({ cajas, toast, cajaInicial }) {
    const { handleOrdenar, ordenPor, orden, fields, headers, headersCapitalized, filters, setFilters, setSearch, data: registrosFiltrados, isLoading, asignarRef, CAMPO_NOMBRE_MAP, addItem, updateItem, deleteItem } = TableBuilder("registros", "fecha_reg", -25)
    const [caja, setCaja] = useState(null)
    const { transferir, selectMode, setSelectMode, handleCheck } = GenerarTransferenciaMasiva(toast)

    // De esta forma obtiene la caja inicial del parent, según el usuario logueado
    useEffect(() => {
        setCajaFiltro(cajaInicial)
    }, [cajaInicial])

    const setCajaFiltro = (nuevaCaja: string) => {
        if (nuevaCaja !== null) {
            setFilters(filters.filter(f => f.id !== "caja"))
            setCaja(null)
            if (caja !== nuevaCaja) {
                setFilters([...filters, { id: "caja", field: "caja", value: nuevaCaja, operator: "equals" }])
                setCaja(nuevaCaja)
            }
        }
    }

    const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return dateString.split('-').reverse().join('/')
    }

    // Quitar encabezado de caja si se está filtrando por una sola caja
    const columnas = () => {
        if (caja === null) {
            return headersCapitalized
        } else {
            return headersCapitalized.slice(1)
        }
    }
    // Quitar columna de saldo si se está filtrando por algo que no sea caja
    const columnasSaldo = () => {
        if ((filters.length === 0 || (caja !== null && filters.length === 1))) {
            return columnas()
        } else {
            return columnas().slice(0, -1)
        }
    }

    const columnasIniciales = columnasSaldo().filter(header => header !== 'Neto' && header !== 'IVA' && header !== 'Presupuesto' && header !== 'Total Gasto/Ingreso USD' && header !== 'Monto OP/REC USD')

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
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-start mb-4">
                    <div className="flex-none flex flex-col gap-2">
                        <FilterBuilder filters={filters} fields={fields} onChange={setFilters} onReset={() => setFilters([])} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Columns className="h-4 w-4" />
                                    Columnas
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {columnasSaldo().map((header) => (
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

                    {cajas.length === 0
                        ? (
                            <div className="justify-items-center py-5">
                                <Loader2 className="animate-spin h-4 w-4" />
                            </div>
                        )
                        :
                        <div className="border rounded-lg p-1 bg-background/50">
                            <Tabs>
                                <TabsList className="w-full h-auto flex-wrap justify-center gap-1 bg-transparent">
                                    {cajas.map((_caja) => (
                                        <TabsTrigger
                                            key={_caja.id}
                                            onClick={() => setCajaFiltro(_caja.caja)}
                                            value={`caja_${_caja.id}`}
                                            data-state={caja === _caja.caja ? "active" : "inactive"}
                                            className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground first:ml-0 ml-0 sm:first:ml-0"
                                        >
                                            {_caja.caja}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    }

                    <div className="flex-none flex flex-col gap-2">
                        <DialogoNuevoRegistro
                            toast={toast}
                            addItem={addItem}
                            trigger={
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo registro
                                </Button>
                            }
                        />
                        <DropdownRegistros toast={toast} setSelectMode={setSelectMode} addItem={addItem} />
                    </div>
                    {selectMode &&
                        <>
                            <Button className="bg-green-600" onClick={transferir} >Generar transferencia</Button>
                            <Button className="max-w-24" variant="outline" onClick={() => setSelectMode(false)}>Cancelar</Button>
                        </>}
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
                            {columnasSaldo().map((header, index) => (
                                visibleColumns[header] && (
                                    <HeaderTablaRegistros
                                        key={index}
                                        header={headers[caja ? index + 1 : index]}
                                        handleOrdenar={handleOrdenar}
                                        ordenPor={ordenPor}
                                        orden={orden}
                                        headerCapitalized={header}
                                        hoverTitle={header}
                                        ordenPorCompleto={headers[caja ? index + 1 : index] + (CAMPO_NOMBRE_MAP[headers[caja ? index + 1 : index]] ?? "")}
                                        type={["IVA", "Neto", "Monto OP/REC", "Saldo caja", "Total Gasto/Ingreso", "Total Gasto/Ingreso USD", "Monto OP/REC USD"].includes(header) ? "number" : null}
                                    />
                                )
                            ))}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrosFiltrados && registrosFiltrados?.map((registro: Registro, i) => (
                            <TableRow ref={asignarRef(i)} key={registro?.caja + registro?.id} className={`${registro.realizado ? "" : "bg-slate-200  dark:bg-zinc-800"} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                                {selectMode &&
                                    <TableCell>
                                    {(registro.tipo_reg === "OP" && registro.caja.startsWith("Banco")) && <Checkbox onCheckedChange={() => handleCheck(registro.id)} />}
                                    </TableCell>
                                }
                                {caja === null && visibleColumns['Caja'] && <TableCell>{registro?.caja}</TableCell>}
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
                                {(filters.length === 0 || (caja !== null && filters.length === 1)) && visibleColumns['Saldo caja'] &&
                                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(registro?.saldo_acumulado, cajas.find(c => c.caja === registro.caja)?.moneda === 1 ? 'ARS' : 'USD')}
                                    </TableCell>
                                }
                                <TableCell>
                                    <DropdownMenuRegistro registro={registro} updateItem={updateItem} toast={toast} deleteItem={deleteItem} />
                                </TableCell>
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