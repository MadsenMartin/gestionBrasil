import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardsProps {
  totalStats: {
    monto: number
    gastado: number
    saldo: number
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getSaldoIcon(saldo: number) {
  if (saldo > 0) return <TrendingUp className="h-4 w-4 text-muted-foreground" />
  if (saldo < 0) return <TrendingDown className="h-4 w-4 text-muted-foreground" />
  return null
}

export function StatsCards({ totalStats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalStats.monto)}</div>
          <p className="text-xs text-muted-foreground">Presupuesto total asignado</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalStats.gastado)}</div>
          <p className="text-xs text-muted-foreground">Suma de gastos hasta la fecha</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          {getSaldoIcon(totalStats.saldo)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalStats.saldo < 0 ? "text-destructive" : "text-green-600"}`}>
            {formatCurrency(totalStats.saldo)}
          </div>
          <p className="text-xs text-muted-foreground">Saldo disponible restante</p>
        </CardContent>
      </Card>
    </div>
  )
}
