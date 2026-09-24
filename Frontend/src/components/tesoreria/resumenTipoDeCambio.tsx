import { useEffect, useState } from "react"
import { get_generico_params } from "@/endpoints/api"
import { Info } from "lucide-react"

type ResumenTipoDeCambioProps = {
    moneda: number
    fecha: string
    tipoDeCambio: number | string
    neto?: number | string
    iva?: number | string
    opRec?: number | string
    modo: 'alta' | 'edicion'
}

const formatUSD = (monto: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(monto)
const formatBRL = (monto: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'BRL' }).format(monto)
const formatFecha = (fecha: string) => fecha.split('-').reverse().join('/')

/**
 * Explica qué va a pasar con los montos de un registro de una caja en moneda extranjera al guardarlo,
 * mostrando cada monto en USD y en R$. Replica la lógica del backend (aplicar_logica_tipo_cambio / recalcular_montos_update).
 */
export function ResumenTipoDeCambio({ moneda, fecha, tipoDeCambio, neto, iva, opRec, modo }: ResumenTipoDeCambioProps) {
    const [mep, setMep] = useState<number | null>(null)

    useEffect(() => {
        if (!moneda || moneda === 1 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
            setMep(null)
            return
        }
        let vigente = true
        get_generico_params({ model: 'dolar_mep', params: { fecha } })
            .then(response => {
                const cotizacion = response.data.results?.[0] ?? response.data[0]
                if (vigente) setMep(cotizacion ? Number(cotizacion.compra) : null)
            })
            .catch(() => vigente && setMep(null))
        return () => { vigente = false }
    }, [moneda, fecha])

    if (!moneda || moneda === 1) return null

    const tc = Number(tipoDeCambio) || 1
    const factor = tc !== 1 ? tc : mep
    const montos = [
        { label: 'Neto', valor: neto },
        { label: 'IVA', valor: iva },
        { label: 'OP/REC', valor: opRec },
    ].filter(m => m.valor !== undefined && m.valor !== null && Number(m.valor) !== 0)

    let mensaje: string
    if (tc !== 1) {
        mensaje = `Se guarda en R$ multiplicando por el TC informado (${tc}).`
        if (modo === 'alta' && mep && mep !== tc && tc > 1 && opRec) {
            mensaje += ` Como el MEP del ${formatFecha(fecha)} es ${mep}, además se genera un registro de diferencia de cambio por ${formatBRL((mep - tc) * Number(opRec))}.`
        } else if (modo === 'alta' && !mep) {
            mensaje += ` Si después se carga el MEP del ${formatFecha(fecha)} y es distinto, se genera la diferencia de cambio.`
        } else if (modo === 'edicion') {
            mensaje += ' La edición no genera ni ajusta registros de diferencia de cambio.'
        }
    } else if (mep) {
        mensaje = `Se toma el MEP del ${formatFecha(fecha)} (${mep}): se guarda en R$ y el TC del registro pasa a ser ${mep}.`
    } else {
        mensaje = `No hay MEP cargado para el ${formatFecha(fecha)}: el registro queda en USD con TC 1 y se convierte a R$ automáticamente cuando se cargue el MEP de ese día.`
    }

    return (
        <div className="col-span-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <div className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Los montos se ingresan en USD. {mensaje}</p>
            </div>
            {montos.length > 0 &&
                <table className="mt-2 w-full">
                    <thead>
                        <tr className="text-left text-xs opacity-70">
                            <th className="font-normal"></th>
                            <th className="font-normal text-right">USD</th>
                            <th className="font-normal text-right">R$</th>
                        </tr>
                    </thead>
                    <tbody>
                        {montos.map(m => (
                            <tr key={m.label}>
                                <td>{m.label}</td>
                                <td className="text-right">{formatUSD(Number(m.valor))}</td>
                                <td className="text-right">{factor ? formatBRL(Number(m.valor) * factor) : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            }
        </div>
    )
}
