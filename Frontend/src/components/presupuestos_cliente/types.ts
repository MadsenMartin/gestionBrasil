export interface ItemPresupuestoCliente {
  id: number
  cliente_proyecto_id: number
  cliente_proyecto: string
  numero: string
  nombre: string
  iva_considerado: number
  monto_mdo: number
  monto_mat: number
  monto: number
  gastado_mdo: number
  gastado_mat: number
  gastado: number
  saldo_mdo: number
  saldo_mat: number
  saldo: number
  nivel: number
  item_padre_id: number | null
  presupuesto_cliente_id?: number
}

export interface ItemWithChildren extends ItemPresupuestoCliente {
  children: ItemWithChildren[]
  isExpanded?: boolean
}

export interface TotalStats {
  monto: number
  gastado: number
  saldo: number
}
