import { Eye, ChevronRight, ChevronDown, TrendingUp, TrendingDown, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ItemPresupuestoCliente {
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

interface ItemWithChildren extends ItemPresupuestoCliente {
  children: ItemWithChildren[]
  isExpanded?: boolean
}

interface ItemsTableProps {
  displayItems: ItemWithChildren[]
  expandedItems: Set<number>
  clienteSeleccionado: any
  onToggleExpanded: (itemId: number) => void
  onViewItem: (item: ItemPresupuestoCliente) => void
  onCreateChild: (item: ItemPresupuestoCliente) => void
  hasChildren: (itemId: number) => boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompactNumber(amount: number): string {
  const absAmount = Math.abs(amount)
  const sign = amount >= 0 ? '+' : ''

  if (absAmount >= 1000000) {
    return `${sign}${(amount / 1000000).toFixed(1)}M`
  } else if (absAmount >= 1000) {
    return `${sign}${Math.round(amount / 1000)}k`
  } else {
    return `${sign}${amount}`
  }
}

function getSaldoVariant(saldo: number) {
  if (saldo > 0) return "default"
  if (saldo < 0) return "destructive"
  return "secondary"
}

function getSaldoIcon(saldo: number) {
  if (saldo > 0) return <TrendingUp className="h-4 w-4" />
  if (saldo < 0) return <TrendingDown className="h-4 w-4" />
  return null
}

export function ItemsTable({
  displayItems,
  expandedItems,
  clienteSeleccionado,
  onToggleExpanded,
  onViewItem,
  onCreateChild,
  hasChildren
}: ItemsTableProps) {
  if (displayItems?.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">N°</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cliente/Proyecto</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Gastado</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-center">Saldos MDO/MAT</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                {clienteSeleccionado
                  ? "No se encontraron items que coincidan con los filtros aplicados"
                  : "Seleccione un cliente"
                }
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">N°</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">IVA</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Gastado</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-center">Saldos MDO/MAT</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayItems.map((item) => (
            <TableRow
              key={item.id}
              className={`${item.item_padre_id ? "bg-muted/30" : ""} ${hasChildren(item.id) ? "font-medium" : ""}`}
            >
              <TableCell className="font-medium">
                {item.nivel > 1 ? (
                  <span className="text-muted-foreground mr-2">└─</span>
                ) : (
                  item.numero
                )}
              </TableCell>
              <TableCell>
                <div
                  className="font-medium flex items-center"
                  style={{ paddingLeft: `${(item.nivel - 1) * 20}px` }}
                >
                  {hasChildren(item.id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 mr-2"
                      onClick={() => onToggleExpanded(item.id)}
                    >
                      {expandedItems.has(item.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    item.nivel > 1 && <span className="mr-4 p-0">{item.numero}</span>
                  )}
                  {item.nombre}
                </div>
              </TableCell>
              <TableCell className="text-right">{item.iva_considerado}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(item.monto)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.gastado)}</TableCell>
              <TableCell className="text-right">
                <Badge variant={getSaldoVariant(item.saldo)} className="gap-1">
                  {getSaldoIcon(item.saldo)}
                  {formatCurrency(item.saldo)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-1">
                  {(Number(item.monto_mdo) !== 0 || Number(item.saldo_mdo) !== 0) && (
                    <Badge
                      variant={item.saldo_mdo < 0 ? "destructive" : "default"}
                      className="text-xs justify-center"
                    >
                      MDO: {formatCompactNumber(item.saldo_mdo)}
                    </Badge>
                  )}
                  {(Number(item.monto_mat) !== 0 || Number(item.saldo_mat) !== 0) && (
                    <Badge
                      variant={item.saldo_mat < 0 ? "destructive" : "secondary"}
                      className="text-xs justify-center"
                    >
                      MAT: {formatCompactNumber(item.saldo_mat)}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewItem(item)}
                    title="Ver gastos asignados"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* Solo mostrar botón de crear hijo si no es un item hijo */}
                  {!item.item_padre_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCreateChild(item)}
                      title="Crear subitem"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
