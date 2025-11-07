import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableBuilder } from "../general/modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { Input } from "../ui/input";
import { Desacopio } from "@/types/acopios";
import { EditarDesacopio } from "./EditarDesacopio";
import { CrearDesacopio } from "./CrearDesacopio";
import { useState } from "react";
import { delete_generico } from "@/endpoints/api";
import { toast } from "sonner";
import { DialogConfirmacion } from "../dialogs/dialogConfirmacion";

type TableBuilderDesacopiosReturn = {
    data: Desacopio[];
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
    deleteItem: (id: number) => void;
}

export function TablaDesacopios() {
    const { data: desacopiosOrdenados, orden, ordenPor, handleOrdenar, headers, headersCapitalized, CAMPO_NOMBRE_MAP, asignarRef, filters, fields, setSearch, setFilters, updateItem, deleteItem }: TableBuilderDesacopiosReturn = TableBuilder("desacopios", 'fecha_entrega')

    const [selectedDesacopio, setSelectedDesacopio] = useState<Desacopio | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return dateString?.split('-').reverse().join('/')
    }

    const getConciliadoStatus = (conciliado: boolean) => {
        return conciliado
            ? { variant: "default" as const, text: "Conciliado" }
            : { variant: "secondary" as const, text: "Pendiente" };
    }

    const handleEditar = (desacopio: Desacopio) => {
        setSelectedDesacopio(desacopio);
        setEditOpen(true);
    };

    const handleCreateSuccess = (newDesacopio: Desacopio) => {
        updateItem(newDesacopio);
    };

    const confirmDelete = async (desacopio: Desacopio) => {
        if (!desacopio) return;

        try {
            await delete_generico({ model: 'acopios/desacopios-crud', id: desacopio.id });
            deleteItem(desacopio.id);
            toast.success('Desacopio eliminado correctamente');
        } catch (error) {
            console.error('Error deleting desacopio:', error);
            toast.error('Error al eliminar el desacopio');
        }
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
                    placeholder="Buscar desacopio..."
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3"
                />
                <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Desacopio
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headersCapitalized.map((header, index) => (
                                <TableHead key={index} className={`font-medium ${["Unitario", "Monto Total"].includes(header) ? "text-right" : ""}`}>
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
                        {desacopiosOrdenados?.map((desacopio, i) => {
                            const conciliadoStatus = getConciliadoStatus(desacopio?.conciliado);
                            return (
                                <TableRow ref={asignarRef(i)} key={desacopio?.id}>
                                    {headers.map((header, index) => (
                                        <TableCell key={index} className={`${["unitario", "monto_total"].includes(header) ? "text-right font-medium" : ""}`}>
                                            {["unitario", "monto_total"].includes(header) ?
                                                formatCurrency(desacopio?.[header as keyof Desacopio] as number) :
                                                header === "fecha_entrega" ?
                                                    formatDate(desacopio?.[header]) :
                                                    desacopio?.[header as keyof Desacopio]
                                            }
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <Badge variant={conciliadoStatus.variant}>
                                            {conciliadoStatus.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditar(desacopio)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                                        <DialogConfirmacion
                title="¿Confirmar eliminación?"
                mensaje="Esta acción no se puede deshacer. Se eliminará permanentemente el desacopio"
                onConfirm={() => confirmDelete(desacopio)}
                trigger={
                    <Button variant="ghost" size="sm" onSelect={(event) => event.preventDefault()}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                }
            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            <EditarDesacopio
                desacopio={selectedDesacopio}
                open={editOpen}
                onOpenChange={setEditOpen}
                updateItem={updateItem}
            />

            <CrearDesacopio
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={handleCreateSuccess}
            />

        </div>
    )
}