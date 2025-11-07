import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { get_generico_params } from "@/endpoints/api"
import { SkeletonListPresupuestosCliente } from "./skeletonListPresupuestosCliente"
import { AsignacionRegistrosDialog } from "./asignacionRegistrosPresupuestoCliente"
import { CrearItemDialog } from "./crearItemDialog"
import { StatsCards } from "./statsCards"
import { FiltersBar } from "./filtersBar"
import { ItemsTable } from "./itemsTable"
import { formatCurrency, calculateTotalStats, organizeItemsHierarchy, flattenHierarchyForDisplay } from "./utils"
import type { ClienteProyecto } from "@/types/genericos"
import type { ItemPresupuestoCliente, TotalStats } from "./types"

export default function ItemsPresupuestoCliente() {
  const [items, setItems] = useState<ItemPresupuestoCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteProyecto | null>(null)
  const [selectedItem, setSelectedItem] = useState<ItemPresupuestoCliente | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  
  // Estados para crear nuevos items
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [itemParentForNewChild, setItemParentForNewChild] = useState<ItemPresupuestoCliente | null>(null)
  
  const [totalStats, setTotalStats] = useState<TotalStats>({
    monto: 0,
    gastado: 0,
    saldo: 0,
  })

  const loadData = async (cliente: string) => {
    try {
      setLoading(true)
      const data = await get_generico_params({
        model: "items_presupuesto_cliente",
        params: `cliente_proyecto_id=${cliente}`,
      })
      setItems(data.data.results)
      // Expandir todos los items padre por defecto
      const parentIds = data.data.results
        .filter((item: ItemPresupuestoCliente) =>
          data.data.results.some((child: ItemPresupuestoCliente) => child.item_padre_id === item.id),
        )
        .map((item: ItemPresupuestoCliente) => item.id)
      setExpandedItems(new Set(parentIds))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (itemId: number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const hasChildren = (itemId: number) => {
    return items.some((item) => item.item_padre_id === itemId)
  }

  const openCreateDialog = (parentItem?: ItemPresupuestoCliente) => {
    setItemParentForNewChild(parentItem || null)
    setCreateDialogOpen(true)
  }

  const handleItemCreated = () => {
    if (clienteSeleccionado) {
      loadData(clienteSeleccionado.id.toString())
    }
  }

  useEffect(() => {
    const newTotals = calculateTotalStats(items)
    setTotalStats(newTotals)
  }, [items])

  const organizedItems = organizeItemsHierarchy(items, expandedItems)
  const displayItems = flattenHierarchyForDisplay(organizedItems, expandedItems)

  if (loading) {
    return <SkeletonListPresupuestosCliente />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Presupuestos de Clientes</h1>
        <p className="text-muted-foreground">Control de saldos y seguimiento por item de presupuesto por cliente</p>
      </div>

      {/* Stats Cards */}
      <StatsCards totalStats={totalStats} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Items de Presupuesto</CardTitle>
          <CardDescription>Lista detallada de todos los items de presupuesto por cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <FiltersBar
            clienteSeleccionado={clienteSeleccionado}
            onClienteChange={setClienteSeleccionado}
            onLoadData={loadData}
            onCreateNewItem={() => openCreateDialog()}
          />

          <ItemsTable
            displayItems={displayItems}
            expandedItems={expandedItems}
            clienteSeleccionado={clienteSeleccionado}
            onToggleExpanded={toggleExpanded}
            onViewItem={(item) => {
              setSelectedItem(item)
              setDialogOpen(true)
            }}
            onCreateChild={openCreateDialog}
            hasChildren={hasChildren}
          />

          {displayItems?.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
              <div>
                Mostrando {displayItems?.length} items ({items?.filter((i) => !i.item_padre_id).length} principales)
              </div>
              <div className="flex items-center gap-4">
                <span>Total: {formatCurrency(totalStats.monto)}</span>
                <span>Gastado: {formatCurrency(totalStats.gastado)}</span>
                <span className={totalStats.saldo < 0 ? "text-destructive" : "text-green-600"}>
                  Saldo: {formatCurrency(totalStats.saldo)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <CrearItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        clienteSeleccionado={clienteSeleccionado}
        itemParentForNewChild={itemParentForNewChild}
        items={items}
        onItemCreated={handleItemCreated}
      />

      <AsignacionRegistrosDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onRegistrosUpdated={() => {
          if (clienteSeleccionado) {
            loadData(clienteSeleccionado.id.toString())
          }
        }}
      />
    </div>
  )
}
