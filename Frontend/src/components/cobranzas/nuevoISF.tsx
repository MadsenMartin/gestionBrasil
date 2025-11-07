import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from "date-fns"
import { post_generico } from '@/endpoints/api';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

const formSchema = z.object({
    caja: z.coerce.number().min(1, 'Este campo es requerido'),
    cliente_proyecto: z.coerce.number().min(1, 'Este campo es requerido'),
    imputacion: z.coerce.number().min(1, 'Este campo es requerido'),
    monto_gasto_ingreso_neto: z.coerce.number().min(1, 'Este campo es requerido'),
    iva_gasto_ingreso: z.coerce.number(),
    observacion: z.string(),
    moneda: z.coerce.number().min(1, 'Este campo es requerido'),
    tipo_de_cambio: z.coerce.number().optional(),
    fecha_reg: z.string().min(1, "Este campo es requerido"),
})


export function DialogNuevoISF({ toast, addItem, trigger }) {
    const [showForm, setShowForm] = useState(false);
    const [moneda, setMoneda] = useState(1)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            caja: 0,
            cliente_proyecto: 0,
            monto_gasto_ingreso_neto: 0,
            iva_gasto_ingreso: 0,
            imputacion: 0,
            observacion: '',
            moneda: 1,
            tipo_de_cambio: 1,
            fecha_reg: format(new Date(), "yyyy-MM-dd").toString()
        },
    });

    const obtenerAnoMes = (fecha: string): string => {
        const [year, month] = fecha.split('-');
        return `${year}${month}`;
    };

    const onSubmit = async (values) => {
        values.tipo_reg = "ISF"
        values.añomes_imputacion = obtenerAnoMes(values.fecha_reg)
        values.monto_op_rec = (Number(values.monto_gasto_ingreso_neto) + Number(values.iva_gasto_ingreso)).toFixed(2)
        try {
            const response = await post_generico({ model: "registros", data: values })
            if (response.status !== 201) {
                toast('Error al registrar el cobro de certificado');
                return;
            }
            form.reset()
            toast("Cobro de certificado registrado exitosamente")
            addItem(response.data)
            setShowForm(false)
        } catch (error) {
            console.error('Error:', error)
            toast("Error al registrar el cobro de certificado: " + error)
        }

    }

    const onClose = () => {
        if (showForm) {
            form.reset()
            setShowForm(false)
        } else {
            setShowForm(true)
        }
    }

    return (
        <Dialog
            open={showForm}
            onOpenChange={onClose}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Nuevo cobro</DialogTitle>
                <DialogDescription>Crear nuevo registro ISF</DialogDescription>
                <Form {...form}>
                    <form onSubmit={e => {
                        e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
                        return form.handleSubmit(onSubmit)(e);
                    }}>
                        <div className="p-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="fecha_reg"
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
                                        id="caja"
                                        model="cajas"
                                        fieldToShow="caja"
                                        fieldToSend="id"
                                        control={form.control}
                                        className="w-full"
                                        onItemChange={(item) => {
                                            if (item) {
                                                setMoneda(item.moneda);
                                                form.setValue('moneda', item.moneda);
                                            } else {
                                                setMoneda(0);
                                                form.setValue('moneda', 0);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <ComboboxAPI
                                        id="cliente_proyecto"
                                        model="clientes_proyectos"
                                        fieldToShow="cliente_proyecto"
                                        fieldToSend="id"
                                        control={form.control}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <ComboboxAPI
                                        id="imputacion"
                                        model="imputaciones"
                                        fieldToShow="imputacion"
                                        fieldToSend="id"
                                        control={form.control}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="monto_gasto_ingreso_neto"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Neto</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode='decimal' placeholder='Neto' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="iva_gasto_ingreso"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>IVA</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode='decimal' placeholder='IVA' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        }}
                                    />
                                </div>
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
                                {moneda > 1 && (
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
                                <Button type="submit">Guardar</Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}