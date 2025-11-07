import * as z from 'zod';
import { ModelConfig } from './types';
import { FieldConfig } from '@/components/genericos/formGenerico';
import { FIELDS } from './fields';

/**
 * Configuración completa del modelo Movimiento
 * Basado en Backend/tesoreria/models.py - Movimiento
 *
 * Similar a Django, solo enumeramos los campos que componen el modelo.
 * Cada campo ya viene con toda su configuración desde FIELDS.
 */
export const cobroConfig: ModelConfig = {
    name: 'Cobro',
    apiEndpoint: 'cobro',

    fields: [
        FIELDS.fecha,
        FIELDS.monto,
        FIELDS.comprobante,
        FIELDS.validado,
        FIELDS.formulario,
        FIELDS.participante,
        FIELDS.caja,
    ],
};

/**
 * Helper para obtener los campos de formulario según el contexto
 */
export function getCobroFormFields(): FieldConfig[] {
    return cobroConfig.fields

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
 */
export const cobroFormSchema = z.object(
    cobroConfig.fields.reduce((acc, field) => {
        acc[field.name] = field.validation;
        return acc;
    }, {} as Record<string, z.ZodTypeAny>)
);
