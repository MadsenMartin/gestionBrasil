import { ArrowDown, ArrowUp } from "lucide-react"
import { TableBuilder } from "../../general/modelFilter"
import { FilterBuilder } from "../../presupuestos/tabla/popoverFiltroPresupuestos"
import { Button } from "../../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { DialogNuevaPlantilla } from "./dialogNuevaPlantilla"
import { DropdownMenuPlantilla } from "./dropdownMenuPlantilla"

export function TablaPlantillas({ toast }: { toast: Function }) {
    const { handleOrdenar, orden, ordenPor, fields, filters, setFilters, data: plantillasFiltradas, headersCapitalized, headers, CAMPO_NOMBRE_MAP, asignarRef, addItem, updateItem, deleteItem } = TableBuilder("plantillas_registros")
    const fieldsAMostrar = ["nombre", "tipo_reg", "unidad_de_negocio_label", "cliente_proyecto_label", "proveedor_label", "imputacion_label", "observacion"]

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
                    <DialogNuevaPlantilla toast={toast} addPlantilla={addItem} />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {headersCapitalized?.map((header, index) => (
                                <TableHead
                                    key={header}
                                >
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleOrdenar(headers[index])}
                                        className="p-0"
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
                            <TableHead className="border-gray-300 dark:border-gray-500"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plantillasFiltradas?.map((item, index) => (
                            <TableRow key={item.id} ref={asignarRef(index)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                {fieldsAMostrar.map((field) => (
                                    <TableCell key={field} className="border-gray-300 dark:border-gray-500">
                                        {item[field]}
                                    </TableCell>
                                ))}
                                <TableCell className="px-1 py-2 border-gray-300 dark:border-gray-500 text-center w-1/20">
                                    <DropdownMenuPlantilla toast={toast} plantilla={item} updateItem={updateItem} deleteItem={deleteItem} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>

    )
}