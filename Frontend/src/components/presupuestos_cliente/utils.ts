import type { ItemPresupuestoCliente, ItemWithChildren, TotalStats } from './types'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCompactNumber(amount: number): string {
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

export function calculateTotalStats(itemsArray: ItemPresupuestoCliente[]): TotalStats {
  if (!itemsArray || itemsArray.length === 0) {
    return { monto: 0, gastado: 0, saldo: 0 }
  }
  const itemsPrincipales = itemsArray.filter((item) => !item.item_padre_id)

  return itemsPrincipales.reduce(
    (acc, item) => ({
      monto: acc.monto + Number(item.monto),
      gastado: acc.gastado + Number(item.gastado),
      saldo: acc.saldo + Number(item.saldo),
    }),
    { monto: 0, gastado: 0, saldo: 0 },
  )
}

export function organizeItemsHierarchy(
  itemsArray: ItemPresupuestoCliente[], 
  expandedItems: Set<number>
): ItemWithChildren[] {
  const itemsMap = new Map(
    itemsArray.map((item) => [
      item.id,
      {
        ...item,
        children: [] as ItemWithChildren[],
        isExpanded: expandedItems.has(item.id),
      },
    ]),
  )
  const rootItems: ItemWithChildren[] = []

  itemsArray.forEach((item) => {
    const itemWithChildren = itemsMap.get(item.id)!
    if (item.item_padre_id) {
      const padre = itemsMap.get(item.item_padre_id)
      if (padre) {
        padre.children.push(itemWithChildren)
      }
    } else {
      rootItems.push(itemWithChildren)
    }
  })

  return rootItems
}

export function flattenHierarchyForDisplay(
  items: ItemWithChildren[], 
  expandedItems: Set<number>
): ItemWithChildren[] {
  const result: ItemWithChildren[] = []

  const addItemAndVisibleChildren = (item: ItemWithChildren) => {
    result.push(item)
    if (item.children.length > 0 && expandedItems.has(item.id)) {
      item.children.forEach((child) => addItemAndVisibleChildren(child))
    }
  }

  items.forEach(addItemAndVisibleChildren)
  return result
}
