import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button"
import { DropdownMenuPago } from "@/components/pagos/dropdownPago";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { /*Caja,*/PagoFactura } from "@/types/genericos";
//import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
//import { useEffect, useState } from "react";
//import { get_generico } from "@/endpoints/api";
import { TableBuilder } from "../general/modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { DropdownMenuPagos } from "./dropDownMenuPagos";
import { Input } from "../ui/input";

type TableBuilderPagosReturn = {
        data: PagoFactura[];
        orden: string;
        ordenPor: string;
        handleOrdenar: (campo: string) => void;
        headers: string[];
        headersCapitalized: string[];
        CAMPO_NOMBRE_MAP: Record<string, string>;
        asignarRef: (index: number) => (element: HTMLTableRowElement | null) => void;
        filters: any[];
        fields: any[];
        setFilters: (filters: any[]) => void;
        setSearch: (search: string) => void;
        updateItem: (item: any) => void;
}

export function TablaPagos({ toast }) {
    const { data: pagosOrdenados, orden, ordenPor, handleOrdenar, headers, headersCapitalized, CAMPO_NOMBRE_MAP, asignarRef, filters, fields, setSearch, setFilters } : TableBuilderPagosReturn= TableBuilder("pagos",'fecha_pago')
    /*const [cajaFiltro, setCajaFiltro] = useState<number | null>(null)
    const [cajas, setCajas] = useState<Caja[]>([])

    useEffect(() => {
        const fetchCajas = async () => {
            try {
                const cajasData = await get_generico('cajas');
                setCajas(cajasData.results);
            } catch (error) {
                toast("Error al cargar las cajas");
            }
        };
        fetchCajas();
    }, []);*/

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
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
                <Input
                type="text"
                placeholder="Buscar..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-1/3"
                />
                {/*<Tabs>
                    <TabsList>
                        {cajas.map((caja) => (
                            <TabsTrigger
                                key={caja.id}
                                onClick={() => setCajaFiltro(caja.id)}
                                value={`caja_${caja.id}`}
                                data-state={cajaFiltro === caja.id ? "active" : "inactive"} // Creo que acá es que hace que se deseleccione la caja
                            >
                                {caja.caja}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>*/}
                <DropdownMenuPagos toast={toast}/>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headersCapitalized.map((header, index) => (
                                <TableHead key={index} className={`font-medium ${header === "Monto" ? "justify-items-end" : ""}`}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="flex text-left hover:bg-muted p-0"
                                    >
                                        {header}
                                        {headers[index] + (CAMPO_NOMBRE_MAP[headers[index]] ?? "") === ordenPor &&
                                            (orden === 'asc' ? <ArrowUp className="h-4 w-4" /> :
                                                <ArrowDown className="h-4 w-4" />)
                                        }
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pagosOrdenados?.map((pago, i) => (
                            <TableRow ref={asignarRef(i)} key={pago?.id}>
                                <TableCell>{pago?.caja}</TableCell>
                                <TableCell>{formatDate(pago?.fecha_pago || '')}</TableCell>
                                <TableCell>{pago?.obra}</TableCell>
                                <TableCell>{pago?.proveedor}</TableCell>
                                <TableCell>{pago.documentos[0]?.concepto || ''}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pago?.monto)}
                                </TableCell>
                                {/*<TableCell className="flex justify-center items-center">
                                    {registro.registro.realizado ? <Checkbox checked={true} disabled={true}/> : <DialogRealizarRegistro registro={registro.registro} toast={toast} updateItem={updateItem} />}
                                </TableCell>*/}
                                <TableCell>
                                    <DropdownMenuPago pago={pago} toast={toast}/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}