import { Suspense, useEffect, useState } from 'react'
import { get_gastos_por_proveedor, get_generico_params } from '@/endpoints/api'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, Loader2 } from 'lucide-react'
import { TablaRamon } from '@/components/reportes/tablaRamon'

export function Ramon() {
    const [id, setId] = useState<string | null>(null)
    const [exportando, setExportando] = useState(false)
    const [success, setSuccess] = useState(false)

    const exportar_a_excel = async () => {
        setExportando(true)
        const status = await get_gastos_por_proveedor(id, true)
        if (status === 200) {
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
            }, 3000)
            setExportando(false)
        } else {
            setExportando(false)
        }
    }

    useEffect(() => {
        try {
            const fetch = async () => {
                const response = await get_generico_params({ model: 'proveedores', params: `nombre_fantasia_pila__icontains=Ramón+Benitez+Enciso` })
                if (response.status === 200) {
                    setId(response.data.results[0].id)
                } else {
                    console.log(response)
                }
            }
            fetch()
        } catch (error) {
            console.log(error)
        }
    }, [])


    return (
        <div className="mx-auto p-4 w-full">
            <div className="flex items-center mb-2">
                <Link to="/reportes" className="flex items-center mb-6">
                    <ChevronLeft className="h-6 w-6 mr-2 mt-3" />
                </Link>
                <h1 className="text-2xl font-bold mb-4">Reporte Ramón</h1>
            </div>
            <div className="flex items-center justify-between mb-4">
                {<Button
                    onClick={exportar_a_excel}
                >
                    Exportar a Excel
                    {exportando && (
                        <div className="ml-2">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>)}
                    {success && (
                        <div className="ml-2">
                            <Check className="h-6 w-6 text-green-500" />
                        </div>
                    )}
                </Button>}
            </div>
            <Suspense fallback={<div>Cargando...</div>}>
                <div>
                    <TablaRamon id={id} />
                </div>
            </Suspense>
        </div>
    )
}
