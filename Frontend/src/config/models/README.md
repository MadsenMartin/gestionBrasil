# Sistema de Definición de Modelos

Sistema centralizado para definir campos de base de datos y generar formularios automáticamente, inspirado en Django.

## Concepto

Similar a Django, cada campo (ej: `fecha`, `marca`, `monto`) tiene su definición completa en un solo lugar (`fields.ts`). Cuando defines un modelo o creas un formulario, simplemente enumeras qué campos necesitas.

## Estructura

```
Frontend/src/config/models/
├── fields.ts           # Definiciones de TODOS los campos (como CharField, ForeignKey en Django)
├── types.ts            # Tipos TypeScript compartidos
├── movimiento.config.ts # Configuración del modelo Movimiento
├── index.ts            # Exportador central
└── README.md           # Esta documentación
```

## Uso

### Opción 1: Usar un modelo predefinido

```typescript
import { getMovimientoFormFields } from '@/config/models';

export function FormCrearRegistro({ onSuccess }) {
    // Obtener todos los campos del modelo Movimiento para contexto "create"
    const fields = getMovimientoFormFields('create');

    return <FormGenerico mode='create' fields={fields} model='movimiento' onSuccess={onSuccess} />;
}
```

### Opción 2: Crear un formulario custom (¡como Django!)

```typescript
import { FIELDS } from '@/config/models';

export function FormRapidoGasto({ onSuccess }) {
    // Crear un formulario personalizado con solo algunos campos
    const fields = [
        FIELDS.fecha,
        FIELDS.concepto,
        FIELDS.monto,
        FIELDS.categoria
    ];

    return <FormGenerico mode='create' fields={fields} model='movimiento' onSuccess={onSuccess} />;
}
```

### Opción 3: Modificar un campo existente

```typescript
import { FIELDS } from '@/config/models';

export function FormEspecial({ onSuccess }) {
    const fields = [
        FIELDS.fecha,
        {
            ...FIELDS.monto,
            label: 'Importe Total', // Personalizar el label
            min: 0,
            max: 100000
        },
        FIELDS.categoria
    ];

    return <FormGenerico mode='create' fields={fields} model='movimiento' onSuccess={onSuccess} />;
}
```

## Agregar nuevos campos

### 1. Agregar definición en `fields.ts`

```typescript
export const FIELDS: Record<string, ModelFieldConfig> = {
    // ... campos existentes ...

    nombre_cliente: {
        name: 'nombre_cliente',
        label: 'Nombre del Cliente',
        type: 'text',
        validation: z.string().min(2, "Mínimo 2 caracteres"),
        defaultValue: "",
        required: true,
    },
};
```

### 2. Usar en cualquier formulario

```typescript
import { FIELDS } from '@/config/models';

const fields = [
    FIELDS.fecha,
    FIELDS.nombre_cliente, // ¡Ya está disponible!
    FIELDS.monto
];
```

## Agregar nuevos modelos

### 1. Crear archivo de configuración (ej: `cobro.config.ts`)

```typescript
import { ModelConfig, FormContext } from './types';
import { FieldConfig } from '@/components/genericos/formGenerico';
import { FIELDS } from './fields';

export const cobroConfig: ModelConfig = {
    name: 'Cobro',
    apiEndpoint: 'cobro',

    // Solo enumerar campos del modelo
    fields: [
        FIELDS.fecha,
        FIELDS.monto,
        FIELDS.participante,
        FIELDS.formulario,
        FIELDS.caja,
        FIELDS.validado,
        FIELDS.comprobante,
    ],
};

export function getCobroFormFields(context: FormContext = 'all'): FieldConfig[] {
    // ... lógica similar a movimientoConfig ...
}
```

### 2. Exportar en `index.ts`

```typescript
export {
    cobroConfig,
    getCobroFormFields,
} from './cobro.config';
```

### 3. Usar en formularios

```typescript
import { getCobroFormFields } from '@/config/models';

const fields = getCobroFormFields('create');
```

## Ventajas

1. **DRY**: Cada campo se define una sola vez
2. **Consistencia**: Mismo comportamiento en create/update/view
3. **Mantenibilidad**: Cambiar un campo en un solo lugar
4. **Flexibilidad**: Combinar campos como bloques de LEGO
5. **Type-safe**: TypeScript valida todo
6. **Escalable**: Fácil agregar nuevos campos y modelos

## Comparación con Django

### Django (Python)
```python
class Movimiento(models.Model):
    fecha = models.DateField()
    marca = models.ForeignKey('Marca', on_delete=models.DO_NOTHING)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
```

### Este sistema (TypeScript)
```typescript
export const movimientoConfig = {
    name: 'Movimiento',
    fields: [
        FIELDS.fecha,
        FIELDS.marca,
        FIELDS.monto,
    ]
}
```

¡Similar simplicidad, reutilizando definiciones de campos!
