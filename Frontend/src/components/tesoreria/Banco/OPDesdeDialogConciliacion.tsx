// Este diálogo debe hacer lo más resumida posible la creación de una nueva OP a partir de un movimiento sacado del archivo CSV del banco.
// Podría llevarse al usuario por el proceso de creación, listandole primero las facturas que no tienen OP asociada y permitiendole seleccionarlas.
// Además, debe permitir al usuario ingresar un monto de retención de IIGG y cargar el certificado correspondiente.
// Con estos datos ya el backend debe poder generar automáticamente la OP y RETH asociada/s a la/s factura/s seleccionada/s.

import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { get_generico_params, nuevo_pago } from "@/endpoints/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Movimiento {
    id: number
    cod_concepto: string
    concepto: string
    nro_cheque: string
    debito: string
    credito: string
    nombre: string
    nro_doc: string
    fecha: string
    tipo: string
    sub_tipo: string
    ya_cargado: boolean
    iva?: string
}

interface NuevaOPDialogDesdeConciliacionProps {
    toast: any
    trigger: JSX.Element
    movimiento: Movimiento
    onSuccess: (movimiento: Movimiento) => void
}

const medioPagoSchema = z.object({
    tipo: z.string(),
    caja: z.string(),
    monto: z.coerce.number(),
    fecha: z.string(),
    tipo_retencion: z.string().nullable().optional(),
    tipo_de_cambio: z.number().nullable().optional(),
    numero_certificado: z.string().nullable().optional(),
});

const formSchema = z.object({
    facturas: z.array(z.number()).min(1,"Debe seleccionar al menos una factura"),
    medios_pago: z.array(medioPagoSchema),
    pdf_file: z.instanceof(File).nullable(),
});

export function NuevaOPDialogDesdeConciliacion({ toast, trigger, movimiento, onSuccess }: NuevaOPDialogDesdeConciliacionProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [documentosDisponibles, setDocumentosDisponibles] = useState<any[]>([])
    const [loadingDocumentos, setLoadingDocumentos] = useState<boolean>(true)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            facturas: [],
            medios_pago: [{
                tipo: "Transferencia",
                caja: "Banco ICBC",
                monto: -parseFloat(movimiento.debito?.replace(',', '.')), // - porque la APIView cambiará el signo
                fecha: movimiento.fecha.split('/').reverse().join('-'),
                tipo_de_cambio: 1.00,
                tipo_retencion: null,
                numero_certificado: ''
            },{
                tipo: "Retención",
                caja: "Facturas",
                monto: 0,
                fecha: movimiento.fecha.split('/').reverse().join('-'),
                tipo_retencion: "IIGG",
                numero_certificado: '',
                tipo_de_cambio: 1.00,
            }],
        }
    })

    const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

    useEffect(() => {
        const fetchDocumentosImpagos = async () => {
            try {
                const response = await get_generico_params({ model: 'documentos_impagos', params: `proveedor__cnpj=${movimiento.nro_doc}` })
                setDocumentosDisponibles(response.data.results)
                setLoadingDocumentos(false)
            } catch (error) {
                console.error("Error al obtener facturas:", error)
                toast.error("Error al cargar facturas disponibles")
            }
        }

        if (showDialog) {
            fetchDocumentosImpagos()
        }
    }, [showDialog, movimiento.nro_doc, toast])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (values.medios_pago[1].monto == 0 || values.medios_pago[1].numero_certificado === '') {
                values.medios_pago.pop()
            }

            const response = await nuevo_pago(values)
            if (response.status === 201) {
                toast.success('Orden de Pago creada correctamente')
                onSuccess(movimiento)
                setShowDialog(false)
            }
        }
        catch (error) {
            toast.error('Error al crear la OP: ' + error)
        }
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                {loadingDocumentos ? <p>Cargando facturas...</p> :
                    documentosDisponibles.length === 0 ? <p>No hay facturas disponibles para este proveedor</p> :
                        <>
                            <DialogTitle>Nueva Orden de Pago</DialogTitle>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <div className="space-y-4">

                                        <FormField
                                            control={form.control}
                                            name="medios_pago.0.monto"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Monto de la OP</FormLabel>
                                                    <FormControl>
                                                        <Label> {formatCurrency(field.value, 'ARS')}</Label>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="facturas"
                                            render={() => (
                                                <FormItem>
                                                    <FormLabel>Facturas</FormLabel>
                                                    <div className="space-y-2">
                                                        {documentosDisponibles.map((factura) => (
                                                            <div key={factura.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`factura-${factura.id}`}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentFacturas = form.getValues("facturas")
                                                                        if (checked) {
                                                                            form.setValue("facturas", [...currentFacturas, factura.id])
                                                                        } else {
                                                                            form.setValue(
                                                                                "facturas",
                                                                                currentFacturas.filter((id) => id !== factura.id) as [number, ...number[]],
                                                                            )
                                                                        }
                                                                    }}
                                                                />
                                                                <label htmlFor={`factura-${factura.id}`}>
                                                                    {factura.proveedor} {factura.tipo_documento} {factura.serie}-{factura.numero} - {formatCurrency(factura.total, 'ARS')}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="medios_pago.1.fecha"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fecha del certificado de retención</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="medios_pago.1.numero_certificado"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número de certificado de retención</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="medios_pago.1.monto"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Monto de la retención</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" inputMode='decimal' {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <FormDescription>
                                                        Monto positivo para retenciones hechas a 3ros
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="pdf_file"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Certificado de retención</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={(e) => {
                                                                field.onChange(e.target.files?.[0])
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button type="submit" className="w-full">Enviar</Button>

                                    </div>
                                </form>
                            </Form>

                            <DialogDescription>
                                Nueva OP a partir del movimiento seleccionado.
                            </DialogDescription>

                        </>

                }
            </DialogContent>

        </Dialog>
    )
}