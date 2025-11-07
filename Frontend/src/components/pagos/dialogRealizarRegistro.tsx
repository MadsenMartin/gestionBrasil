import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "../ui/dialog";
import * as z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { realizar_registro } from "@/endpoints/api";
import { Registro } from "@/types/genericos";

const formSchema = z.object({
    fecha: z.string().min(1, "Debe ingresar una fecha"),
    id: z.number()
});

export function DialogRealizarRegistro({ registro, toast, updateItem, trigger }: { registro: Registro, toast: any, updateItem: any, trigger?: JSX.Element }) {
    const [showForm, setShowForm] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: registro?.fecha_reg,
            id: registro?.id
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const response = await realizar_registro(values.id, values.fecha);
        if (response.status != 200) {
            console.error("Error al realizar registro:", response);
            toast("Error al realizar registro: " + response.data.message)
            return;
        } else {
            toast("Registro realizado correctamente")
            updateItem(response.data)
            setShowForm(false);
        }
    }

    return (
        <Dialog
            open={showForm}
            onOpenChange={setShowForm}
        >
            <DialogTrigger asChild>
                {trigger
                    ? trigger
                    : <Button variant="ghost" onClick={() => setShowForm(true)}>Realizar</Button>
                }
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="form-dialog-title">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-center">Realizar Registro</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={e => {
                        e.stopPropagation()
                        return form.handleSubmit(onSubmit)(e)
                    }}>
                        <FormField
                            control={form.control}
                            name="fecha"
                            render={({ field }) => {
                                return <FormItem>
                                    <FormLabel >Ingrese fecha de pago final</FormLabel>
                                    <FormControl>
                                        <Input type="date" placeholder="Fecha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            }}
                        />
                        <FormField
                            control={form.control}
                            name="id"
                            render={({ field }) => {
                                return <FormItem>
                                    <FormControl>
                                        <Input type="hidden" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            }}
                        />
                        <DialogDescription>
                            <Label className="text-sm text-muted-foreground pt-2">Esta fecha se asignará al registro</Label>
                        </DialogDescription>
                        <DialogFooter className="pt-4">
                            <Button onClick={(event) => { event.preventDefault(); setShowForm(false) }} variant="outline">Cancelar</Button>
                            <Button type="submit">Confirmar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}