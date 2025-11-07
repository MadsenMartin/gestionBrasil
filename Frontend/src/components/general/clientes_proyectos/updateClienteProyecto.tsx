import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormLabel, FormControl, FormMessage, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { patch_generico } from '@/endpoints/api';
import { useState } from 'react';
import { ComboboxAPI } from '../../comboboxes/ComboboxAPI';
import { Pencil } from 'lucide-react';

const formSchema = z.object({
    cliente_proyecto: z.string().max(50, 'Máximo 50 caracteres'),
    nombre: z.string().max(50, 'Máximo 50 caracteres'),
    unidad_de_negocio: z.coerce.number().min(1, 'Este campo es requerido').max(50, 'Máximo 50 caracteres'),
    activo: z.boolean(),
});

interface DialogUpdateClienteProyectoProps {
    toast: any;
    queryClient?: any;
    initialData: any;
}

/**
 * Componente que muestra un formulario para actualizar un cliente-proyecto.
 * @param toast Función para mostrar mensajes al usuario.
 * @param queryClient Cliente de queries de react-query.
 * @param id ID del cliente-proyecto a actualizar.
 * @param initialData Datos iniciales del cliente-proyecto.
 * @returns JSX.Element
 */
export function DialogUpdateClienteProyecto({ toast, queryClient, initialData }: DialogUpdateClienteProyectoProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cliente_proyecto: initialData.cliente_proyecto,
            nombre: initialData.nombre,
            unidad_de_negocio: initialData.unidad_de_negocio,
            activo: initialData.activo,
        },
    });
    const [showForm, setShowForm] = useState(false);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            values.nombre = values.cliente_proyecto;
            const diff = {};
            for (const key in values) {
                if (values[key] !== initialData[key]) {
                    diff[key] = values[key];
                }
            }
            const response = await patch_generico({ model: 'clientes_proyectos', id: initialData.id, dif: diff });
            if (response.status !== 200) {
                toast('Error al actualizar Cliente/Proyecto');
                return;
            }
            form.reset();
            toast('Cliente/Proyecto actualizado exitosamente');
            queryClient?.invalidateQueries('clientes_proyectos');
            setShowForm(false);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <Dialog
            open={showForm}
            onOpenChange={setShowForm}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>
                <Button variant='ghost'>
                    <Pencil />
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogTitle>Actualizar Cliente/Proyecto</DialogTitle>
                <Form {...form}>
                    <form id='updateClienteProyectoForm' onSubmit={e => {
                        e.stopPropagation();
                        return form.handleSubmit(onSubmit)(e);
                    }}>
                        <Card>
                            <CardContent className='p-6'>
                                <FormField control={form.control} name="cliente_proyecto" render={({ field }) => {
                                    return <FormItem>
                                        <FormLabel>Cliente/Proyecto</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder='Cliente/Proyecto' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                }}
                                />
                                <ComboboxAPI
                                    id="unidad_de_negocio"
                                    model="unidades_de_negocio"
                                    fieldToShow="unidad_de_negocio"
                                    fieldToSend="id"
                                    control={form.control}
                                    className="w-full"
                                    value={initialData.unidad_de_negocio}
                                />
                                <Button type="submit">Enviar</Button>
                            </CardContent>
                        </Card>
                    </form>
                </Form>
                <DialogDescription></DialogDescription>
            </DialogContent>
        </Dialog>
    );
}


