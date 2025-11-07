import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { comboboxField } from '../documentos/formNuevoDocumento';
import { useForm } from 'react-hook-form';
import { post_generico, patch_generico } from '@/endpoints/api';
import { ComboboxAPI, ComboboxForm } from '../comboboxes/ComboboxAPI';
import { Button } from '../ui/button';
import { toast } from 'sonner'
import { Registro } from '@/types/genericos';
import { AsientoInversor } from './dialogAsientoInversor';
import { useEffect } from 'react';

interface FormNuevoAsientoProps {
    registro_data: Registro
    onCreated: (newAsiento: any) => void;
    onCancel: () => void;
    data?: AsientoInversor
}

const formSchema = z.object({
    inversor: comboboxField(),
    tipo_asiento: z.string().min(1, 'El tipo de asiento es obligatorio').max(1, 'El tipo de asiento debe tener un carácter'),
    registro: z.number().min(1, 'El registro es obligatorio'),
});

const tipos_asiento_inversor = [
    { id: 'A', nombre: 'Aporte' },
    { id: 'C', nombre: 'Compensación' },
    { id: 'R', nombre: 'Retiro' },
]

export function FormNuevoAsiento({ registro_data, onCreated, onCancel, data }: FormNuevoAsientoProps) {

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: data ? {
            inversor: data.inversor,
            tipo_asiento: data.tipo_asiento,
            registro: data.registro_id,
        } : {
            inversor: 0,
            tipo_asiento: 'A',
            registro: registro_data.id,
        },
    })

    // Reset form when data changes
    useEffect(() => {
        if (data) {
            form.reset({
                inversor: data.inversor,
                tipo_asiento: data.tipo_asiento,
                registro: data.registro_id,
            });
        } else {
            form.reset({
                inversor: 0,
                tipo_asiento: 'A',
                registro: registro_data.id,
            });
        }
    }, [data, registro_data.id, form]);

    const onSubmit = async (values) => {
        try {
            const response = data 
                ? await patch_generico({
                    model: 'asientos_inversor',
                    id: data.id,
                    dif: values,
                })
                : await post_generico({
                    model: 'asientos_inversor',
                    data: values,
                })
            
            if (response.status === (data ? 200 : 201)) {
                form.reset();
                onCreated(response.data);
                toast.success(data ? 'Asiento inversor actualizado exitosamente' : 'Asiento inversor creado exitosamente');
            }
            else {
                throw new Error(data ? 'Error al actualizar el asiento inversor' : 'Error al crear el asiento inversor');
            }
        } catch (error) {
            console.error(data ? "Error al actualizar el asiento inversor:" : "Error al crear el asiento inversor:", error);
            form.setError('root', { message: data ? 'Error al actualizar el asiento inversor' : 'Error al crear el asiento inversor' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={e => {
                e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
                return form.handleSubmit(onSubmit)(e);
            }}>
                <div className="p-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <ComboboxAPI
                                id="inversor"
                                model="inversores"
                                fieldToShow="nombre"
                                fieldToSend="id"
                                initialLabel={data?.inversor_nombre || null}
                                control={form.control}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <ComboboxForm
                                id="tipo_asiento"
                                control={form.control}
                                model="tipos_asiento_inversor"
                                data={tipos_asiento_inversor}
                                initialLabel={data?.tipo_asiento_nombre || null}
                                fieldToShow="nombre"
                                fieldToSend="id"
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-4 space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit">{data ? 'Actualizar Asiento' : 'Crear Asiento'}</Button>
                </div>
            </form>
        </Form>

    )

}
