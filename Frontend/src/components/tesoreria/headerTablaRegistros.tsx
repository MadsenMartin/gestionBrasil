import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp } from "lucide-react";
import { TableHead } from "@/components/ui/table";

const hoverContents = {
    "caja": "Caja desde la que se realiza el gasto o ingreso",
    "fecha_reg": "En caso de ser un pago, es la fecha efectiva del mismo",
    "tipo_reg": "Tipo de registro",
    "unidad_de_negocio": "Unidad de negocio",
    "cliente_proyecto": "Cliente o proyecto",
    "proveedor": "Razón social del proveedor o caja contrapartida",
    "imputacion": "Imputación",
    "observacion": "Observación",
    "monto_gasto_ingreso_neto": "Monto neto del gasto o ingreso en AR$",
    "iva_gasto_ingreso": "IVA del gasto o ingreso en AR$",
    "total_gasto_ingreso": 'Neto + IVA, "Debe"',
    "monto_op_rec": 'Monto de la OP o del REC en AR$, "Haber"',
    "saldo_acumulado": "Saldo de la caja luego del gasto o ingreso, en la moneda de la caja",
}

type HeaderTablaProps = {
    header: string,
    headerCapitalized: string,
    type?: "number" | null,
    handleOrdenar: (header: string) => void,
    ordenPor: string,
    orden: string,
    ordenPorCompleto?: string, // Concatenación del campo actual + campo del modelo a filtrar en caso de ser una fk (ej: "proveedor__razon_social")
    hoverTitle?: string,
}

export function HeaderTablaRegistros({ header, headerCapitalized, type, handleOrdenar, ordenPor, orden, ordenPorCompleto, hoverTitle }: HeaderTablaProps) {

    const alineacion = (type) => {
        if (type === "number") return "text-end"
        else return "justify-items-start"
    }

    return (
        <TableHead key={header+headerCapitalized} className={alineacion(type)}>
            <HoverCard>
                <HoverCardTrigger asChild>
                    <Button className="px-0" variant="ghost" onClick={() => handleOrdenar(header)}>
                        {headerCapitalized}
                        {ordenPor === ordenPorCompleto ? (
                            orden === 'asc' ? (
                                <ArrowUp />)
                                : (<ArrowDown />)
                        ) : null}
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-fit max-w-52">
                    <div className="flex flex-col space-y-2">
                        {hoverTitle && <span className="font-bold text-center">{hoverTitle}</span>}
                        <span className="font-medium text-center">{hoverContents[header]}</span>
                    </div>
                </HoverCardContent>
            </HoverCard>
        </TableHead>
    )
}