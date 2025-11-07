export interface DBDesacopio {
    id: number;
    fecha_entrega: string;
    remito: string;
    nro_pedido: string;
    arquitecto: string;
    codigo: string;
    nombre: string;
    cantidad: number;
    unitario: number;
    alicuota: number;
    cliente_proyecto_id: number;
    obra: string;
    conciliado: boolean;
    acopio: string;
    presupuesto_cliente_item: number | null;
    lista_de_precios: string;
    unitario_lista_cliente: number;
    neto_lista_cliente: number;
    total_lista_cliente: number;
}

export interface Acopio {
    id: number;
    fecha: string;
    acopiante: number;
    acopiante_nombre: string;
    monto: number;
    iva: number;
    total: number;
    nombre: string;
    tipo_de_cambio: number;
    coeficiente_ajuste: number;
    saldo: number;
}

export interface Desacopio {
    id: number;
    fecha_entrega: string;
    remito: string;
    nro_pedido: string;
    arquitecto: string;
    articulo: number;
    articulo_codigo: string;
    articulo_nombre: string;
    cantidad: number;
    unitario: number;
    alicuota: number;
    obra: number | null;
    obra_nombre: string;
    conciliado: boolean;
    acopio: number;
    acopio_nombre: string;
    presupuesto_cliente_item: number | null;
    monto_total: number;
}