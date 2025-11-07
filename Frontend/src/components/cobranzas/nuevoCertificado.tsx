import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { post_generico } from '@/endpoints/api';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

const formSchema = z.object({
    numero: z.coerce.number(),
    neto: z.coerce.number(),
    iva: z.coerce.number().optional(),
    fecha: z.string(),
    cliente_proyecto: z.string()
})

export function DialogNuevoCertificado({ toast, addItem }) {
    const [showForm, setShowForm] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            numero: 0,
            neto: 0,
            iva: 0,
            fecha: new Date().toISOString().split('T')[0],
            cliente_proyecto: ''
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const response = await post_generico({model:"certificados",data:values})
            if (response.status !== 201) {
                toast('Error al crear certificado');
                return;
            }
            form.reset()
            toast("Certificado creado exitosamente")
            addItem(response.data)
            setShowForm(false)
        } catch (error) {
            toast('Error al crear certificado:' + error.message);
            console.error('Error:', error)
        }

    }

    return (
        <Dialog
            open={showForm}
            onOpenChange={setShowForm}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>
                <Button onClick={() => setShowForm(true)}>Nuevo certificado</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Nuevo certificado</DialogTitle>
                <DialogDescription>Crear nuevo registro FCV</DialogDescription>
                <Form {...form}>
                    <form onSubmit={e => {
                        e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
                        return form.handleSubmit(onSubmit)(e);
                    }}>
                        <div className="p-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <FormField control={form.control} name="numero" render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>Número de certificado</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder='N° de certificado' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField control={form.control} name="neto" render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>Neto</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder='Neto' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField control={form.control} name="iva" render={({ field }) => {
                                        return <FormItem>
                                            <FormLabel>IVA</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder='IVA' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="fecha"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Fecha</FormLabel>
                                                <FormControl>
                                                    <Input type="date" placeholder='Fecha' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <ComboboxAPI
                                        id="cliente_proyecto"
                                        model="clientes_proyectos"
                                        fieldToShow="cliente_proyecto"
                                        fieldToSend="cliente_proyecto"
                                        control={form.control}
                                        className="w-full"
                                    />
                                </div>
                                <Button type="submit">Guardar</Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}