import { get_gastos_por_unidad } from '@/endpoints/api'
import { Registro } from '@/types/genericos'
import { useEffect, useState } from 'react'
import { PivotTableGastosPorObra, PivotTableGastosPorObraV2 } from '@/components/reportes/PivotTableGastosPorObra'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Loader2 } from 'lucide-react'

export function TablaGastosPorUnidad({ 
    unidad_de_negocio, 
    anomes_min, 
    anomes_max 
}: { 
    unidad_de_negocio: string, 
    anomes_min: string, 
    anomes_max: string 
}) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [tab, setTab] = useState<"pivot" | "pivot_old">("pivot_old")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const registros: Registro[] = await get_gastos_por_unidad(unidad_de_negocio, false, anomes_min, anomes_max)
                setRegistros(registros)
            } catch (error) {
                console.error("Error fetching gastos por unidad:", error)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [unidad_de_negocio, anomes_min, anomes_max])

    if (!unidad_de_negocio || !anomes_min || !anomes_max) {
        return null
    }

    return (
    //const allColumns = registros.length > 0 ? Object.keys(registros[0]) : []
    //const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(allColumns))


    /*useEffect(() => {
        const allColumns = registros.length > 0 ? Object.keys(registros[0]) : []
        setVisibleColumns(new Set(allColumns))
    }, [registros])
  
    const toggleColumn = (column: string) => {
      const newVisibleColumns = new Set(visibleColumns)
      if (newVisibleColumns.has(column)) {
        newVisibleColumns.delete(column)
      } else {
        newVisibleColumns.add(column)
      }
      setVisibleColumns(newVisibleColumns)
    }*/

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
                        <PivotTableGastosPorObraV2 data={registros} />
                    </TabsContent>
                    <TabsContent forceMount={true} hidden={tab !== 'pivot_old'} value="pivot_old" className="mt-4">
                        <PivotTableGastosPorObra data={registros} vals={['total_gasto_ingreso']} rows={['imputacion', 'proveedor']} cols={['añomes_imputacion']}/>
                    </TabsContent>
                </>
            )}
        </Tabs>
    )
}

{/*<TabsContent forceMount={true} hidden={tab !== 'lista'} value="lista" className="mt-4">
                    <Card className="mb-8">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Registros</CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="ml-auto">
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Columnas
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    {allColumns.map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column}
                                            checked={visibleColumns.has(column)}
                                            onCheckedChange={() => toggleColumn(column)}
                                        >
                                            {column}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] rounded-md border">
                                <div className="relative w-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {allColumns.map((column) =>
                                                    visibleColumns.has(column) && (
                                                        <TableHead key={column} className="sticky top-0 bg-background">
                                                            {column}
                                                        </TableHead>
                                                    )
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {registros.map((record, index) => (
                                                <TableRow key={index}>
                                                    {allColumns.map((column) =>
                                                        visibleColumns.has(column) && (
                                                            <TableCell key={column}>
                                                                {record[column] !== null ? record[column].toString() : 'N/A'}
                                                            </TableCell>
                                                        )
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>*/}
