import { ClienteProyecto, Persona, Imputacion } from "@/types/genericos";

export interface Presupuesto {
    id: number;
    fecha: string;
    proveedor: Persona["razon_social"];
    cliente_proyecto: ClienteProyecto["cliente_proyecto"];
    imputacion?: Imputacion["imputacion"];
    observacion?: string;
    monto: string;
    saldo?: string;
    nombre?: string;
    estado?: string;
    aprobado?: string;
  }

export interface EstadoPresupuesto {
    id: number;
    presupuesto: Presupuesto["nombre"];
    fecha: string;
    estado: string;
    usuario: string;
    observacion: string | null;
    accion?:string;
  }
  
export interface ComentariosPresupuesto {
    id: number;
    usuario: string;
    comentario: string;
    fecha: string;
    accion?: string;
}
