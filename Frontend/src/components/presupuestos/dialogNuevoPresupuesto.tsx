import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { post_generico } from '@/endpoints/api';
import { Presupuesto } from './types/presupuestos';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useState } from 'react';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

const formSchema = z.object({
    proveedor: z.coerce.number().min(1, { message: 'Este campo es obligatorio' }),
    cliente_proyecto: z.coerce.number().min(1, { message: 'Este campo es obligatorio' }),
    fecha: z.string(),
    observacion: z.string().min(1, { message: 'Este campo es obligatorio' }),
    monto: z.string()
})

type dialogNuevoPresupuestoProps = {
    toast: any
    addItem: (item: Presupuesto) => void
}

export function DialogNuevoPresupuesto({ toast, addItem }: dialogNuevoPresupuestoProps) {
    const [showForm, setShowForm] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({ 
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            observacion:'',
            proveedor:0,
            cliente_proyecto:0,
            monto:"0"
        }
     })
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const response = await post_generico({ model: 'presupuestos', data: values })
            if (response.status === 201) {
                addItem(response.data)
                toast('Presupuesto creado exitosamente')
                setShowForm(false)
            }
        } catch (error) {
            toast('Error al crear el presupuesto:' + error)
        }
    }
    const campos: (keyof Presupuesto)[] = ["proveedor", "cliente_proyecto"]
    const fieldsToShow = ["nombre", "cliente_proyecto"]
    const models = ["proveedores", "clientes_proyectos"]

    return (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                <Button>Crear presupuesto</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Crear presupuesto</DialogTitle>
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