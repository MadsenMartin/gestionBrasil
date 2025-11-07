import { Calculator, FileText, BarChart3, Package, CircleDollarSign, Receipt, CreditCard, Landmark, PiggyBank, Truck, Users, UserCircle, Briefcase } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { useEffect, useState } from 'react'
import { get_generico } from '@/endpoints/api'
import JTLogo from "../assets/JT.png"

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const isAuthenticated = async () => {
      try {
        const response = await get_generico('usuario');
        if (response.status === 401) {
          window.location.href = '/login'
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        window.location.href = '/login'
      }
    }
    isAuthenticated()
  }, [])

  return (
    <>
      {isAuthenticated ?
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto p-4">
            <header className="text-center py-6 mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gestión Quinto Diseño
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Seleccione un módulo para comenzar</p>
            </header>

            <div className="grid gap-6 max-w-[1400px] mx-auto">
              {/* Grid de módulos principales */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {modules.map((module, index) => (
                  <ModuleCard key={index} {...module} />
                ))}
              </div>

              {/* Accesos rápidos
              <div className="mt-6">
                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Accesos Rápidos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <QuickAccessCard icon={<Receipt className="h-4 w-4" />} title="Nuevo Pago" />
                  <QuickAccessCard icon={<CreditCard className="h-4 w-4" />} title="Nueva Cobranza" />
                  <QuickAccessCard icon={<BarChart3 className="h-4 w-4" />} title="Reportes del Día" />
                  <QuickAccessCard icon={<Package className="h-4 w-4" />} title="Stock Crítico" />
                  <QuickAccessCard icon={<Users className="h-4 w-4" />} title="Nuevo Cliente" />
                  <QuickAccessCard icon={<FileText className="h-4 w-4" />} title="Nuevo Presupuesto" />
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
        :
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="mb-4">
          <img src={JTLogo || "/placeholder.svg"} alt="Loading" className="w-48 h-48" />
        </div>
      </div>
      }
    </>
  )
}

const modules = [
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "IVA",
    description: "Gestión de documentos e impuestos",
    category: "Administración",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    url: "/iva"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Presupuestos",
    description: "Control presupuestario",
    category: "Administración",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    url: "/presupuestos"
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Reportes",
    description: "Informes y análisis",
    category: "Administración",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    url: "/reportes"
  },
  {
    icon: <Package className="h-5 w-5" />,
    title: "Inventario",
    description: "Gestión de stock",
    category: "Administración",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    url: "/inventario"
  },
  {
    icon: <CircleDollarSign className="h-5 w-5" />,
    title: "Cajas",
    description: "Gestión de movimientos de caja",
    category: "Tesorería",
    bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    url: "/tesoreria"
  },
  {
    icon: <Receipt className="h-5 w-5" />,
    title: "Pagos",
    description: "Gestión de pagos a proveedores",
    category: "Tesorería",
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    url: "/pagos"
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Cobranzas",
    description: "Gestión de certificados y cobros",
    category: "Tesorería",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    url: "/cobranzas"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Cuentas Corrientes",
    description: "Control de cuentas a cobrar y pagar",
    category: "Tesorería",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    url: "/reportes/cuentas_corrientes"
  },
  {
    icon: <Landmark className="h-5 w-5" />,
    title: "MEP",
    description: "Medios de pago",
    category: "Tesorería",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    url: "/mep"
  },
  {
    icon: <PiggyBank className="h-5 w-5" />,
    title: "Inversiones",
    description: "Gestión de inversiones",
    category: "Inversiones",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    url: "/inversiones"
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "Pedidos/Entregas",
    description: "Gestión de pedidos",
    category: "Obra",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    url: "/pedidos"
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Proveedores",
    description: "Gestión de proveedores",
    category: "General",
    bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    url: "/proveedores"
  },
  {
    icon: <UserCircle className="h-5 w-5" />,
    title: "Receptores",
    description: "Gestión de receptores",
    category: "General",
    bgColor: "bg-zinc-500/10 dark:bg-zinc-500/20",
    url: "/receptores"
  },
  {
    icon: <Briefcase className="h-5 w-5" />,
    title: "Clientes/Proyectos",
    description: "Gestión de clientes",
    category: "General",
    bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
    url: "/clientes_proyectos"
  }
]

function ModuleCard({ icon, title, description, category, bgColor, url }: {
  icon: React.ReactNode
  title: string
  description: string
  category: string
  bgColor: string
  url: string
}) {
  return (
    <Card className="relative group hover:shadow-lg transition-all duration-200 overflow-hidden">
      <a href={url}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-primary/10 transition-opacity duration-200" />
        <div className="p-4">
          <div className={`rounded-lg p-3 ${bgColor} mb-3`}>
            <div className="text-primary dark:text-primary-foreground">
              {icon}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{category}</span>
            </div>
          </div>
        </div>
      </a>
    </Card>
  )
}

/*function QuickAccessCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Card className="p-2 hover:bg-accent transition-colors duration-200 cursor-pointer">
      <div className="flex items-center gap-2">
        <div className="text-primary dark:text-primary-foreground">
          {icon}
        </div>
        <span className="text-xs font-medium">{title}</span>
      </div>
    </Card>
  )
}*/