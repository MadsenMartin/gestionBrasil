import { DialogGenerico } from "@/components/genericos/dialogGenerico"
import { FormGenerico, FieldConfig } from "@/components/genericos/formGenerico"
import { DialogConfirmacion } from "@/components/genericos/dialogConfirmacion"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { handleDelete } from "@/components/cruds/delete/handleDelete"
import { useState } from "react";

export interface CRUDConfig {
    model: string;
    nombre: string; // "Marca", "Categoría", etc.
    prefijo: 'el' | 'la'; // para "el"/"la" en mensajes
    fields: FieldConfig[];
    mensajeEliminar?: string; // opcional, tiene default
}

export function crearCRUD(config: CRUDConfig) {
    const { model, nombre, prefijo, fields, mensajeEliminar } = config;

    const mensajeEliminarDefault = `Está seguro que desea eliminar ${prefijo} ${nombre.toLowerCase()}? Esta acción no ${prefijo} eliminará, solo dejará de estar disponible para futuros movimientos.`;

    // ------------- CREATE -----------------

    function FormCrear({ onSuccess }: { onSuccess: (data: any) => void }) {
        return (
            <FormGenerico
                action="POST"
                fields={fields}
                model={model}
                onSuccess={onSuccess}
            />
        )
    }

    function DialogoCrear({ trigger, addItem }: { trigger: React.ReactNode, addItem: (item: any) => void }) {
        const [open, setOpen] = useState(false);

        const onSuccess = (data: any) => {
            addItem(data);
            setOpen(false);
        }

        return (
            <DialogGenerico
                trigger={trigger}
                open={open}
                setOpen={setOpen}
                title={`Crear ${nombre}`}
                children={<FormCrear onSuccess={onSuccess} />}
                description={`Completá los campos para crear un${prefijo === 'el' ? '' : 'a'} nuev${prefijo === 'el' ? 'o' : 'a'} ${nombre.toLowerCase()}.`}
            />
        )
    }

    // ------------- UPDATE -----------------

    function FormUpdate({ updateItem, instancia, setOpen }: { updateItem: (item: any) => void; instancia: any; setOpen: (open: boolean) => void }) {

        // Clonar fields y agregar initialLabel a los combobox basándose en la instancia
        const fieldsConLabels: FieldConfig[] = fields.map(field => {
            if (field.type === 'combobox' && instancia) {
                // Buscar el campo _nombre correspondiente en la instancia
                // Por ejemplo, si el field es 'categoria', buscar 'categoria_nombre'
                const labelField = `${field.name}_nombre`;
                const initialLabel = instancia[labelField];

                return {
                    ...field,
                    initialLabel: initialLabel || undefined
                };
            }
            return {
                ...field,
                initialLabel: instancia[field.name] || undefined
            }
        });

        return (
            <FormGenerico
                action="UPDATE"
                fields={fieldsConLabels}
                model={model}
                instancia={instancia}
                updateItem={updateItem}
                setOpen={setOpen}
            />
        );
    }

    function DialogoActualizar({ trigger, instancia, updateItem }: { trigger: React.ReactNode, instancia: any, updateItem: (item: any) => void }) {
        const [open, setOpen] = useState(false);

        return (
            <DialogGenerico
                trigger={trigger}
                open={open}
                setOpen={setOpen}
                title={`Editar ${nombre}`}
                children={<FormUpdate instancia={instancia} updateItem={updateItem} setOpen={setOpen} />}
                description={`Modificá los campos que quieras editar ${prefijo === 'el' ? 'del' : 'de la'} ${nombre.toLowerCase()}.`}
            />
        )
    }

    // ------------- DELETE -----------------

    function DialogEliminar({ instancia, deleteItem }: { instancia: any, deleteItem: (id: number) => void }) {
        return (
            <DialogConfirmacion
                trigger={
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                        Eliminar
                    </DropdownMenuItem>
                }
                onConfirm={() => handleDelete({ model, instancia, deleteItem, prefix: prefijo })}
                mensaje={mensajeEliminar || mensajeEliminarDefault}
            />
        )
    }

    // Retornar los 3 componentes
    return {
        DialogoCrear,
        DialogoActualizar,
        DialogEliminar
    };
}
