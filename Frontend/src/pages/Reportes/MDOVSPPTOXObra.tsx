import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { get_mdo_vs_ppto_por_obra } from '@/endpoints/api'
import { TablaMDOVSPPTO } from '@/components/reportes/tablaMDOVSPPTO'
import { ComboboxAPIFormless } from '@/components/comboboxes/ComboboxAPI'

export function MDOVSPPTOXObra() {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState<string | null>(null)
    const [exportando, setExportando] = useState(false)
    const [success, setSuccess] = useState(false)

    const exportar_a_excel = async () => {
        setExportando(true)
        const status = await get_mdo_vs_ppto_por_obra(entidadSeleccionada, true)
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

    return (
        <div className="mx-auto p-4 w-full">
            <div className="flex items-center mb-2">
                <Link to="/reportes" className="flex items-center mb-6">
                    <ChevronLeft className="h-6 w-6 mr-2 mt-3" />
                </Link>
                <h1 className="text-2xl font-bold mb-4">MDO VS PPTO por obra</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <ComboboxAPIFormless
                    className='w-[300px]'
                    onValueChange={(value) => setEntidadSeleccionada(value.toString())}
                    model="clientes_proyectos"
                    fieldToSend={"id"}
                    fieldToShow={"cliente_proyecto"}
                />
                <Button
                    onClick={exportar_a_excel}
                    disabled={!entidadSeleccionada}
                    className='justify-end'
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
                </Button>
            </div>
            {entidadSeleccionada !== null && (
                <div>
                    <TablaMDOVSPPTO
                        cliente_proyecto={entidadSeleccionada}
                    />
                </div>
            )}
        </div>
    )
}