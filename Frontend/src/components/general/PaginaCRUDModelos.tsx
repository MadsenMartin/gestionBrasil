import { createElement } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toaster, toast } from 'sonner';
import { delete_generico } from "@/endpoints/api"
import { DialogNuevoProveedor, DialogNuevoReceptor } from "./personas/dialogNuevaPersona";
import { DialogNuevoClienteProyecto } from "./clientes_proyectos/dialogNuevoClienteProyecto";
import { DialogUpdateClienteProyecto } from "./clientes_proyectos/updateClienteProyecto";
import { DialogUpdateProveedor, DialogUpdateReceptor } from "./personas/updatePersona";
import { DialogConfirmacion } from "../dialogs/dialogConfirmacion";
import { TableBuilder } from "./modelFilter";
import { FilterBuilder } from "../presupuestos/tabla/popoverFiltroPresupuestos";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";

const MODEL_CREATE_MAP: Record<string, (props: any) => JSX.Element> = {
  proveedores: (props) => <DialogNuevoProveedor {...props} />,
  receptores: (props) => <DialogNuevoReceptor {...props} />,
  clientes_proyectos: (props) => <DialogNuevoClienteProyecto {...props} />,
};

const MODEL_PATCH_MAP: Record<string, (props: any) => JSX.Element> = {
  clientes_proyectos: (props) => <DialogUpdateClienteProyecto {...props} />,
  proveedores: (props) => <DialogUpdateProveedor {...props} />,
  receptores: (props) => <DialogUpdateReceptor {...props} />,
};

const MODEL_NAME_MAP: Record<string, string[]> = {
  "clientes_proyectos": ["Clientes/Proyectos", "Cliente/Proyecto"],
  "proveedores": ["Proveedores", "Proveedor"],
  "cajas": ["Cajas", "Caja"],
  "documentos": ["Documentos", "Documento"],
  "registros": ["Registros", "Registro"],
  "pagos": ["Pagos", "Pago"],
  "pagos_mdo": ["Pagos MDO", "Pago MDO"],
  "pagos_facturas": ["Pagos Facturas", "Pago Factura"],
  "receptores": ["Receptores", "Receptor"],
  "facturas": ["Facturas", "Factura"],
}

/**
 *  Componente que muestra una tabla con los datos de un modelo de la base de datos.  
 *  Permite filtrar y ordenar los datos, además de crear nuevos elementos y borrarlos, a partir de diccionarios con los componentes a utilizar.
 * @param model Nombre del modelo de la base de datos.
 * @param campos Objeto con los campos del modelo y su nombre a mostrar.
 * @returns JSX.Element
 * @example
 * ```tsx
 * <ModelView model="receptores" campos={{ "razon_social": "Razón Social", "nombre_fantasia_pila": "Nombre Fantasía", "cnpj": "CNPJ" }} />
 * ```
 * @see 
 * [ProveedoresView](/src/pages/ListaProveedores.tsx)
 * [ReceptoresView](/src/pages/ListaReceptores.tsx)
*/
export function ModelView(model: string, campos: { [key: string]: string }) {
  const { data: dataOrdenada, isLoading, asignarRef, handleOrdenar, filters, setFilters, fields, headers, headersCapitalized, orden, ordenPor } = TableBuilder(model);

  const handleBorrar = async (id) => {

    // Si el modelo es proveedores o receptores, el endpoint es personas, no tengo views de detalle de proveedores o receptores
    const del_model = model === "proveedores" ? "personas" : model === "receptores" ? "personas" : model

    const response = await delete_generico({
      model: del_model, id: id
    });
    if (response.status !== 204) {
      toast("Error al eliminar el elemento: " + response.data);
      return;
    }
    // Acá tengo que invalidar el query para refrescar

    toast("Elemento eliminado correctamente.");
  };

  return (
    <div className="container mx-auto p-4 w-11/12">

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4">{MODEL_NAME_MAP[model][0]}</h1>
      </div>
      <div className="flex justify-between items-center mb-4">
        <FilterBuilder filters={filters} fields={fields} onChange={setFilters} onReset={() => setFilters([])} />
        {MODEL_CREATE_MAP[model] && createElement(MODEL_CREATE_MAP[model], { buttonStr: `Cargar nuevo ${MODEL_NAME_MAP[model][1]}`, toast: toast, tipo: model === "proveedores" ? MODEL_NAME_MAP[model][1] : null })}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headersCapitalized.map((header, index) => (
                <TableHead key={index} className="font-medium">
                  <Button
                    variant="ghost"
                    onClick={() => handleOrdenar(headers[index])}
                    className="flex text-left hover:bg-muted p-0"
                  >
                    {header}
                    {headers[index] === ordenPor &&
                      (orden === 'asc' ? <ArrowUp className="h-4 w-4" /> :
                        <ArrowDown className="h-4 w-4" />)
                    }
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataOrdenada?.map((item, i) => (
              <TableRow ref={asignarRef(i)} key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-500">
                {Object.keys(campos).map((key: string) => (
                  <TableCell key={key} className="px-4 py-2 dark:border-gray-500">{item[key]}</TableCell>
                ))}
                <TableCell className="px-1 py-2">
                  {MODEL_PATCH_MAP[model] && createElement(MODEL_PATCH_MAP[model], { initialData: item, toast: toast })}
                  <DialogConfirmacion onConfirm={() => handleBorrar(item.id)} mensaje={'¿Está seguro de que desea eliminar el elemento?'} />
                </TableCell>
              </TableRow>
            ))}
            {(isLoading) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Toaster />
      </div>
    </div>
  )
}