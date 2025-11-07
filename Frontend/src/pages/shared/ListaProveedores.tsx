import { ModelView } from "@/components/general/PaginaCRUDModelos";

export function ProveedoresView() {
  return ModelView("proveedores", {
    "razon_social": "Razón Social",
    "nombre_fantasia_pila": "Nombre Fantasía",
    "cnpj": "CNPJ",
  });
}