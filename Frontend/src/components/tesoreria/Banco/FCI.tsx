import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { post_generico } from "@/endpoints/api";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
    tipo: z.enum(["suscripcion", "rescate"], { required_error: "Campo requerido" }),
    fecha: z.string().min(1, "Seleccione una fecha"),
    monto: z.coerce.number().positive("El monto debe ser positivo"),
})

export function DialogoFCI({ trigger, toast, addItem }) {
    const [showDialog, setShowDialog] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "suscripcion",
            fecha: new Date().toISOString().split('T')[0],
            monto: 0,
        }
    })

    const onSubmit = async (values) => {
        try {
            const response = await post_generico({ model: "fci", data: values })
            if (response.status != 201) {
                toast.error("Error al crear el movimiento: " + response.data?.detail)
                return
            }
            if (response.status == 201) {
                addItem(response.data[0])
                addItem(response.data[1])
                form.reset()
                toast.success("Movimiento creado exitosamente")
                setShowDialog(false)
            }
        } catch (error) {
            toast.error("Error al crear el movimiento: " + error.message)
        }
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>

                <DialogTitle>Fondo Común de Inversión</DialogTitle>

                <DialogDescription>
                    Crear nuevo rescate/suscripción del fondo
                </DialogDescription>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 p-4">
                        <FormField
                            control={form.control}
                            name="tipo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="suscripcion">Suscripción</SelectItem>
                                            <SelectItem value="rescate">Rescate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fecha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="border rounded p-2" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="monto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} className="border rounded p-2" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" className="w-full">
                                Enviar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}