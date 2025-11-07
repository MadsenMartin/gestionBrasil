import { ModelView } from "@/components/general/PaginaCRUDModelos";

export function ClientesProyectosView() {
  return ModelView("clientes_proyectos", {
    "cliente_proyecto": "Cliente/Proyecto",
  });
}