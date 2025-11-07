import { Clock } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { get_db_total } from "@/endpoints/api"
import { DialogConfirmacion } from "@/components/dialogs/dialogConfirmacion"
import { useAuth } from "@/auth/authContext"

// Organize reports into categories
const reportCategories = {
  expenses: {
    title: "Gastos",
    items: [
      {
        id: "gastos-por-obra",
        title: "Gastos por obra",
        description: "Lista de gastos por cliente/proyecto",
        isAvailable: true,
      },
      {
        id: "gastos-por-unidad",
        title: "Gastos por unidad",
        description: "Resumen de gastos por unidad de negocio",
        isAvailable: true,
      },
      {
        id: "gastos-por-casa",
        title: "Gastos por casa",
        description: "Detalle de gastos por casa de inversión",
        isAvailable: true,
      },
      {
        id: "db_total",
        title: "DB Total",
        description: "Excel con todos los registros",
        isAvailable: true,
        component:
          <DialogConfirmacion
            variant="default"
            confirmText="Descargar"
            trigger={
              <Button
                className="w-full bg-[#1a2744] hover:bg-[#2a3754] text-white font-medium"
                size="lg"
              >
                Descargar
              </Button>
            }
            onConfirm={get_db_total} title="Confirmar" mensaje="¿Está seguro de que desea descargar todos los registros de caja? Esta acción demorará unos minutos."
          />,
      },
    ],
  },
  budgets: {
    title: "Presupuestos",
    items: [
      {
        id: "mdo-vs-ppto-x-proveedor",
        title: "Mano de obra VS Presupuesto por proveedor",
        description: "Detalle de saldos de presupuestos para el proveedor seleccionado",
        isAvailable: true,
      },
      {
        id: "mdo-vs-ppto-x-obra",
        title: "Mano de obra VS Presupuesto por obra",
        description: "Detalle de saldos de presupuestos para el cliente/proyecto seleccionado",
        isAvailable: true,
      },
      {
        id: "presupuestos-por-cliente_proyecto",
        title: "Presupuestos por obra",
        description: "Detalle de presupuestos por cliente/proyecto",
        isAvailable: true,
      },
      {
        id: "presupuestos-por-proveedor",
        title: "Presupuestos por proveedor",
        description: "Detalle de presupuestos por proveedor",
        isAvailable: true,
      },
    ],
  },
  others: {
    title: "Otros reportes",
    items: [
      {
        id: "movimientos-de-caja",
        title: "Movimientos de caja",
        description: "Detalle de los movimientos de caja entre fechas seleccionadas",
        isAvailable: true,
      },
      {
        id: "proyecciones-de-saldos",
        title: "Proyecciones de saldos",
        description: "Cashflow de las cajas",
        isAvailable: false,
      },
      {
        id: "impuestos",
        title: "Impuestos",
        description: "Resumen de los impuestos",
        isAvailable: false,
      },
      {
        id: "cuentas_corrientes",
        title: "Cuentas corrientes",
        description: "Detalle de las cuentas corrientes de clientes y proveedores",
        isAvailable: true,
      },
      {
        id: "ramon",
        title: "Ramón",
        description: "Reporte de Ramón",
        isAvailable: true,
      },
    ],
  },
}

export default function ReportingHub() {
  const { loading, isRecepcion } = useAuth()
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Reportes</h1>

      {!loading && (!isRecepcion() ? Object.entries(reportCategories).map(([key, category]) => (
        <div key={key} className="mb-10">
          <h2 className="text-2xl font-medium mb-6">{category.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.items.map((report) => (
              <Card
                key={report.id}
                className="flex flex-col border-0 shadow-md hover:shadow-lg dark:shadow-slate-900 transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{report.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end pt-4">
                  {report.isAvailable ? (
                    report.component ? (
                      report.component
                    ) : (
                      <Link to={`/reportes/${report.id}`} className="w-full">
                        <Button className="w-full bg-[#1a2744] hover:bg-[#2a3754] text-white font-medium" size="lg">
                          Ver reporte
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Button className="w-full bg-gray-200 hover:bg-gray-200 text-gray-600" size="lg" disabled>
                      <Clock className="mr-2 h-4 w-4" />
                      En desarrollo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))
        : <div className="flex justify-center items-center py-32 h-full w-full">
          <h1 className="text-2xl font-bold mb-4">No tienes permisos para ver esta sección</h1>
        </div>
      )}
    </div>
  )
}