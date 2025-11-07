'use client'

import { useEffect } from 'react'
import 'react-pivottable/pivottable.css'
import { Registro } from '@/types/genericos'
import { useRef } from 'react'
import WebDataRocks, { Measure } from '@webdatarocks/webdatarocks'
import '@webdatarocks/webdatarocks/webdatarocks.min.css'

interface PivotTableV2GenericaProps {
    data: Registro[]
    rows?: string[]
    cols?: string[]
    measures: Measure[]
}

export function PivotTableV2Generica({ data, rows, cols, measures }: PivotTableV2GenericaProps) {
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
                        rows: rows?.map((row) => ({ uniqueName: row })),
                        columns: cols?.map((col) => ({ uniqueName: col })),
                        measures: measures

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