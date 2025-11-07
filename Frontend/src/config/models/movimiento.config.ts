//import * as z from 'zod';
import { ModelConfig, FormContext } from './types';
import { FieldConfig } from '@/components/genericos/formGenerico';
import { FIELDS } from './fields';

/**
 * Configuración completa del modelo Movimiento
 * Basado en Backend/tesoreria/models.py - Movimiento
 *
 * Similar a Django, solo enumeramos los campos que componen el modelo.
 * Cada campo ya viene con toda su configuración desde FIELDS.
 */
export const movimientoConfig: ModelConfig = {
    name: 'Movimiento',
    apiEndpoint: 'movimiento',

    // ¡Solo enumerar los campos! Cada uno ya tiene sus atributos definidos
    fields: [
        FIELDS.fecha,
        FIELDS.marca,
        FIELDS.proveedor,
        FIELDS.evento,
        FIELDS.categoria,
        FIELDS.subcategoria,
        FIELDS.concepto,
        FIELDS.observacion,
        FIELDS.medio_de_pago,
        FIELDS.moneda,
        FIELDS.monto,
    ],

    // Opcional: especificar qué campos se muestran en cada contexto
    // Si no se especifica, se muestran todos
    createFields: [
        'fecha', 'marca', 'proveedor', 'evento', 'categoria',
        'subcategoria', 'concepto', 'observacion', 'medio_de_pago',
        'moneda', 'monto'
    ],
    updateFields: [
        'fecha', 'marca', 'proveedor', 'evento', 'categoria',
        'subcategoria', 'concepto', 'observacion', 'medio_de_pago',
        'moneda', 'monto'
    ],
};

/**
 * Helper para obtener los campos de formulario según el contexto
 */
export function getMovimientoFormFields(context: FormContext = 'all'): FieldConfig[] {
    let fieldsToInclude: string[];

    switch (context) {
        case 'create':
            fieldsToInclude = movimientoConfig.createFields || movimientoConfig.fields.map(f => f.name);
            break;
        case 'update':
            fieldsToInclude = movimientoConfig.updateFields || movimientoConfig.fields.map(f => f.name);
            break;
        case 'view':
            fieldsToInclude = movimientoConfig.viewFields || movimientoConfig.fields.map(f => f.name);
            break;
        default:
            fieldsToInclude = movimientoConfig.fields.map(f => f.name);
    }

    return movimientoConfig.fields
        .filter(field => fieldsToInclude.includes(field.name))
        .map(field => ({
            name: field.name,
            label: field.label,
            type: field.type as any,
            validation: field.validation,
            defaultValue: field.defaultValue,
            placeholder: field.placeholder,
            model: field.model,
            fieldToSend: field.fieldToSend,
            fieldToShow: field.fieldToShow,
            min: field.min,
            max: field.max,
        }));
}

/**
 * Schema de validación del formulario completo

export const movimientoFormSchema = z.object(
    movimientoConfig.fields.reduce((acc, field) => {
        acc[field.name] = field.validation;
        return acc;
    }, {} as Record<string, z.ZodTypeAny>)
);*/
