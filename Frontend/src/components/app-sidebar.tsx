import { User, Files, Truck, House, Coins, Landmark, Warehouse, HandCoins, ChartLine, Receipt, HousePlus, Banknote, PiggyBank, ListTodo, ScrollText } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import { ScrollArea } from "./ui/scroll-area"
import { useAuth } from "@/auth/authContext"

// Menu items.
const itemsRecepcion = [
  {
    title: "IVA",
    url: "/iva",
    icon: Files,
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: Warehouse,
  },
]

const itemsAdministracion = [
  {
    title: "Presupuestos",
    url: "/presupuestos",
    icon: Receipt,
  },
  {
    title: "Reportes",
    url: "/reportes",
    icon: ChartLine,
  },
]

const itemsTesoreria = [
  {
    title: "Cajas",
    url: "/tesoreria",
    icon: PiggyBank,
  },
  {
    title: "Pagos",
    url: "/pagos",
    icon: Coins,
  },
  {
    title: "Cobranzas",
    url: "/cobranzas",
    icon: Banknote,
  },
  {
    title: "Cuentas Corrientes",
    url: "/reportes/cuentas_corrientes",
    icon: HandCoins,
  },
  {
    title: "MEP",
    url: "/mep",
    icon: Landmark,
  }
]

const itemsAcopios = [
  {
    title: "Acopios",
    url: "/acopios",
    icon: ScrollText,
    disabled: false,
  },
  {
    title: "Desacopios",
    url: "/desacopios",
    icon: ScrollText,
    disabled: false,
  }

]

/*const itemsObra = [
  {
    title: "Pedidos/Entregas",
    url: "/pedidos",
    icon: Store,
    disabled: true,
  },
]*/

const itemsInversiones = [
  {
    title: "Inversiones",
    url: "/inversiones",
    icon: HousePlus,
    disabled: true,
  },
]

const itemsGeneral = [
  {
    title: "Proveedores",
    url: "/proveedores",
    icon: Truck,
  },
  {
    title: "Receptores",
    url: "/receptores",
    icon: User,
  },
  {
    title: "Clientes/Proyectos",
    url: "/clientes_proyectos",
    icon: House,
  },
]

const itemsUsuario = [
  {
    title: "Tareas",
    url: "/tareas",
    icon: ListTodo,
  },
]

function itemsMap(items: any[]) {
  return (
    items.map((item) => (
      <SidebarMenuItem className="font-bold" key={item.title}>
        <SidebarMenuButton asChild>
          <a href={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))
  )
}

export function AppSidebar() {
  const { loading, isRecepcion } = useAuth();
  return (
    <ThemeProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <ScrollArea>
            <SidebarGroup>
              <SidebarGroupLabel className="font-bold">Administración</SidebarGroupLabel>
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsMap(itemsRecepcion)}
                  {!loading && !isRecepcion() && itemsMap(itemsAdministracion)}

                  {!loading && !isRecepcion() && (
                    <Collapsible defaultOpen className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="font-bold">
                            <Landmark />
                            <span>Tesorería</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {itemsMap(itemsTesoreria)}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {!loading && !isRecepcion() && (
              <SidebarGroup>
                <SidebarGroupLabel className="font-bold">Inversiones</SidebarGroupLabel>
                <SidebarSeparator />
                <SidebarGroupContent>
                  <SidebarMenu>
                    {itemsMap(itemsInversiones)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel className="font-bold">Acopios</SidebarGroupLabel>
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsMap(itemsAcopios)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="font-bold">General</SidebarGroupLabel>
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsMap(itemsGeneral)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="font-bold">Usuario</SidebarGroupLabel>
              <SidebarSeparator />
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsUsuario.map((item) => (
                    <SidebarMenuItem className="font-bold" key={item.title}>
                      <SidebarMenuButton asChild>


                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <ModeToggle />
        </SidebarFooter>
      </Sidebar>
    </ThemeProvider>
  )
}