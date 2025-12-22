import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenuDocumento } from "../iva/dropdownDocumento"
import { DialogNuevoDocumento } from "./dialgoNuevoDocumento"
import { TableBuilder } from "../general/modelFilter"
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos"
import { Button } from "../ui/button"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownDocumentos } from "./dropdownDocumentos"
import { ImputarDocumentos } from "./imputarDocumentos"
import { Checkbox } from "../ui/checkbox"
import { DialogoImputacionDocumentos } from "./dialogoImputacionDocumentos"
import { Input } from "../ui/input"
import { Documento } from "@/types/genericos"

interface TablaDocumentosProps {
  toast: Function
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

export function TablaDocumentos({ toast }: TablaDocumentosProps) {
  const { handleOrdenar, orden, ordenPor, fields, filters, setFilters, setSearch, data, headersCapitalized, headers, CAMPO_NOMBRE_MAP, asignarRef, addItem, updateItem, deleteItem } = TableBuilder("documentos", "fecha_documento")
  const documentosFiltrados: Documento[] = data
  const { imputar, selectMode, setSelectMode, handleCheck, documentosSeleccionados } = ImputarDocumentos(toast)

  const moneda = (moneda: number) => {
    return moneda === 1 ? "ARS" : moneda === 3 ? "R$" : "USD"
  }

  const formatDate = (dateString: string) => {
    return dateString.split('-').reverse().join('/')
  }

  // Pintar de verde las lineas donde documento.imputado sea true (tiene un registro de caja asociado, generalmente significa que fue pagada)
  const docClassName = (doc: Documento) => {
    const baseClassName = "hover:bg-gray-100 dark:hover:bg-gray-800"
    return doc.imputado 
      ? cn(baseClassName, "bg-green-300 dark:bg-green-950")
      : baseClassName
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
        <div className="space-x-1">
          <DialogNuevoDocumento toast={toast} addDocumento={addItem} />
          {selectMode &&
            <>
              <DialogoImputacionDocumentos
                docs={documentosSeleccionados}
                trigger={
                  <Button className="bg-green-600" onClick={() => imputar(documentosFiltrados)} >Imputar</Button>
                }
                toast={toast}
                updateItem={updateItem}
                setSelectMode={setSelectMode}
                
              />
              <Button variant="outline" onClick={() => setSelectMode(false)}>Cancelar</Button>
            </>}
          <DropdownDocumentos setSelectMode={setSelectMode} />

        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {selectMode && <TableCell className="w-[50px]"></TableCell>}
              {headersCapitalized?.map((header, index) => (
                <TableHead
                  key={header}
                  className={(header === "Neto" ||
                    header === "IVA" ||
                    header === "Tipo de cambio" ||
                    header === "Total") ? "text-right" : "text-left"}>
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
              <TableHead className="px-1 py-2 border-b border-gray-300 dark:border-gray-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentosFiltrados?.map((doc, index) => (
              <TableRow key={doc.id} ref={asignarRef(index)} className={docClassName(doc)}>
                {selectMode &&
                  <TableCell>
                    {!doc.imputado && <Checkbox disabled={doc.imputado} onCheckedChange={() => handleCheck(doc.id)} />}
                  </TableCell>
                }
                {headers.map((header) => (
                  <TableCell key={header} className={cn("border-gray-300 dark:border-gray-500",
                    (header === "neto" ||
                      header === "iva" ||
                      header === "tipo_de_cambio" ||
                      header === "total") ? "text-right" : "text-left"
                  )}>
                    {header === "moneda" ? moneda(doc.moneda) : (header === "neto" ||
                      header === "iva" ||
                      header === "tipo_de_cambio" ||
                      header === "total") ? formatCurrency(Number(doc[header])) : header === "fecha_documento" ? formatDate(doc[header]) : doc[header]}
                  </TableCell>
                ))}
                <TableCell className="px-1 py-2 border-gray-300 dark:border-gray-500 text-center w-1/20">
                  <DropdownMenuDocumento toast={toast} doc={doc} updateItem={updateItem} deleteItem={deleteItem} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}