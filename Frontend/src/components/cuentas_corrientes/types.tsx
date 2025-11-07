
export type Movimiento = {
    tipo: string
    numero: string
    fecha: string
    concepto: string
    monto: number
  }
  
  export type Certificado = {
    cliente_proyecto: number
    neto: number
    iva: number
    fecha: string
    numero: string
    observacion: string
    saldo: number
  }
  
  export type SaldoCaja = {
    id: number
    fecha: string
    saldo: number
    caja: number
    registro: number
  }
  
  export type Registro = {
    id: number
    caja: string
    tipo_reg: string
    certificado: number
    documento: number
    añomes_imputacion: number
    caja_contrapartida: string
    moneda: number
    fecha_reg: string
    unidad_de_negocio: string
    cliente_proyecto: string
    proveedor: string
    imputacion: string
    observacion: string
    monto_gasto_ingreso_neto: number
    iva_gasto_ingreso: number
    monto_op_rec: number
    saldo_caja: SaldoCaja
  }
  
  export type MovimientosCertificado = {
    certificado: Certificado
    pagos: Registro[]
    saldo: number
  }

  export type DetalleCuentaCorrienteCliente = {
    certificados: MovimientosCertificado[]
    otros_movimientos: Registro[]
  }
  
  export type EntidadBase = {
    id: number
    nombre: string
  }

  interface RegistroCuentaCorriente extends Registro {
    neto: number
  }
  
  export type CuentaCorriente = {
    proveedor?: number
    cliente?: number
    facturas: any[]
    pagos: any[]
    saldo: number
  }

  export type NuevaCuentaCorriente = {
    registros: RegistroCuentaCorriente[]
    saldo: number
  }
  
  export type CuentaCorrienteCliente = {
    cliente: number
    detalle: DetalleCuentaCorrienteCliente
    saldo: number
  }  

export type TipoDocumento = {
    id: number;
    tipo_documento: string;
  }