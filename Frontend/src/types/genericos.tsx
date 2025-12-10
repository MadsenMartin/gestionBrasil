export type Caja = {
    id: number
    caja:string
    activo: boolean
    moneda: number
    saldo: number
    dueño: number
}

export type Imputacion = {
    id: number
    imputacion: string
    activo: boolean
}

export type ClienteProyecto = {
    id: number
    cliente_proyecto: string
    activo: boolean
    nombre?: string
    unidad_de_negocio?: string
}

export type UnidadDeNegocio = {
    id: number
    unidad_de_negocio: string
    activo: boolean
}

export type Persona = {
    id: number
    razon_social: string
    nombre_fantasia_pila?: string
    cnpj: number
    activo: boolean
    nombre?: string
}

export type Registro = {
    id: number
    tipo_reg: string
    caja: string
    certificado: number | null
    documento: Documento | Documento["id"]
    documento_str: string | null
    fecha_reg: string
    añomes_imputacion: number
    unidad_de_negocio: string | null
    cliente_proyecto: string | null
    proveedor: string | null
    caja_contrapartida: string | null
    imputacion: string | null
    observacion: string | null
    presupuesto: string | null
    monto_gasto_ingreso_neto: number | null
    iva_gasto_ingreso: number | null
    total_gasto_ingreso: number | null
    monto_op_rec: number | null
    total_gasto_ingreso_usd: number | null
    monto_op_rec_usd: number | null
    moneda: number
    tipo_de_cambio: number | null
    realizado: boolean
    saldo_acumulado: number
  }

  export type Notificacion = {
    id: number
    fecha: string
    mensaje: string
    leido: boolean
    usuario_id: number
}
  
  export type Documento = {
    id: number
    tipo_documento: string
    fecha_documento: string
    proveedor: string
    receptor: string
    serie: number
    numero: number
    chave_de_acesso: number | null
    añomes_imputacion_gasto: number
    añomes_imputacion_contable: number
    tiene_cno: boolean
    unidad_de_negocio: string
    cliente_proyecto: string
    imputacion: string
    concepto: string
    comentario: string | null

    // Montos
    total: number
    impuestos_retidos: number
    
    moneda: number
    moneda_display: string
    fecha_pago: string | null
    municipio: string | null
    archivo: string
    activo: boolean
    fecha_carga: string
    imputado: boolean
  }

export type PagoFactura = {
    id: number
    documentos: Documento[]
    registros_fc: Registro[]
    proveedor: string
    op: string
    caja?: string
    obra?: string
    registros_pago: Registro[]
    monto: number
    fecha_pago: string
  }

export type TipoDocumento = {
  id: number
  tipo_documento: string
  activo: boolean
  letra: string
}