import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DialogMovEntreCuentas } from "./dialogMovEntreCuentas"
import { ConciliacionBanco } from "./Banco/ConciliacionBanco"
import { DialogPagoMDO } from "../pagos/mdo/dialogNuevoPagoMDO"
import { Link } from "react-router-dom"
import { CajaDiaria } from "./cajaDiaria"
import { DialogoFCI } from "./Banco/FCI"
import { CajaAGestion } from "./carga_rapida/cajaAGestion"
import { CajaAGestionMapper } from "./carga_rapida/cajaAGestionMapper"

export function DropdownRegistros({ toast, setSelectMode, addItem }) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Acciones</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DialogMovEntreCuentas
          toast={toast}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Mov. entre cuentas
            </DropdownMenuItem>
          }
        />
        <DialogoFCI
          toast={toast}
          addItem={addItem}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              FCI
            </DropdownMenuItem>
          }
        />
        <ConciliacionBanco
          toast={toast}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Conciliación Banco
            </DropdownMenuItem>
          }
        />
        <DialogPagoMDO
          toast={toast}
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Nuevo pago MDO
            </DropdownMenuItem>
          } />
        <DropdownMenuItem onSelect={() => setSelectMode((prev: any) => !prev)}>
          Generar transferencias
        </DropdownMenuItem>
                <Link to="/tesoreria/gastos-a-recuperar">
          <DropdownMenuItem>
            Gastos a recuperar
          </DropdownMenuItem>
        </Link>
        <DropdownMenuGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link to="/tesoreria/plantillas">
          <DropdownMenuItem>
            Plantillas
          </DropdownMenuItem>
        </Link>
        <CajaDiaria
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Caja Diaria
            </DropdownMenuItem>
          }
        />
        <CajaAGestion
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Importar caja
            </DropdownMenuItem>
          }
          addItem={addItem}
        />
        <CajaAGestionMapper
          trigger={
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              Importar caja mapper
            </DropdownMenuItem>
          }
          addItem={addItem}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}