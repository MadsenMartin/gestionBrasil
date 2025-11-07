import { ModelView } from "@/components/general/PaginaCRUDModelos";

export function ReceptoresView() {
  return ModelView("receptores", {
    "razon_social": "Razón Social",
    "nombre_fantasia_pila": "Nombre Fantasía",
    "cnpj": "CNPJ",
  });
}