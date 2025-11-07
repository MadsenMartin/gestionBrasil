/**
 * Exportador central de configuraciones de modelos
 *
 * Este archivo centraliza todas las definiciones de modelos de la aplicación,
 * permitiendo reutilizar configuraciones de campos, validaciones y esquemas
 * a través de diferentes formularios y componentes.
 *
 * Inspirado en Django, cada campo tiene su definición completa (FIELDS),
 * y los modelos solo enumeran qué campos usan.
 *
 * Uso:
 * ```typescript
 * import { FIELDS } from '@/config/models';
 * import { getMovimientoFormFields } from '@/config/models';
 *
 * // Opción 1: Usar un modelo predefinido
 * const fields = getMovimientoFormFields('create');
 *
 * // Opción 2: Crear un formulario custom combinando campos
 * const customFields = [FIELDS.fecha, FIELDS.monto, FIELDS.concepto];
 * ```
 */

// Exportar tipos
export type { ModelConfig, ModelFieldConfig, FieldType, FormContext } from './types';

// Exportar definiciones de campos (¡el corazón del sistema!)
export { FIELDS } from './fields';

// Exportar configuraciones de modelos
export {
    movimientoConfig,
    getMovimientoFormFields,
} from './movimiento.config';

// TODO: Agregar más modelos aquí a medida que se migran
// export { cobroConfig, getCobroFormFields } from './cobro.config';
// export { marcaConfig, getMarcaFormFields } from './marca.config';
// etc.
