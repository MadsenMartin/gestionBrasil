import { get_mdo_vs_ppto_por_obra, get_mdo_vs_ppto_por_proveedor } from '@/endpoints/api'
import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { PivotTableGastosPorObra } from '@/components/reportes/PivotTableGastosPorObra'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'
import { PivotTableV2Generica } from './pivotTableV2Generica'

export function TablaMDOVSPPTO({
    proveedor,
    cliente_proyecto,
}: {
    proveedor?: string,
    cliente_proyecto?: string,
}) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [tab, setTab] = useState<"pivot" | "pivot_old">("pivot")
    const [loading, setLoading] = useState(true)

    const measures =
        [
            { uniqueName: "Monto", aggregation: "sum", format: "formato" },
            { uniqueName: "Saldo (Monto OP/REC)", aggregation: "sum", format: "formato" }
        ]


    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                if (proveedor) {
                    const registros: Registro[] = await get_mdo_vs_ppto_por_proveedor(proveedor, false)
                    setRegistros(registros)
                } else if (cliente_proyecto) {
                    const registros: Registro[] = await get_mdo_vs_ppto_por_obra(cliente_proyecto, false)
                    setRegistros(registros)
                }
            } catch (error) {
                console.error("Error fetching gastos por unidad:", error)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [proveedor, cliente_proyecto])

    if (!proveedor && !cliente_proyecto) {
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
                        {proveedor
                            ? <PivotTableV2Generica data={registros} rows={["Cliente/Proyecto", "Presupuesto"]} measures={measures} />
                            : <PivotTableV2Generica data={registros} rows={["Proveedor", "Presupuesto"]} measures={measures} />
                        }
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot_old'} value="pivot_old" className="mt-4">
                        <PivotTableGastosPorObra data={registros} vals={['Monto', 'Saldo (Monto OP/REC)']} rows={['presupuesto']} cols={[]} />
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}