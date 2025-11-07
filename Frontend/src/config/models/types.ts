import * as z from 'zod';

/**
 * Tipos de campos soportados en los formularios
 */
export type FieldType = 'text' | 'number' | 'combobox' | 'date' | 'textarea' | 'email' | 'checkbox' | 'file' | 'data';

/**
 * Configuración de un campo individual del modelo
 */
export interface ModelFieldConfig {
    /** Nombre del campo en la base de datos */
    name: string;
    /** Etiqueta visible para el usuario */
    label: string;
    /** Tipo de input a renderizar */
    type: FieldType;
    /** Schema de validación Zod */
    validation: z.ZodTypeAny;
    /** Valor por defecto del campo */
    defaultValue?: any;
    /** Placeholder para inputs de texto */
    placeholder?: string;
    /** Si el campo es requerido */
    required?: boolean;

    // Configuración específica para combobox
    /** Modelo relacionado (para comboboxes) */
    model?: string;
    /** Campo a enviar al backend (para comboboxes) */
    fieldToSend?: string;
    /** Campo a mostrar en el combobox */
    fieldToShow?: string;

    // Configuración específica para number
    /** Valor mínimo (para inputs numéricos) */
    min?: number;
    /** Valor máximo (para inputs numéricos) */
    max?: number;

    // Configuración para renderizado
    /** Descripción o ayuda para el campo */
    description?: string;
    /** Si el campo ocupa el ancho completo (span 2 columnas) */
    fullWidth?: boolean;
}

/**
 * Configuración completa de un modelo
 */
export interface ModelConfig {
    /** Nombre del modelo */
    name: string;
    /** Nombre del endpoint en la API */
    apiEndpoint: string;
    /** Configuración de todos los campos */
    fields: ModelFieldConfig[];
    /** Campos que se muestran en modo creación */
    createFields?: string[];
    /** Campos que se muestran en modo edición */
    updateFields?: string[];
    /** Campos que se muestran en modo visualización */
    viewFields?: string[];
    /** Schema de validación del formulario completo */
    formSchema?: z.ZodObject<any>;
}

/**
 * Contexto en el que se usa la configuración
 */
export type FormContext = 'create' | 'update' | 'view' | 'all';
