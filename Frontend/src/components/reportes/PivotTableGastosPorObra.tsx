'use client'

import { useEffect, useState } from 'react'
import PivotTableUI from 'react-pivottable/PivotTableUI'
import 'react-pivottable/pivottable.css'
import TableRenderers from 'react-pivottable/TableRenderers'
import createPlotlyRenderer from 'react-pivottable/PlotlyRenderers'
import dynamic from 'next/dynamic'
import { Registro } from '@/types/genericos'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

// Create Plotly renderer
const PlotlyRenderer = createPlotlyRenderer(Plot)

interface PivotTableGastosPorObraProps {
    data: Registro[]
    vals?: string[]
    cols?: string[]
    rows?: string[]
}

export function PivotTableGastosPorObra({ data, vals, cols, rows }: PivotTableGastosPorObraProps) {
    const [state, setState] = useState({})
    const [formattedData, setFormattedData] = useState([])

    useEffect(() => {
        const fill_table = () => {
            const headers = data.length !== 0 ? Object.keys(data[0]) : []
    
            setFormattedData([
                headers,
                ...data.map(g => headers.map(header => g[header]))
            ]);
        }
        fill_table()
    },[data])

        return (
        <PivotTableUI
            data={formattedData}
            onChange={s => setState(s)}
            aggregatorName={vals && 'Sum'}
            vals={vals}
            cols={cols}
            rows={rows}
            {...state}
            renderers={Object.assign({}, TableRenderers, PlotlyRenderer)}
        />
    )
}

import { useRef } from 'react'
import WebDataRocks from '@webdatarocks/webdatarocks'
import '@webdatarocks/webdatarocks/webdatarocks.min.css'

interface PivotTableGastosPorObraProps {
    data: Registro[]
}

export function PivotTableGastosPorObraV2({ data }: PivotTableGastosPorObraProps) {
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
                        rows: [
                            { uniqueName: "imputacion" },
                            { uniqueName: "proveedor" }
                        ],
                        measures: [
                             // total_gasto_ingreso como medida inicial con el formato que defino debajo
                            { uniqueName: "total_gasto_ingreso", aggregation: "sum", format: "formato" },
                            { uniqueName: "monto_gasto_ingreso_usd", aggregation: "sum", format: "formato" },
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