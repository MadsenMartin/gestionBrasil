import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'
import { get_gastos_por_proveedor } from '@/endpoints/api'
import { PivotTableV2Generica } from './pivotTableV2Generica'
import { PivotTableGastosPorObra } from './PivotTableGastosPorObra'

export function TablaRamon({ id }) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [tab, setTab] = useState<"pivot" | "pivot_old">("pivot_old")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            if (!id) return
            setLoading(true)
            try {
                const registros: Registro[] = await get_gastos_por_proveedor(id)
                setRegistros(registros)
            } catch (error) {
                console.error("Error fetching gastos por proveedor:", error)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [id])

    if (!id) {
        return null
    }

    return (

        <Tabs
            defaultValue="pivot_old"
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
                        <PivotTableV2Generica
                            data={registros}
                            measures={[{ uniqueName: "total_gasto_ingreso", aggregation: "sum", format: "formato" },]}
                            rows={['cliente_proyecto']}
                            cols={['imputacion']}
                        />
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot_old'} value="pivot_old" className="mt-4">
                        <PivotTableGastosPorObra data={registros} vals={['total_gasto_ingreso']} rows={['cliente_proyecto']} cols={['imputacion']} />
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}