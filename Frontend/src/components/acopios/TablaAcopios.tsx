import { ArrowDown, ArrowUp, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableBuilder } from "../general/modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { Input } from "../ui/input";
import { Acopio } from "@/types/acopios";
import { Badge } from "../ui/badge";
import { DetalleAcopio } from "./DetalleAcopio";
import { EditarAcopio } from "./EditarAcopio";
import { CrearAcopio } from "./CrearAcopio";
import { useState } from "react";
import { Plus } from "lucide-react";

type TableBuilderAcopiosReturn = {
    data: Acopio[];
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

export function TablaAcopios() {
    const { data: acopiosOrdenados, orden, ordenPor, handleOrdenar, headers, headersCapitalized, CAMPO_NOMBRE_MAP, asignarRef, filters, fields, setSearch, setFilters, updateItem }: TableBuilderAcopiosReturn = TableBuilder("acopios", 'fecha')
    const [selectedAcopio, setSelectedAcopio] = useState<Acopio | null>(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return dateString?.split('-').reverse().join('/')
    }

    const getSaldoStatus = (saldo: number) => {
        if (saldo <= 10000) return { variant: "destructive" as const, text: "Agotado" };
        if (saldo < 20000) return { variant: "outline" as const, text: "Crítico" };
        return { variant: "default" as const, text: "Activo" };
    }

    const handleVerDetalle = (acopio: Acopio) => {
        setSelectedAcopio(acopio);
        setDetalleOpen(true);
    };

    const handleEditar = (acopio: Acopio) => {
        setSelectedAcopio(acopio);
        setEditOpen(true);
    };

    const handleCreateSuccess = (newAcopio: Acopio) => {
        updateItem(newAcopio);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <FilterBuilder
                        filters={filters}
                        fields={fields}
                        onChange={setFilters}
                        onReset={() => setFilters([])}
                    />
                </div>
                <Input
                    type="text"
                    placeholder="Buscar acopio..."
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3"
                />
                <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Acopio
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headersCapitalized.map((header, index) => (
                                <TableHead key={index} className={`font-medium ${["Monto", "Saldo"].includes(header) ? "text-right" : ""}`}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="flex text-left hover:bg-muted p-0 h-auto"
                                    >
                                        {header}
                                        {headers[index] + (CAMPO_NOMBRE_MAP[headers[index]] ?? "") === ordenPor &&
                                            (orden === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> :
                                                <ArrowDown className="h-4 w-4 ml-1" />)
                                        }
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {acopiosOrdenados?.map((acopio, i) => {
                            const saldoStatus = getSaldoStatus(acopio?.saldo);
                            return (
                                <TableRow ref={asignarRef(i)} key={acopio?.id}>
                                    {headers.map((header, index) => (
                                        <TableCell key={index} className={`${["monto", "iva", "total", "saldo"].includes(header) ? "text-right font-medium" : ""}`}>
                                            {["monto", "iva", "total", "saldo"].includes(header) ?
                                                formatCurrency(acopio?.[header as keyof Acopio] as number) :
                                                header === "fecha" ?
                                                    formatDate(acopio?.[header]) :
                                                    acopio?.[header as keyof Acopio]
                                            }
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <Badge variant={saldoStatus.variant}>
                                            {saldoStatus.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(acopio)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditar(acopio)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <DetalleAcopio
                acopio={selectedAcopio}
                open={detalleOpen}
                onOpenChange={setDetalleOpen}
            />

            <EditarAcopio
                acopio={selectedAcopio}
                open={editOpen}
                onOpenChange={setEditOpen}
                updateItem={updateItem}
            />

            <CrearAcopio
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={handleCreateSuccess}
            />
        </div>
    )
}