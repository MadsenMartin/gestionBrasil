import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { format } from "date-fns"
import { Label } from '@/components/ui/label';
import { mov_entre_cuentas } from '@/endpoints/api';
import { DialogDescription, DialogTrigger } from '@radix-ui/react-dialog';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';
import { useState } from 'react';

const formSchema = z.object({
    fecha: z.string().min(1, "Seleccione una fecha"),
    caja_origen: z.string().min(1, "Seleccione una caja"),
    caja_destino: z.string().min(1, "Seleccione una caja"),
    monto: z.coerce.number().min(1, "Ingrese un monto"),
    observacion: z.string().optional(),
    tipo_de_cambio: z.coerce.number().optional()
})

export function DialogMovEntreCuentas({ toast, trigger }) {

    const [showForm, setShowForm] = useState(false)
    // Estado para guardar la moneda de la caja origen y destino, de forma de poder validar si se debe ingresar el tipo de cambio
    const [monedaOrigen, setMonedaOrigen] = useState(0)
    const [monedaDestino, setMonedaDestino] = useState(0)
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: format(new Date(), "yyyy-MM-dd").toString(),
            caja_origen: '',
            caja_destino: '',
            monto: 0,
            observacion: '',
            tipo_de_cambio: 1
        }
    })


    const onSubmit = async (values) => {
        try {

            const response = await mov_entre_cuentas(values)
            if (response.status != 201) {
                toast("Error al crear el movimiento entre cuentas: " + response.data?.detail)
                return
            }
            form.reset()
            toast("Movimiento entre cuentas creado exitosamente")
            setShowForm(false)
        } catch (error) {
            console.error('Error:', error)
        }

    }

    return (
        <Dialog
            open={showForm}
            onOpenChange={setShowForm}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogTitle>Movimiento entre cuentas</DialogTitle>
                <Form {...form}>
                    <form onSubmit={e => {
                        e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
                        return form.handleSubmit(onSubmit)(e);
                    }}>
                        <div className="p-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="caja">Cuenta origen</Label>
                                    <ComboboxAPI
                                        id="caja_origen"
                                        model="cajas"
                                        fieldToShow="caja"
                                        fieldToSend="caja"
                                        control={form.control}
                                        className="w-full"
                                        formLabel={false}
                                        onItemChange={(item) => item ? setMonedaOrigen(item.moneda): setMonedaOrigen(0)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cuenta_destino">Cuenta destino</Label>
                                    <ComboboxAPI
                                        id="caja_destino"
                                        model="cajas"
                                        fieldToShow="caja"
                                        fieldToSend="caja"
                                        control={form.control}
                                        className="w-full"
                                        formLabel={false}
                                        onItemChange={(item) => item ? setMonedaDestino(item.moneda): setMonedaDestino(0)}
                                    />
                                </div>
                                <div className="space-y-2">
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
                                {monedaOrigen != monedaDestino && (
                                    <div className="space-y-2">
                                        <FormField
                                            control={form.control}
                                            name="tipo_de_cambio"
                                            render={({ field }) => {
                                                return <FormItem>
                                                    <FormLabel>Tipo de cambio</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder='Tipo de cambio' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="observacion"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Observacion</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder='Observacion' {...field} />
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
                                <Button type="submit">Guardar</Button>
                            </div>
                            <DialogDescription>
                                <Label className='font-normal'>
                                    Esta acción creará un registro en ambas cajas
                                </Label>
                            </DialogDescription>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

    )
}

