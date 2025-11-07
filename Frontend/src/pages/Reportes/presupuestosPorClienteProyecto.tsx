import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { get_presupuestos_por_cliente_proyecto } from '@/endpoints/api'
import { TablaPresupuestosPorEntidad } from '@/components/reportes/tablaPresupuestosxClienteProyecto'
import { ComboboxAPIFormless } from '@/components/comboboxes/ComboboxAPI'
export function PresupuestosPorClienteProyecto() {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState<string|null>(null)

    return (
        <div className="mx-auto p-4 w-full">
            <div className="flex items-center mb-2">
                <Link to="/reportes" className="flex items-center mb-6">
                    <ChevronLeft className="h-6 w-6 mr-2 mt-3" />
                </Link>
                <h1 className="text-2xl font-bold mb-4">Presupuestos por Cliente/Proyecto</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <ComboboxAPIFormless
                    className='w-[300px]'
                    onValueChange={(value) => setEntidadSeleccionada(value.toString())}
                    model="clientes_proyectos"
                    fieldToSend={"id"}
                    fieldToShow={"nombre"}
                />

                <Button     
                    onClick={() => get_presupuestos_por_cliente_proyecto(entidadSeleccionada, true)}
                    disabled={!entidadSeleccionada}
                    className='justify-end'
                >
                    Exportar a Excel
                </Button>
            </div>
            {
                entidadSeleccionada !== null && (
                    <div>
                        <TablaPresupuestosPorEntidad 
                            cliente_proyecto={entidadSeleccionada} 
                        />
                    </div>
                )
            }
        </div>
    )
}