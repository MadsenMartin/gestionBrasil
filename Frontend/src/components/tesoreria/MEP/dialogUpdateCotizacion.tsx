import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { patch_generico } from "@/endpoints/api";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
    fecha: z.string(),
    compra: z.coerce.number(),
    venta: z.coerce.number()
})

export function DialogUpdateCotizacion({ cotizacion, trigger, toast, updateItem }: { cotizacion: any, trigger: JSX.Element, toast: Function, updateItem: Function }) {
    const [open, setOpen] = useState(false)
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...cotizacion
        }
    })

    const onSubmit = async (values: any) => {
        const dif = {};
        for (const key in values) {
            if (values[key] !== cotizacion[key]) {
                dif[key] = values[key];
            }
        }
        const response = await patch_generico({model: "dolar_mep", id:cotizacion.id, dif: dif})
        if (response.status != 200) {
            toast("Error al actualizar la cotización")
            return
        } else {
            toast("Cotización actualizada correctamente")
            updateItem(response.data)
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Actualizar Cotización</DialogTitle>
                </DialogHeader>
                <Card>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <div className="grid gap-4 p-4">
                                    <FormField
                                        control={form.control}
                                        name="fecha"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Fecha</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        }
                                        }
                                    />
                                    <FormField
                                        control={form.control}
                                        name="compra"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Compra</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        }
                                        }
                                    />
                                    <FormField
                                        control={form.control}
                                        name="venta"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Venta</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        }
                                        }
                                    />
                                </div>
                                <Button type="submit">Guardar</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <DialogDescription>Actualización de la cotización diaria</DialogDescription>
            </DialogContent>
        </Dialog>
    )
}