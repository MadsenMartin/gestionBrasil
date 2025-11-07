import * as z from "zod";

export const comboboxField = (required?: boolean, message?: string) => {
    const base = z.number().int().nullable();
    if (required) {
        return base.refine((val) => val !== null, {
            message: message || "Este campo es requerido"
        });
    }
    return base;
}

export const formSchema = z.object({
        tipo_documento: z.number().int().min(1, "Este campo es requerido"),
        fecha_documento: z.string(),
        proveedor: z.number().int().min(1, "Este campo es requerido"),
        receptor: z.number().int().min(1, "Este campo es requerido"),
        serie: z.coerce.number().int(),
        numero: z.coerce.number().int(),
        chave_de_acesso: z.coerce.number().int().optional().nullable(),
        añomes_imputacion_gasto: z.coerce.number(),
        añomes_imputacion_contable: z.coerce.number(),
        tiene_cno: z.boolean(),
        unidad_de_negocio: comboboxField(),
        cliente_proyecto: comboboxField(),
        imputacion: comboboxField(),
        concepto: z.string().min(1, "Este campo es requerido"),
        comentario: z.string().optional().nullable(),
        total: z.coerce.number().min(0, "El total debe ser un número positivo"),
        impuestos_retidos: z.coerce.number().min(0, "Los impuestos retidos deben ser un número positivo"),
        moneda: z.coerce.number(),
        municipio: comboboxField(),
        archivo: z.instanceof(File),
    })