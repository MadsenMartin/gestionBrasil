import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { get_gastos_por_unidad } from '@/endpoints/api'
import { TablaGastosPorUnidad } from '@/components/reportes/tablaGastosxUnidad'
import { ComboboxAPIFormless } from '@/components/comboboxes/ComboboxAPI'
export function GastosPorUnidad() {
    const [entidadSeleccionada, setEntidadSeleccionada] = useState<string | null>(null)
    const [anomesMin, setAnomesMin] = useState<string | null>(null)
    const [anomesMax, setAnomesMax] = useState<string | null>(null)
    const [anomesList, setAnomesList] = useState<string[]>([])

    useEffect(() => {
        // Generar lista de añomes hasta el mes actual
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1
        const anomes = []
        for (let year = currentYear; year >= currentYear - 5; year--) {
            for (let month = 12; month >= 1; month--) {
                if (year === currentYear && month > currentMonth) continue
                anomes.push(`${year}${month.toString().padStart(2, '0')}`)
            }
        }
        setAnomesList(anomes)
    }, [])

    const handleEntidadChange = (value: string) => {
        setEntidadSeleccionada(value)
    }

    const handleAnomesMinChange = (value: string) => {
        setAnomesMin(value)
    }

    const handleAnomesMaxChange = (value: string) => {
        setAnomesMax(value)
    }

    return (
        <div className="mx-auto p-4 w-full">
            <div className="flex items-center mb-2">
                <Link to="/reportes" className="flex items-center mb-6">
                    <ChevronLeft className="h-6 w-6 mr-2 mt-3" />
                </Link>
                <h1 className="text-2xl font-bold mb-4">Gastos por unidad</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <ComboboxAPIFormless
                    className='w-[300px]'
                    onValueChange={handleEntidadChange}
                    model="unidades_de_negocio"
                    fieldToSend={"id"}
                    fieldToShow={"unidad_de_negocio"}
                />
                <Select
                    onValueChange={handleAnomesMinChange}
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Añomes hasta" />
                    </SelectTrigger>
                    <SelectContent>
                        {anomesList.map((anomes) => (
                            <SelectItem key={anomes} value={anomes}>
                                {anomes}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={handleAnomesMaxChange}
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Añomes desde" />
                    </SelectTrigger>
                    <SelectContent>
                        {anomesList.map((anomes) => (
                            <SelectItem key={anomes} value={anomes}>
                                {anomes}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={() => get_gastos_por_unidad(entidadSeleccionada, true, anomesMin, anomesMax)}
                    disabled={!entidadSeleccionada || !anomesMin || !anomesMax}
                    className='justify-end'
                >
                    Exportar a Excel
                </Button>
            </div>
            {entidadSeleccionada !== null && anomesMin !== null && anomesMax !== null && (
                <div>
                    <TablaGastosPorUnidad
                        unidad_de_negocio={entidadSeleccionada}
                        anomes_min={anomesMin}
                        anomes_max={anomesMax}
                    />
                </div>
            )
            }
        </div>
    )
}