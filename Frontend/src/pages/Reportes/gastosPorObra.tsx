import { Suspense, useState } from 'react'
import { TablaGastosPorObra } from '@/components/reportes/tablaGastosxObra'
import { get_gastos_por_obra } from '@/endpoints/api'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ComboboxAPIFormless } from '@/components/comboboxes/ComboboxAPI'

export function CustomerDataPage() {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState<string|null>(null)

    return (
        <div className="mx-auto p-4 w-full">
            <div className="flex items-center mb-2">
            <Link to="/reportes" className="flex items-center mb-6">
                <ChevronLeft className="h-6 w-6 mr-2 mt-3" />
            </Link>
            <h1 className="text-2xl font-bold mb-4">Gastos por obra</h1>
            </div>
            <div className="flex items-center justify-between mb-4">
                <ComboboxAPIFormless
                    className='w-[300px]'
                    onValueChange={(value) => setEntidadSeleccionada(value.toString())}
                    model="clientes_proyectos"
                    fieldToSend={"id"}
                    fieldToShow={"cliente_proyecto"}
                />
                {entidadSeleccionada && <Button onClick={() => get_gastos_por_obra(entidadSeleccionada, true)}>Exportar a Excel</Button>}
            </div>
            <Suspense fallback={<div>Cargando...</div>}>
                {entidadSeleccionada !== null &&
                    <div>
                        <TablaGastosPorObra cliente_proyecto={entidadSeleccionada} />
                    </div>
                }
            </Suspense>
        </div>
    )
}
