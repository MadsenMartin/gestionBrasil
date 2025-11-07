import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { patch_generico } from '@/endpoints/api';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';
import { Registro } from '@/types/genericos';

const formSchema = z.object({
    neto: z.coerce.number(),
    iva: z.coerce.number().optional(),
    fecha: z.string(),
    cliente_proyecto: z.string()
})

export function DialogUpdateCertificado({ toast, updateItem, certificado, trigger }:{toast:any, updateItem:any, certificado:Registro, trigger:JSX.Element}) {
    const [showForm, setShowForm] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            neto: certificado.monto_gasto_ingreso_neto || 0,
            iva: certificado.iva_gasto_ingreso || 0,
            fecha: certificado.fecha_reg,
            cliente_proyecto: certificado.cliente_proyecto
        }
    });

    const onSubmit = async (values: any) => {
        const dif = {};
        for (const key in values) {
            if (values[key] !== certificado[key]) {
                dif[key] = values[key];
            }
        }
        dif['id'] = certificado.id;
        const response = await patch_generico({model: "certificados", id:certificado.certificado, dif: dif})
        if (response.status != 200) {
            toast("Error al actualizar el certificado")
            return
        } else {
            toast("Certificado actualizado correctamente")
            updateItem(response.data)
            setShowForm(false)
        }
    }

    return (
        <Dialog
            open={showForm}
            onOpenChange={setShowForm}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Modificar certificado</DialogTitle>
                <DialogDescription>Modificar registro FCV</DialogDescription>
                <Form {...form}>
                    <form onSubmit={e => {
                        e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
                        return form.handleSubmit(onSubmit)(e);
                    }}>
                        <div className="p-4">
                            <div className="space-y-4">
                                {/* Tuve que sacar el numero de certificado de acá porque no tenía forma facil de obtenerlo */}
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