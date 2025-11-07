import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  get_nueva_cuenta_corriente,
} from "@/endpoints/api";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import {
  NuevaCuentaCorriente,
} from "@/components/cuentas_corrientes/types";
import { TablaProveedor } from "@/components/cuentas_corrientes/tablaProveedor";
import { CuentaCorriente, TablaCliente } from "@/components/cuentas_corrientes/tablaCliente";
import { ComboboxAPIFormless } from "@/components/comboboxes/ComboboxAPI";

/**
 * El componente `ConsultaCuentasCorrientes` es responsable de mostrar y gestionar el estado de las cuentas corrientes
 * tanto para proveedores como para clientes. Permite a los usuarios alternar entre la visualización de proveedores y clientes,
 * seleccionar una entidad y obtener los detalles de la cuenta corriente correspondiente.
 *
 * @component
 * @example
 * ```tsx
 * <ConsultaCuentasCorrientes />
 * ```
 *
 * @returns {JSX.Element} El componente renderizado.
 *
 * @remarks
 * Este componente utiliza varias variables de estado para gestionar los datos y los estados de carga:
 * - `proveedores`: Un array de entidades proveedoras.
 * - `clientes`: Un array de entidades clientes.
 * - `entidadSeleccionada`: El ID de la entidad seleccionada.
 * - `cuentaCorriente`: Los detalles de la cuenta corriente para el proveedor seleccionado.
 * - `cuentaCorrienteCliente`: Los detalles de la cuenta corriente para el cliente seleccionado.
 * - `cargando`: Un booleano que indica si los datos se están cargando.
 * - `tipoEntidad`: Un string que indica si la vista actual es para proveedores o clientes.
 * - `facturaSeleccionada`: La factura seleccionada (no utilizada en la implementación actual).
 * - `dialogoFacturaAbierto`: Un booleano que indica si el diálogo de la factura está abierto (no utilizado en la implementación actual).
 *
 * El componente obtiene datos en función del tipo de entidad seleccionada (`proveedores` o `clientes`) y actualiza el estado en consecuencia.
 * También proporciona una interfaz de usuario para seleccionar una entidad y ver los detalles de la cuenta corriente correspondiente.
 *
 * @dependencies
 * - `useState`: Hook de React para gestionar el estado.
 * - `useEffect`: Hook de React para realizar efectos secundarios.
 * - `ThemeProvider`: Un proveedor de contexto para el tema.
 * - `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`: Componentes para renderizar navegación con pestañas.
 * - `Card`, `CardContent`: Componentes para renderizar diseños de tarjetas.
 * - `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`: Componentes para renderizar menús desplegables.
 * - `Button`: Componente para renderizar botones.
 * - `Loader2`: Componente para renderizar un spinner de carga.
 * - `TablaProveedor`, `TablaCliente`: Componentes para renderizar tablas de detalles de cuentas corrientes.
 *
 * @functions
 * - `fetchData`: Obtiene datos para proveedores o clientes en función del tipo de entidad seleccionada.
 * - `handleEntidadChange`: Actualiza el ID de la entidad seleccionada.
 * - `handleConsultar`: Obtiene los detalles de la cuenta corriente para la entidad seleccionada.
 *
 * @state
 * - `proveedores`: Un array de entidades proveedoras.
 * - `clientes`: Un array de entidades clientes.
 * - `entidadSeleccionada`: El ID de la entidad seleccionada.
 * - `cuentaCorriente`: Los detalles de la cuenta corriente para el proveedor seleccionado.
 * - `cuentaCorrienteCliente`: Los detalles de la cuenta corriente para el cliente seleccionado.
 * - `cargando`: Un booleano que indica si los datos se están cargando.
 * - `tipoEntidad`: Un string que indica si la vista actual es para proveedores o clientes.
 * - `facturaSeleccionada`: La factura seleccionada (no utilizada en la implementación actual).
 * - `dialogoFacturaAbierto`: Un booleano que indica si el diálogo de la factura está abierto (no utilizado en la implementación actual).
 */
export function ConsultaCuentasCorrientes() {
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<number | null>(null);
  const [cuentaCorriente, setCuentaCorriente] = useState<NuevaCuentaCorriente | null>(null);
  const [cuentaCorrienteCliente, setCuentaCorrienteCliente] = useState<CuentaCorriente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [tipoEntidad, setTipoEntidad] = useState<"proveedores" | "clientes">("proveedores");

  const handleConsultar = async () => {
    if (entidadSeleccionada) {
      setCargando(true);
      try {
        const response =
          tipoEntidad === "proveedores"
            ? await get_nueva_cuenta_corriente(entidadSeleccionada, "proveedores")
            : await get_nueva_cuenta_corriente(entidadSeleccionada, "clientes");
        if (tipoEntidad === "proveedores") {
          setCuentaCorriente(response[0]);
        }
        if (tipoEntidad === "clientes") {
          setCuentaCorrienteCliente(response[0]);
        }
      } catch (error) {
        console.error("Error al obtener la cuenta corriente:", error);
      } finally {
        setCargando(false);
      }
    }
  };

  return (
    <ThemeProvider>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>
        </div>

        <Tabs
          defaultValue="proveedores"
          className="w-full"
          onValueChange={(value) =>
            setTipoEntidad(value as "proveedores" | "clientes")
          }
        >
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="proveedores" className="mt-4">
            <div className="flex justify-center gap-4">
              <Card className="max-w-sm">
                <CardContent className="pt-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <ComboboxAPIFormless
                        model="proveedores"
                        fieldToSend="id"
                        fieldToShow="razon_social"
                        onValueChange={(value) => setEntidadSeleccionada(Number(value))}
                      />
                    </div>
                    <Button
                      onClick={handleConsultar}
                      disabled={!entidadSeleccionada || cargando}
                      className="min-w-[100px]"
                    >
                      {cargando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando
                        </>
                      ) : (
                        "Consultar"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            {cuentaCorriente && (
                    <TablaProveedor
                      cuentaCorriente={cuentaCorriente}
                    />
                  )}
          </TabsContent>

          <TabsContent value="clientes" className="mt-4">
            <div className="flex justify-center gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-sm">
                      <ComboboxAPIFormless
                        model="clientes_proyectos"
                        fieldToSend="id"
                        fieldToShow="cliente_proyecto"
                        onValueChange={(value) => setEntidadSeleccionada(Number(value))}
                      />
                    </div>
                    <Button
                      onClick={handleConsultar}
                      disabled={!entidadSeleccionada || cargando}
                      className="min-w-[100px]"
                    >
                      {cargando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cargando
                        </>
                      ) : (
                        "Consultar"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            {cuentaCorrienteCliente && (
                    <TablaCliente data={cuentaCorrienteCliente} />
                  )}
          </TabsContent>

        </Tabs>
      </div>
    </ThemeProvider>
  );
}
