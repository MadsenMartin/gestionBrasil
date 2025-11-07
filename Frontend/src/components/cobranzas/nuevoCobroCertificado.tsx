import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from "date-fns"
import { nuevo_cobro_certificado } from '@/endpoints/api';
import { Certificado } from '@/components/cobranzas/types';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

const formSchema = z.object({
    caja: z.string().min(1, "Este campo es requerido").max(50, 'Máximo 50 caracteres'),
    cliente_proyecto: z.string().min(1, "Este campo es requerido").max(50, 'Máximo 50 caracteres'),
    certificado: z.number().nullable().optional(),
    documento: z.number().nullable().optional(),
    monto: z.coerce.number().min(1, 'Este campo es requerido'),
    observacion: z.string(),
    moneda: z.coerce.number().min(1, 'Este campo es requerido'),
    tipo_de_cambio: z.coerce.number().optional(),
    fecha: z.string().min(1, "Este campo es requerido"),
})


export function DialogNuevoCobro({ toast, addItem, trigger }) {
    const [showForm, setShowForm] = useState(false);
    const [moneda, setMoneda] = useState(1)
    const [certificado, setCertificado] = useState<Certificado>(null)
    const [obra, setObra] = useState("")
    const [saldoFinal, setSaldoFinal] = useState(0)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            caja: '',
            cliente_proyecto: '',
            certificado: null,
            documento: null,
            monto: 0,
            observacion: '',
            moneda: 1,
            tipo_de_cambio: 1,
            fecha: format(new Date(), "yyyy-MM-dd").toString()
        },
    });

    const onSubmit = async (values) => {
        try {
            const response = await nuevo_cobro_certificado(values)
            if (response.status !== 201) {
                toast('Error al registrar el cobro de certificado');
                return;
            }
            form.reset()
            toast("Cobro de certificado registrado exitosamente")
            addItem(response.data)
            setObra("")
            setCertificado(null)
            setShowForm(false)
        } catch (error) {
            console.error('Error:', error)
            toast("Error al registrar el cobro de certificado: " + error)
        }

    }

    const montoCobro = form.watch('monto')
    const tipoCambio = form.watch('tipo_de_cambio')

    useEffect(() => {
        const saldoCertificado = () => {
            if (certificado === null) {
                setSaldoFinal(0)
                return
            }
            const saldo = certificado?.saldo
            setSaldoFinal(Number(saldo) - (montoCobro * tipoCambio))
        }
        saldoCertificado()
    }, [certificado, montoCobro, tipoCambio])

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
    }

    const onClose = () => {
        if (showForm) {
            form.reset()
            setShowForm(false)
        } else {
            setShowForm(true)
        }
        setObra("")
        setCertificado(null)
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
                <DialogDescription>Crear nuevo registro REC</DialogDescription>
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
                                        id="caja"
                                        model="cajas"
                                        fieldToShow="caja"
                                        fieldToSend="caja"
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
                                        fieldToSend="cliente_proyecto"
                                        control={form.control}
                                        className="w-full"
                                        onValueChange={(value) => setObra(value.toString())}
                                    />
                                </div>
                                {obra != "" && (
                                    <div className="space-y-2">
                                        <ComboboxAPI
                                            id="certificado"
                                            model="certificados"
                                            fieldToShow="numero"
                                            fieldToSend="id"
                                            queryParams={'cliente_proyecto__cliente_proyecto=' + form.watch('cliente_proyecto')}
                                            control={form.control}
                                            className="w-full"
                                            disabled={obra===""}
                                            onItemChange={(item) => setCertificado(item)}
                                        />
                                    </div>
                                )}
                                {obra != "" && (
                                    <div className="space-y-2">
                                        <ComboboxAPI
                                            id="documento"
                                            model="documentos"
                                            fieldToShow="numero"
                                            fieldToSend="id"
                                            queryParams={'cliente_proyecto__cliente_proyecto=' + form.watch('cliente_proyecto') + '&imputado=False' + '&proveedor__razon_social=Quinto Diseño SRL'}
                                            control={form.control}
                                            className="w-full"
                                            disabled={obra===""}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="monto"
                                        render={({ field }) => {
                                            return <FormItem>
                                                <FormLabel>Monto</FormLabel>
                                                <FormControl>
                                                    <Input type="number" inputMode='decimal' placeholder='Monto' {...field} />
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
                                {certificado && (
                                    <>
                                        {saldoFinal > 0 && (
                                            <div className="space-y-2">
                                                <Label>Saldo final del certificado: {formatCurrency(saldoFinal)}</Label>
                                            </div>
                                        )}
                                        {saldoFinal < 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-red-600">El monto a cobrar supera el saldo del certificado por {formatCurrency(-saldoFinal)}</Label>
                                            </div>
                                        )}
                                    </>
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