import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { post_generico } from '@/endpoints/api';
import { useState } from 'react';
import { ComboboxAPI } from '@/components/comboboxes/ComboboxAPI';

const formSchema = z.object({
    cliente_proyecto: z.string().max(50, 'Máximo 50 caracteres'),
    nombre: z.string().max(50, 'Máximo 50 caracteres'),
    unidad_de_negocio: z.coerce.number().min(1, 'Este campo es requerido').max(50, 'Máximo 50 caracteres'),
    activo: z.boolean(),
});

interface DialogNuevoClienteProyectoProps {
    toast: any;
    buttonStr: string;
    queryClient?: any;
}

/**
 * Componente que muestra un formulario para cargar un nuevo cliente-proyecto.
 * @param toast Función para mostrar mensajes al usuario.
 * @param buttonStr Texto del botón que muestra el formulario.
 * @param queryClient Cliente de queries de react-query.
 * @returns JSX.Element
 */
export function DialogNuevoClienteProyecto({ toast, buttonStr, queryClient }: DialogNuevoClienteProyectoProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cliente_proyecto: '',
            nombre: '',
            unidad_de_negocio: 0,
            activo: true,
        },
    });
    const [showForm, setShowForm] = useState(false);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            values.nombre = values.cliente_proyecto;
            const response = await post_generico({ model: 'clientes_proyectos', data: values });
            if (response.status !== 201) {
                toast('Error al crear Cliente/Proyecto');
                return;
            }
            form.reset();
            toast('Cliente/Proyecto creado exitosamente');
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
                <Button>{buttonStr}</Button>
            </DialogTrigger>
            <DialogContent className='p-6'>
                <DialogTitle>Cargar Nuevo Cliente/Proyecto</DialogTitle>
                <Form {...form}>
                    <form id='nuevoClienteProyectoForm' onSubmit={e => {
                        e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
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
                                />
                                <Button type="submit">{buttonStr}</Button>
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}