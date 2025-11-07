import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { patch_generico } from '@/endpoints/api';
import { Presupuesto } from './types/presupuestos';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import React, { useEffect, useState } from 'react';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

const formSchema = z.object({
    proveedor: z.coerce.number().min(1, { message: 'Este campo es obligatorio' }),
    cliente_proyecto: z.coerce.number().min(1, { message: 'Este campo es obligatorio' }),
    fecha: z.string(),
    observacion: z.string().min(1, { message: 'Este campo es obligatorio' }),
    monto: z.string()
})

type dialogNuevoPresupuestoProps = {
    trigger?: React.ReactNode
    toast: any
    updateItem: (item: Presupuesto) => void
    initialData: any
}

export function DialogUpdatePresupuesto({ toast, updateItem, initialData, trigger }: dialogNuevoPresupuestoProps) {
    const [showForm, setShowForm] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({ 
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: initialData.fecha,
            observacion: initialData.observacion,
            monto: initialData.monto,
            proveedor: initialData.proveedor_id || initialData.proveedor, // Usa el ID si está disponible
            cliente_proyecto: initialData.cliente_proyecto_id || initialData.cliente_proyecto, // Usa el ID si está disponible
        }
     })

     useEffect(() => {
        if (initialData && showForm) {
            // Ahora que la vista SQL incluye tanto IDs como slugs, no necesitamos fetch
            // Solo actualizamos el form con los datos que ya tenemos
            form.reset({
                fecha: initialData.fecha,
                observacion: initialData.observacion,
                monto: initialData.monto,
                proveedor: initialData.proveedor_id || initialData.proveedor,
                cliente_proyecto: initialData.cliente_proyecto_id || initialData.cliente_proyecto,
            });
        }
     }, [initialData, showForm, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const diff = {};
            
            // Crear un objeto de comparación que use los IDs para proveedor y cliente
            const initialDataForComparison = {
                fecha: initialData.fecha,
                observacion: initialData.observacion,
                monto: initialData.monto,
                proveedor: initialData.proveedor_id || initialData.proveedor,
                cliente_proyecto: initialData.cliente_proyecto_id || initialData.cliente_proyecto,
            };
            
            for (const key in values) {
                if (values[key] !== initialDataForComparison[key]) {
                    diff[key] = values[key];
                }
            }
            
            const response = await patch_generico({ model: 'presupuestos', id: initialData.id, dif: diff });
            if (response.status !== 200) {
                toast('Error al actualizar el presupuesto');
                return;
            }
            form.reset();
            toast('Presupuesto actualizado exitosamente');
            
            // Crear un objeto actualizado que preserve los IDs necesarios para futuras ediciones
            const updatedItem = {
                ...initialData, // Mantiene todos los campos originales incluyendo los IDs
                ...response.data, // Aplica los datos actualizados del backend (slugs actualizados)
                // Si se cambió el proveedor, usar el nuevo ID, sino mantener el original
                proveedor_id: values.proveedor !== (initialData.proveedor_id || initialData.proveedor) 
                    ? values.proveedor 
                    : initialData.proveedor_id,
                // Si se cambió el cliente, usar el nuevo ID, sino mantener el original  
                cliente_proyecto_id: values.cliente_proyecto !== (initialData.cliente_proyecto_id || initialData.cliente_proyecto)
                    ? values.cliente_proyecto 
                    : initialData.cliente_proyecto_id,
            };
            
            updateItem(updatedItem);
            setShowForm(false);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const campos: (keyof Presupuesto)[] = ["proveedor", "cliente_proyecto"]
    const fieldsToShow = ["nombre", "cliente_proyecto"]
    const models = ["proveedores", "clientes_proyectos"]

    return (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                {trigger||<Button>Editar</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Editar presupuesto</DialogTitle>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FormField
                                    control={form.control}
                                    name="fecha"
                                    render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>Fecha</FormLabel>
                                            <FormControl>
                                                <Input type="date" placeholder='Fecha del presupuesto' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                />
                            </div>
                            {campos.map((campo, index) => (
                                <div key={index}>
                                    <ComboboxAPI
                                        id={campo}
                                        control={form.control}
                                        model={models[index]}
                                        fieldToShow={fieldsToShow[index]}
                                        fieldToSend={"id"}
                                        initialLabel={initialData[campo]}
                                    />
                                </div>
                            ))}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="observacion"
                                    render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>Observación</FormLabel>
                                            <FormControl>
                                                <Input type="text" placeholder='Escriba una observación' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="monto"
                                    render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>Monto</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder='Monto' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <DialogDescription></DialogDescription>
                            <Button type="submit">Guardar</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}