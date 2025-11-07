import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { get_gastos_por_obra } from '@/endpoints/api'
import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { PivotTableGastosPorObraV2 } from '@/components/reportes/PivotTableGastosPorObra'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'

export function TablaGastosPorObra({ cliente_proyecto }: { cliente_proyecto: string }) {
    const [customerData, setCustomerData] = useState<Registro[]>([])
    const [tab, setTab] = useState<"lista" | "pivot">("pivot")
    const [loading, setLoading] = useState(true)

    if (!cliente_proyecto) {
        return null
    }
    useEffect(() => {
        const fetch = async (cliente_proyecto) => {
            const customerData: Registro[] = await get_gastos_por_obra(cliente_proyecto)
            setCustomerData(customerData)
            setLoading(false)
        }
        fetch(cliente_proyecto)
    }, [cliente_proyecto])

    return (
        <>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>) : (
                <Tabs
                    defaultValue="pivot"
                    className="w-full"
                    onValueChange={(value) =>
                        setTab(value as "lista" | "pivot")
                    }
                >
                    <div className="flex justify-center">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="lista">Registros</TabsTrigger>
                            <TabsTrigger value="pivot">Tabla dinámica</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent forceMount={true} hidden={tab !== 'lista'} value="lista" className="mt-4">
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle>Registros</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {customerData.length !== 0 && Object.keys(customerData[0]).map((key) => (
                                                <TableHead key={key}>{key}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customerData.length !== 0 && customerData.map((customer, index) => (
                                            <TableRow key={index}>
                                                {Object.entries(customer).map(([key, value]) => (
                                                    <TableCell key={key}>{value !== null ? value.toString() : 'N/A'}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot'} value="pivot" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tabla dinámica de gastos x obra</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PivotTableGastosPorObraV2 data={customerData} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </>
    )
}
