export type Certificado = {
    id: number
    neto: number | null
    iva: number | null
    fecha: string
    numero: number
    observacion: string | null
    saldo: number
    cliente_proyecto: string
}

export type Retencion = {
    id: number
    pdf_file: string
    numero: string
    fecha: string
    tipo: string
    registro: number
}