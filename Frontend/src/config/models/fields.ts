import * as z from 'zod';
import { ModelFieldConfig } from './types';

/**
 * Helper para crear validación de campos combobox
 */
const comboboxField = (required?: boolean, message?: string) => {
    const base = z.number().int().nullable();
    if (required) {
        return base.refine((val) => val !== null, {
            message: message || "Este campo es requerido"
        });
    }
    return base;
};

/**
 * Definiciones centralizadas de campos de la base de datos
 * Similar a cómo Django define campos en models.py
 *
 * Cada campo contiene TODA su configuración:
 * - Validación
 * - Tipo de input
 * - Label
 * - Valores por defecto
 * - Modelo relacionado (si aplica)
 *
 * Uso:
 * ```typescript
 * import { FIELDS } from '@/config/models/fields';
 *
 * const formFields = [
 *   FIELDS.fecha,
 *   FIELDS.marca,
 *   FIELDS.monto
 * ];
 * ```
 */
export const FIELDS: Record<string, ModelFieldConfig> = {
    // ============================================
    // CAMPOS COMUNES
    // ============================================

    fecha: {
        name: 'fecha',
        label: 'Fecha',
        type: 'date',
        validation: z.string().min(1, "Indique una fecha"),
        defaultValue: new Date().toISOString().split('T')[0],
        required: true,
    },

    monto: {
        name: 'monto',
        label: 'Monto',
        type: 'number',
        validation: z.coerce.number(),
        defaultValue: 0,
        required: true,
    },

    monto_retenido: {
        name: 'monto_retenido',
        label: 'Monto Retenido',
        type: 'number',
        validation: z.coerce.number(),
        defaultValue: 0,
        required: true,
    },

    concepto: {
        name: 'concepto',
        label: 'Concepto',
        type: 'text',
        validation: z.string().min(1, "Indique un concepto"),
        defaultValue: "",
        required: true,
    },

    observacion: {
        name: 'observacion',
        label: 'Observación',
        type: 'text',
        validation: z.string().optional(),
        defaultValue: "",
        required: false,
    },

    // ============================================
    // FOREIGN KEYS / COMBOBOXES
    // ============================================

    unidad_de_negocio: {
        name: 'unidad_de_negocio',
        label: 'Unidad de Negocio',
        type: 'combobox',
        model: 'unidad_de_negocio',
        validation: comboboxField(),
        defaultValue: null,
        required: true,
    },

    proveedor: {
        name: 'proveedor',
        label: 'Proveedor',
        type: 'combobox',
        model: 'proveedor',
        validation: comboboxField(),
        defaultValue: null,
        required: false,
    },

    cliente_proyecto: {
        name: 'cliente_proyecto',
        label: 'Cliente / Proyecto',
        type: 'combobox',
        model: 'cliente_proyecto',
        validation: comboboxField(),
        defaultValue: null,
        required: false,
    },

    caja: {
        name: 'caja',
        label: 'Caja',
        type: 'combobox',
        model: 'cajas',
        fieldToShow: 'caja',
        validation: comboboxField(true, "Indique una caja"),
        defaultValue: null,
        required: true,
    },

    moneda: {
        name: 'moneda',
        label: 'Moneda',
        type: 'combobox',
        model: 'moneda',
        validation: comboboxField(true, "Indique una moneda"),
        defaultValue: null,
        required: true,
    },

    // ============================================
    // CAMPOS ESPECÍFICOS DE OTROS MODELOS
    // ============================================

    participante: {
        name: 'participante',
        label: 'Participante',
        type: 'combobox',
        model: 'participante',
        validation: comboboxField(),
        defaultValue: null,
        required: false,
    },

    formulario: {
        name: 'formulario',
        label: 'Formulario',
        type: 'combobox',
        model: 'formulario',
        validation: comboboxField(),
        defaultValue: null,
        required: false,
    },

    validado: {
        name: 'validado',
        label: 'Validado',
        type: 'checkbox',
        validation: z.boolean().optional(),
        defaultValue: false,
        required: false,
    },

    comprobante: {
        name: 'comprobante',
        label: 'Comprobante (PDF o Imagen)',
        type: 'file',
        validation: z.any().optional(),
        defaultValue: undefined,
        required: false,
    },

    documento: {
        name: 'documento',
        label: 'Documento',
        type: 'data',
        validation: z.number(),
        required: true,
    },

    // Agregar más campos según sea necesario...
};
