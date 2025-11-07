import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'
import { get_gastos_por_casa } from '@/endpoints/api'
import { PivotTableV2Generica } from './pivotTableV2Generica'
import { PivotTableGastosPorObra } from './PivotTableGastosPorObra'

export function TablaGastosPorCasa({ cliente_proyecto }: { cliente_proyecto: string }) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [tab, setTab] = useState<"pivot" | "pivot_old">("pivot")
    const [loading, setLoading] = useState(true)

    if (!cliente_proyecto) {
        return null
    }

    useEffect(() => {
        const fetch = async (cliente_proyecto) => {
            const customerData: Registro[] = await get_gastos_por_casa(cliente_proyecto)
            setRegistros(customerData)
            setLoading(false)
        }
        fetch(cliente_proyecto)
    }, [cliente_proyecto])

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
                        <PivotTableV2Generica
                            data={registros}
                            measures={[{ uniqueName: "Total Gasto/Ingreso", aggregation: "sum", format: "formato" }, { uniqueName: "Total Gasto/Ingreso USD", aggregation: "sum", format: "formato" }]}
                            rows={['Fecha Reg',"Tipo Doc","Proveedor","Imputación","Observaciones","ID_Presupuesto"]}
                        />
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot_old'} value="pivot_old" className="mt-4">
                        <PivotTableGastosPorObra data={registros} vals={['Total Gasto/Ingreso',"Total Gasto/Ingreso USD"]} rows={['Fecha Reg',"Tipo Doc","Proveedor","Imputación","Observaciones","ID_Presupuesto"]} />
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}