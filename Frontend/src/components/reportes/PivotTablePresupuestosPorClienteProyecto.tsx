'use client'

import { useEffect } from 'react'
import 'react-pivottable/pivottable.css'
import { Registro } from '@/types/genericos'
import { useRef } from 'react'
import WebDataRocks from '@webdatarocks/webdatarocks'
import '@webdatarocks/webdatarocks/webdatarocks.min.css'

interface PivotTableGastosPorObraProps {
    data: Registro[]
    rows: string[]
}

export function PivotTablePresupuestosPorClienteProyecto({ data, rows }: PivotTableGastosPorObraProps) {
    const pivotRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (pivotRef.current && data.length > 0) {
            new WebDataRocks({
                container: pivotRef.current,
                toolbar: true,
                report: {
                    dataSource: {
                        data: data
                    },
                    slice: {
                        rows: rows.map(row => ({ uniqueName: row })),
                        measures: [
                            { uniqueName: "monto", aggregation: "sum", format: "formato" }, // monto como medida inicial con el formato que defino debajo
                            { uniqueName: "saldo", aggregation: "sum", format: "formato" } // saldo como medida inicial con el formato que defino debajo
                        ]

                    },
                    localization: "https://raw.githubusercontent.com/WebDataRocks/pivot-localizations/refs/heads/master/es.json", // Traducción al español
                    
                    formats: [ // Defino el formato de los valores
                        {
                            name: "formato",
                            thousandsSeparator: ".",
                            decimalSeparator: ",",
                            currencySymbol: "$",
                            decimalPlaces: 2
                        }
                    ]
                    

                }
            })
        }
    }, [data])

    return <div ref={pivotRef} style={{ width: '100%', height: '1080px' }} />
}