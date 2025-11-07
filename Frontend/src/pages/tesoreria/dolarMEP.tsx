import { TableBuilder } from "@/components/general/modelFilter"
import { FilterBuilder } from "@/components/presupuestos/tabla/popoverFiltroPresupuestos"
import { DropdownMenuMEP } from "@/components/tesoreria/MEP/dropdownMenuMEP"
import { NuevaCotizacion } from "@/components/tesoreria/MEP/nuevaCotizacion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown } from "lucide-react"
import { toast, Toaster } from "sonner"

export const formatDate = (dateString: string) => {
    return dateString.split('-').reverse().join('/')
}

export const formatCurrency = (amount: number, currency='ARS') => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(amount)
}

export function DolarMEP() {
    const { data: cotizaciones, filters, asignarRef, fields, setFilters, handleOrdenar, headersCapitalized, headers, orden, ordenPor, updateItem, deleteItem } = TableBuilder("dolar_mep")

    return (
        <div className="mx-auto w-full p-12">
            <div className="flex justify-between items-center mb-4">
                <div className="flex justify-start">
                    <h1 className="text-2xl font-bold mb-4">Dólar MEP</h1>
                </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <FilterBuilder
                        filters={filters}
                        fields={fields}
                        onChange={setFilters}
                        onReset={() => { setFilters([]) }}
                    />
                    <NuevaCotizacion toast={toast} />
            </div>
            <div className="rounded-md border max-w-screen-xl mx-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {headersCapitalized.map((header, index) => (
                                <TableHead
                                    key={index}
                                    className="text-left">
                                    <Button
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="px-0"
                                        variant="ghost"
                                    >
                                    {header}
                                    {ordenPor === headers[index] && (
                                        orden === 'asc' ? <ArrowDown className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                                    )}
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cotizaciones?.map((cotizacion, index) => (
                            <TableRow ref={asignarRef(index)} key={index}>
                                <TableCell>
                                    {formatDate(cotizacion.fecha)}
                                </TableCell>
                                <TableCell>
                                    {formatCurrency(cotizacion.compra)}
                                </TableCell>
                                <TableCell>
                                    {formatCurrency(cotizacion.venta)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenuMEP cotizacion={cotizacion} toast={toast} updateItem={updateItem} deleteItem={deleteItem}/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Toaster />
        </div>
    )
}