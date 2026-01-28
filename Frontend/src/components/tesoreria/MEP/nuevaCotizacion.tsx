import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import * as z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { post_generico } from "@/endpoints/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formSchema = z.object({
    fecha: z.string(),
    compra: z.coerce.number(),
    venta: z.coerce.number()
})

export function NuevaCotizacion({addItem}) {
    const [showForm, setShowForm] = useState(false)
    const form = useForm<z.infer<typeof formSchema>>({ 
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: new Date().toISOString().split('T')[0],
            compra:0,
            venta:0
        }
     })
     
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const response = await post_generico({ model: 'dolar_mep', data: values })
            if (response.status === 201) {
                toast('Cotización guardada')
                addItem(response.data)
                setShowForm(false)
            } else {
                toast('Error al cargar la cotización: ' + response.data)
            }
        } catch (error) {
            if (error.response) {
                toast('Error al cargar la cotización: ' + error.response.data.detail)
            } else {
                toast('Error al cargar la cotización: ' + error.message)
            }
        }
    }
    return (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                <Button onClick={() => setShowForm(!showForm)}>Nueva cotización</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle className="font-semibold">Nueva cotización</DialogTitle>
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
                <DialogDescription>Carga de la cotización diaria</DialogDescription>
            </DialogContent>
        </Dialog>
    )
}