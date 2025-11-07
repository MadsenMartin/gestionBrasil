import { get_presupuestos_por_cliente_proyecto, get_presupuestos_por_proveedor } from '@/endpoints/api'
import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { PivotTableGastosPorObra } from '@/components/reportes/PivotTableGastosPorObra'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'
import { PivotTablePresupuestosPorClienteProyecto } from './PivotTablePresupuestosPorClienteProyecto'

export function TablaPresupuestosPorEntidad({ 
    cliente_proyecto, 
    proveedor
}: { 
    cliente_proyecto?: string,
    proveedor?: string, 
}) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [tab, setTab] = useState<"pivot" | "pivot_old">("pivot")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                if (proveedor) {
                    const registros: Registro[] = await get_presupuestos_por_proveedor(proveedor, false)
                    setRegistros(registros)
                } else if (cliente_proyecto) {
                    const registros: Registro[] = await get_presupuestos_por_cliente_proyecto(cliente_proyecto, false)
                    setRegistros(registros)
                }
            } catch (error) {
                console.error("Error fetching gastos por unidad:", error)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [cliente_proyecto, proveedor])

    if (!cliente_proyecto && !proveedor) {
        return null
    }

    return (
        <Tabs
            defaultValue="pivot"
            className="w-full"
            onValueChange={(value) =>
                setTab(value as "pivot" | "pivot_old")
            }
        >
            <div className="flex justify-center">
                <TabsList className="grid w-full max-w-lg grid-cols-2">
                    <TabsTrigger value="pivot">Tabla dinámica avanzada</TabsTrigger>
                    <TabsTrigger value="pivot_old">Tabla dinámica</TabsTrigger>
                </TabsList>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot'} value="pivot" className="mt-4">
                        {cliente_proyecto && <PivotTablePresupuestosPorClienteProyecto data={registros} rows={['proveedor','nombre']} />}
                        {proveedor && <PivotTablePresupuestosPorClienteProyecto data={registros} rows={['cliente_proyecto','nombre']} />}
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot_old'} value="pivot_old" className="mt-4">
                        {cliente_proyecto && <PivotTableGastosPorObra data={registros} vals={['monto','saldo']} rows={['proveedor']} cols={[]} />}
                        {proveedor && <PivotTableGastosPorObra data={registros} vals={['monto','saldo']} rows={['cliente_proyecto']} cols={[]}/>}
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}