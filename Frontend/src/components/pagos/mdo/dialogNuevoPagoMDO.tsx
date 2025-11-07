import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { post_generico } from "@/endpoints/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Check, MessageCircleWarning, Loader2 } from 'lucide-react';
import { ComboboxAPI } from "@/components/comboboxes/ComboboxAPI";
import { Label } from "@/components/ui/label";
import { Presupuesto } from "@/components/presupuestos/types/presupuestos";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    fecha: z.string(),
    pagos: z.array(
        z.object({
            proveedor: z.number().int().min(1, "Debe seleccionar un proveedor"),
            imputacion: z.number().int().min(1, "Debe seleccionar una imputación"),
            cliente_proyecto: z.number().int().min(1, "Debe seleccionar un cliente/proyecto"),
            presupuesto: z.number().int().nullable(),
            observacion: z.string().optional(),
            monto: z.coerce.number().optional(),
        })
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function DialogPagoMDO({ toast, trigger }) {

    // Estado para almacenar los presupuestos que se obtienen para cada linea de pago, para obtener estado y saldo
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [showFormMDO, setShowFormMDO] = useState(false);
    const [sending, setSending] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fecha: new Date().toISOString().split("T")[0],
            pagos: [{ proveedor: 0, imputacion: 0, cliente_proyecto: 0, presupuesto: null, observacion: "", monto: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "pagos",
    });

    const handleAgregarPago = () => {
        append({ proveedor: 0, imputacion: 0, cliente_proyecto: 0, presupuesto: null, observacion: "", monto: 0 });
    };

    const onSubmit = async (data: FormValues) => {
        try {
            setSending(true);
            const response = await post_generico({ model: "pago_mdo", data: data });
            if (response.status !== 201) {
                setSending(false);
                toast("Hubo un error al guardar el pago");
                return;
            }
            setSending(false);
            toast("El pago ha sido guardado exitosamente");
            setShowFormMDO(false);
            form.reset();
        } catch (error) {
            toast("Hubo un error al guardar el pago");
        }
    };

    const advertencia = (index): String | null => {
        if (form.watch(`pagos.${index}.presupuesto`) > 0) {
            const presupuesto = presupuestos[index]
            if ((form.watch(`pagos.${index}.monto`) > 0) && form.watch(`pagos.${index}.monto`) > Number(presupuesto.saldo)) {
                if (presupuesto.aprobado != "Aprobado"){
                    return "El presupuesto no está aprobado y el monto supera el saldo del presupuesto por " + String(formatCurrency(Number(form.watch(`pagos.${index}.monto`)) - Number(presupuesto.saldo)))
                }
                return "El monto supera el saldo del presupuesto por " + String(formatCurrency(Number(form.watch(`pagos.${index}.monto`)) - Number(presupuesto.saldo)))
            }
            if (presupuesto.aprobado != "Aprobado") {
                return "El presupuesto no está aprobado"
            }
        }
        return null
    }

    const formatCurrency = (monto) => {
        return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto);
    }

    const estado_ppto = (index): String => {
        const presupuesto_id = form.watch(`pagos.${index}.presupuesto`)
        if (presupuesto_id === null) {
            console.log("presupuesto_id es null")
            return ""
        }
        const presupuesto = presupuestos[index]
        return presupuesto?.estado + " " + formatCurrency(presupuesto.saldo)
    }

    const ppto_activo = (index) => {
        return form.watch(`pagos.${index}.cliente_proyecto`) > 0 && form.watch(`pagos.${index}.proveedor`) > 0 && form.watch(`pagos.${index}.imputacion`) > 0
    }

    return (
        <Dialog open={showFormMDO} onOpenChange={setShowFormMDO}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-fit">
                <DialogHeader>
                    <DialogTitle>Nuevo Pago MDO</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form id="nuevo_pago_mdo" onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fecha"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha</FormLabel>
                                            <FormControl>
                                                <Input className="max-w-36" type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <FormLabel>Pagos</FormLabel>
                                    <ScrollArea className="h-[500px]">
                                    <div>
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="px-2 py-1 text-left">Proveedor</th>
                                                    <th className="px-2 py-1 text-left">Imputación</th>
                                                    <th className="px-2 py-1 text-left">Obra</th>
                                                    <th className="px-2 py-1 text-left">Presupuesto</th>
                                                    <th className="px-2 py-1 text-left">Estado</th>
                                                    <th className="px-2 py-1 text-left">Observaciones</th>
                                                    <th className="px-2 py-1 text-left">Monto</th>
                                                    <th className="px-2 py-1"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fields.map((field, index) => (
                                                    <tr key={field.id} className="border-b">
                                                        <td className="px-2 py-1">
                                                            <ComboboxAPI
                                                                id={`pagos.${index}.proveedor`}
                                                                model="proveedores"
                                                                fieldToShow="nombre"
                                                                fieldToSend="id"
                                                                control={form.control}
                                                                className="w-full"
                                                                formLabel={false}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1">

                                                            <ComboboxAPI
                                                                id={`pagos.${index}.imputacion`}
                                                                model="imputaciones"
                                                                fieldToShow="imputacion"
                                                                fieldToSend="id"
                                                                control={form.control}
                                                                formLabel={false}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            <ComboboxAPI
                                                                id={`pagos.${index}.cliente_proyecto`}
                                                                model="clientes_proyectos"
                                                                fieldToShow="cliente_proyecto"
                                                                fieldToSend="id"
                                                                control={form.control}
                                                                formLabel={false}
                                                                className="w-full"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            {ppto_activo(index) && (
                                                                <ComboboxAPI
                                                                    id={`pagos.${index}.presupuesto`}
                                                                    model="presupuestos"
                                                                    fieldToShow="nombre"
                                                                    fieldToSend="id"
                                                                    control={form.control}
                                                                    className="max-w-lg truncate"
                                                                    omitirResults="true"
                                                                    formLabel={false}
                                                                    queryParams={`proveedor_id=${form.watch(`pagos.${index}.proveedor`)}&cliente_proyecto_id=${form.watch(`pagos.${index}.cliente_proyecto`)}`}
                                                                    disabled={form.watch(`pagos.${index}.cliente_proyecto`) === 0}
                                                                    onItemChange={(item) => { // De esta forma almaceno los presupuestos que se fetchean para cada linea, para luego tomar sus datos
                                                                        const newPresupuestos = [...presupuestos];
                                                                        newPresupuestos[index] = item;
                                                                        setPresupuestos(newPresupuestos);
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            {form.watch(`pagos.${index}.presupuesto`) > 0 && (
                                                                <Label>{estado_ppto(index)}</Label>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-1 min-w-52">
                                                            <FormField
                                                                control={form.control}
                                                                name={`pagos.${index}.observacion`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="text"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1 min-w-36">
                                                            <FormField
                                                                control={form.control}
                                                                name={`pagos.${index}.monto`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(e.target.value)}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => remove(index)}
                                                                disabled={fields.length === 1}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                        <td>
                                                            {advertencia(index) ?
                                                                <HoverCard>
                                                                    <HoverCardTrigger asChild>
                                                                        <MessageCircleWarning />
                                                                    </HoverCardTrigger>
                                                                    <HoverCardContent>
                                                                        <div className="flex flex-col space-y-2">
                                                                            <span className="font-medium">{advertencia(index)}</span>
                                                                        </div>
                                                                    </HoverCardContent>
                                                                </HoverCard>
                                                                : <Check />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </ScrollArea>
                                    <Button type="button" onClick={handleAgregarPago} className="mt-2">
                                        Agregar Pago
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button disabled={sending} type="submit" className="ml-auto">
                                    Guardar
                                    {sending && <Loader2 className="animate-spin" size={16} />}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}