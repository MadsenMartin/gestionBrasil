'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Trash2, Upload, ChevronDown, ChevronUp, ArrowBigLeftDash } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { nuevo_pago, get_generico } from "@/endpoints/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Caja, Documento } from "@/types/genericos"
import { z } from "zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { ComboboxAPI, ComboboxAPIFormless } from '../comboboxes/ComboboxAPI'
import { DialogoImputacionMultiple } from '../tesoreria/dialogImputacionMultiple'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'
import { API_BASE_URL } from '@/endpoints/api'

type DialogTransferenciaProps = {
    facturaInicial: Documento
    toast: any
    trigger: React.ReactNode
    updateItem?: (item: Documento) => void
    onClose: () => void
}

const tiposPago = ['Efectivo', 'Transferencia', 'Echeq', 'Tarjeta', 'Retención']

// Define the schema for the forma de pago
const formaPagoSchema = z.object({
    id: z.string(),
    tipo: z.enum(['Efectivo', 'Transferencia', 'Echeq', 'Tarjeta', 'Retención']),
    caja: z.string().nullable(),
    monto: z.coerce.number().min(0, "El monto debe ser mayor a 0"),
    fechaPago: z.date(),
    tipoCambio: z.number().optional(),
    pdfCertificado: z.string().optional(),
    numeroCertificado: z.string().optional(),
    tipoRetencion: z.string().optional(),
})

// Define the schema for the entire form
const formSchema = z.object({
    facturas: z.array(z.number()).min(1, "Debe seleccionar al menos una factura"),
    formasPago: z.array(formaPagoSchema),
})

type FormSchema = z.infer<typeof formSchema>;

export function DialogTransferencia({ facturaInicial, toast, trigger, onClose, updateItem }: DialogTransferenciaProps) {
    const [facturas, setFacturas] = useState<Documento[]>([facturaInicial])
    const [importeTotal, setImporteTotal] = useState<number>(Number(facturaInicial.total))
    const [formasPagoColapsadas, setFormasPagoColapsadas] = useState<{ [key: string]: boolean }>({})
    const [cajas, setCajas] = useState<Caja[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [facturasVarios, setFacturasVarios] = useState<any[]>([])
    const [showImputacionDialog, setShowImputacionDialog] = useState(false)
    const [imputacionesMultiples, setImputacionesMultiples] = useState<any[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // Initialize the form with react-hook-form and zod validator
    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            facturas: [facturaInicial.id],
            formasPago: [],
        },
    });

    const setFacturasValidacion = (factura: Documento) => {
        const existe = facturas.some(f => f.id === factura.id)
        if (!existe) {
            setFacturas(prev => [...prev, factura])
        } else {
            setFacturas(prev => prev.filter(f => f.id !== factura.id))
        }
    }

    // Use fieldArray to dynamically manage the formas de pago
    const { fields: formasPagoFields, append: appendFormaPago, remove: removeFormaPago } =
        useFieldArray({
            name: "formasPago",
            control: form.control,
        });

    // Get the current form values
    const watchFormasPago = form.watch("formasPago");

    useEffect(() => {
        if (isOpen) {
            form.reset({
                facturas: [facturaInicial.id],
                formasPago: [],
            });

            setFacturas([facturaInicial])
            setImporteTotal(Number(facturaInicial.total))
            setIsProcessing(false) // Reset processing state

            const fetchCajas = async () => {
                const cajas = await get_generico('cajas', true)
                setCajas(cajas)
            }

            fetchCajas()
        }
    }, [isOpen, facturaInicial, form])

    useEffect(() => {
        const totalFacturas = facturas.reduce((sum, factura) => sum + Number(factura.total), 0)
        setImporteTotal(totalFacturas)
        form.setValue("facturas", facturas?.map(factura => factura.id));
    }, [facturas, form])

    const totalFormasPago = watchFormasPago?.reduce(
        (sum, fp) => sum + (fp.monto ? (fp.tipoCambio ?  parseFloat(String(fp.monto)) *  parseFloat(String(fp.tipoCambio)) :  parseFloat(String(fp.monto))) : 0),
        0
    ) || 0;

    const handleSubmit = form.handleSubmit(async (data) => {
        if (isProcessing) return; // Prevenir múltiples ejecuciones
        setIsProcessing(true);
        
        const mediosPago = data.formasPago.map(forma => ({
            tipo: forma.tipo,
            caja: forma.caja || "Facturas",
            fecha: forma.fechaPago.toISOString().split('T')[0],
            monto: forma.monto,
            pdf_file: forma.pdfCertificado ? forma.pdfCertificado : null,
            tipo_de_cambio: forma.tipoCambio ? forma.tipoCambio : 1,
            tipo_retencion: forma.tipoRetencion || null,
            numero_certificado: forma.numeroCertificado || null,
        }));
    
        const requestData: {
            facturas: number[];
            medios_pago: any[];
            imputaciones_multiples?: any[];
        } = {
            facturas: facturas.map(factura => factura.id),
            medios_pago: mediosPago
        };
    
        // Si hay imputaciones múltiples, incluirlas en la solicitud
        if (imputacionesMultiples.length > 0) {
            requestData.imputaciones_multiples = imputacionesMultiples;
        }
    
        try {
            const response = await nuevo_pago(requestData);
            if (response.status === 201) {
                const pago_op = response.data
                const facturaActualizada = { ...facturaInicial, imputado: true }
                updateItem(facturaActualizada)
                toast.success('Orden de pago procesada correctamente', {
                    duration: 7000,
                    position: 'top-center',
                    action: {
                        label: "Ver PDF", 
                        onClick: () => {
                            window.open(`${API_BASE_URL}${pago_op}`);}}});
                setIsOpen(false);
                onClose();
                setIsProcessing(false);
            } else {
                toast('Error al procesar la orden de pago. Por favor intente nuevamente: ' + response.data);
                setIsProcessing(false);
            }
        } catch (error) {
            console.log(error);
            
            // Manejar específicamente la respuesta de imputación múltiple
            if (error.response && error.response.status === 400 && 
                error.response.data && error.response.data.detail === 'Imputación múltiple requerida') {
                
                setFacturasVarios(error.response.data.facturas_varios);
                setShowImputacionDialog(true);
            } else {
                toast('Error al procesar la orden de pago. Por favor intente nuevamente: ' + 
                      (error.response ? error.response.data.detail : error.message));
                setIsProcessing(false);
            }
        }
    });

// Función para manejar la confirmación de imputaciones
const handleImputacionConfirm = (imputaciones) => {
    console.log("Imputaciones recibidas:", imputaciones);
    
    // Asegurarnos de que imputaciones sea un array
    if (!Array.isArray(imputaciones) || imputaciones.length === 0) {
        toast("Error: No se recibieron datos de imputación válidos");
        setShowImputacionDialog(false);
        return;
    }
    
    // Formatear las imputaciones según lo esperado por el backend
    const imputacionesFormateadas = imputaciones.map(imp => ({
        factura_id: parseInt(imp.factura_id),
        cliente_proyecto: typeof imp.cliente_proyecto === 'object' ? 
            imp.cliente_proyecto.id || imp.cliente_proyecto : imp.cliente_proyecto,
        monto: parseFloat(imp.monto)
    }));
    
    console.log("Imputaciones formateadas:", imputacionesFormateadas);
    
    // Actualizar el estado con los datos formateados
    setImputacionesMultiples(imputacionesFormateadas);
    setShowImputacionDialog(false);
    
    // Usar setTimeout para asegurarnos de que el estado se actualice antes de enviar
    setTimeout(() => {
        submitForm(imputacionesFormateadas);
    }, 0);
};

// Modificar submitForm para aceptar imputaciones como parámetro opcional
const submitForm = async (imputacionesParam = null) => {
    // Obtener los valores actuales del formulario
    const formData = form.getValues();
    
    const mediosPago = formData.formasPago.map(forma => ({
        tipo: forma.tipo,
        caja: forma.caja || "Facturas",
        fecha: forma.fechaPago.toISOString().split('T')[0],
        monto: forma.monto,
        pdf_file: forma.pdfCertificado ? forma.pdfCertificado : null,
        tipo_de_cambio: forma.tipoCambio ? forma.tipoCambio : 1,
        tipo_retencion: forma.tipoRetencion || null,
        numero_certificado: forma.numeroCertificado || null,
    }));

    // Usar imputacionesParam si se proporcionó, de lo contrario usar el estado
    const imputacionesAEnviar = imputacionesParam || imputacionesMultiples;
    
    type RequestData = {
        facturas: number[];
        medios_pago: any[];
        imputaciones_multiples?: any[];
    };

    const requestData: RequestData  = {
        facturas: facturas.map(factura => factura.id),
        medios_pago: mediosPago,
    };

    // Solo incluir imputaciones_multiples si realmente hay imputaciones
    if (imputacionesAEnviar && imputacionesAEnviar.length > 0) {
        requestData.imputaciones_multiples = imputacionesAEnviar;
        console.log("Enviando imputaciones:", requestData.imputaciones_multiples);
    }

    try {
        console.log("Datos enviados:", JSON.stringify(requestData));
        const response = await nuevo_pago(requestData);
        if (response.status === 201) {
            toast('Orden de pago procesada correctamente');
            setIsOpen(false);
        } else {
            toast('Error al procesar la orden de pago. Por favor intente nuevamente: ' + response.data);
        }
    } catch (error) {
        console.log("Error completo:", error);
        
        // Si aún necesitamos imputaciones, mostrar el diálogo nuevamente
        if (error.response && error.response.status === 400 && 
            error.response.data && error.response.data.detail === 'Imputación múltiple requerida') {
            
            setFacturasVarios(error.response.data.facturas_varios);
            setShowImputacionDialog(true);
        } else {
            toast('Error al procesar la orden de pago. Por favor intente nuevamente: ' + 
                  (error.response ? error.response.data.detail : error.message));
        }
    }
};

    const addFormaPago = () => {
        const newId = Date.now().toString();
        appendFormaPago({
            id: newId,
            tipo: 'Efectivo',
            caja: null,
            monto: 0,
            fechaPago: new Date(),
            tipoCambio: undefined,
        });

        // Create a new object to manage the collapsed state of each forma de pago
        const newFormasPagoColapsadas = { ...formasPagoColapsadas };

        // Set all existing formas de pago to collapsed
        Object.keys(newFormasPagoColapsadas).forEach(id => {
            newFormasPagoColapsadas[id] = true;
        });

        // Expand only the newly added forma de pago
        newFormasPagoColapsadas[newId] = false;

        // Update the formasPagoColapsadas state
        setFormasPagoColapsadas(newFormasPagoColapsadas);
    };

    const formatCurrency = (amount: number, currency: string) => {
        currency = currency.replace('$', "S")
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
    }

    const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            getBase64(file, (result) => {
                if (typeof result === 'string') {
                    const updatedFormasPago = [...form.getValues("formasPago")];
                    updatedFormasPago[index].pdfCertificado = result;
                    form.setValue(`formasPago.${index}.pdfCertificado`, result);
                }
            });
        }
    };

    const getBase64 = (file: File, cb: (result: string | ArrayBuffer | null) => void) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            cb(reader.result);
        };
        reader.onerror = (error) => {
            console.log('Error: ', error);
        };
    };

    const generarTituloFormaPago = (fp: z.infer<typeof formaPagoSchema>) => {
        if (fp.tipo === 'Retención') {
            return `Retención - ${fp.tipoRetencion || 'Sin especificar'}`
        }
        return `${fp.tipo} desde ${fp.caja || 'Caja no especificada'}`
    }

    const toggleColapsado = (id: string) => {
        setFormasPagoColapsadas(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[95vh]">
                <DialogHeader>
                    <DialogTitle>Nueva Orden de Pago</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full">
                    <Form {...form}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Tabs defaultValue="documentos">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                                    <TabsTrigger value="formas_de_pago">Formas de pago</TabsTrigger>
                                </TabsList>
                                <TabsContent value="documentos" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Facturas Seleccionadas</Label>
                                        {facturas?.map(factura => (
                                            <div key={factura.id} className="flex items-center justify-between">
                                                <span>{factura.proveedor} {factura.serie}{factura.tipo_documento.slice(-1)}{factura.numero}</span>
                                                <span>${Number(factura.total).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <ComboboxAPIFormless
                                        model="documentos_impagos"
                                        fieldToShow='numero'
                                        fieldToSend='id'
                                        onItemChange={(value) => setFacturasValidacion(value)}
                                        className="w-full"
                                        queryParams={`proveedor__razon_social=${facturaInicial.proveedor}`}
                                    />

                                    <div className="space-y-2">
                                        <Label htmlFor="importeTotal">Importe Total a Pagar</Label>
                                        <Input id="importeTotal" type="number" value={importeTotal.toFixed(2)} readOnly />
                                    </div>
                                </TabsContent>
                                <TabsContent value="formas_de_pago" className="space-y-4">
                                    {formasPagoFields.map((field, index) => {
                                        const fp = watchFormasPago[index];
                                        return (
                                            <div key={field.id} className="border rounded-md overflow-hidden">
                                                <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-900">
                                                    <h4 className="text-sm font-medium">{generarTituloFormaPago(fp)}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <span>${fp.monto || '0.00'}</span>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => toggleColapsado(fp.id)}>
                                                            {formasPagoColapsadas[fp.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFormaPago(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {!formasPagoColapsadas[fp.id] && (
                                                    <div className="p-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField
                                                                control={form.control}
                                                                name={`formasPago.${index}.tipo`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Tipo de Pago</FormLabel>
                                                                        <Select
                                                                            value={field.value}
                                                                            onValueChange={field.onChange}
                                                                        >
                                                                            <FormControl>
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                                                </SelectTrigger>
                                                                            </FormControl>
                                                                            <SelectContent>
                                                                                {tiposPago.map((tipo) => (
                                                                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            {fp.tipo !== 'Retención' && (

                                                                <ComboboxAPI
                                                                    id={`formasPago.${index}.caja`}
                                                                    model="cajas"
                                                                    fieldToShow="caja"
                                                                    fieldToSend="caja"
                                                                    control={form.control}
                                                                    className="w-full"
                                                                />

                                                            )}

                                                            <div className="flex items-end space-x-2">
                                                            <FormField
                                                                control={form.control}
                                                                name={`formasPago.${index}.monto`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex-grow">
                                                                        <FormLabel>
                                                                            Monto{cajas.find((caja) => caja.caja === fp.caja)?.moneda === 2 ? " en USD" : " en ARS"}
                                                                        </FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                inputMode="decimal"
                                                                                min="0"
                                                                                step="0.01"
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <HoverCard>
                                                            <HoverCardTrigger asChild>
                                                            <Button type="button" className='w-10 h-9 p-0' onClick={() => form.setValue(`formasPago.${index}.monto`,importeTotal-totalFormasPago)}> {/* Adjusted button size and added bottom margin */}
                                                                <ArrowBigLeftDash className="h-4 w-4" />
                                                            </Button>
                                                            </HoverCardTrigger>
                                                            <HoverCardContent className='w-fit'>
                                                                <p className="text-sm">Insertar restante para completar el total de los documentos</p>
                                                            </HoverCardContent>
                                                            </HoverCard>
                                                            </div>

                                                            <FormField
                                                                control={form.control}
                                                                name={`formasPago.${index}.fechaPago`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Fecha de Pago</FormLabel>
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <FormControl>
                                                                                    <Button
                                                                                        variant={"outline"}
                                                                                        className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                                                                    >
                                                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                                                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                                                                                    </Button>
                                                                                </FormControl>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                                <Calendar
                                                                                    mode="single"
                                                                                    selected={field.value}
                                                                                    onSelect={field.onChange}
                                                                                    initialFocus
                                                                                />
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        {cajas.find((caja) => caja.caja === fp.caja)?.moneda === 2 && (
                                                            <FormField
                                                                control={form.control}
                                                                name={`formasPago.${index}.tipoCambio`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Tipo de Cambio</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.01"
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        )}

                                                        {fp.tipo === 'Retención' && (
                                                            <div className="space-y-4 mt-2">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formasPago.${index}.numeroCertificado`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>Número de Certificado</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} value={field.value || ""} />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`formasPago.${index}.tipoRetencion`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>Tipo de Retención</FormLabel>
                                                                                <FormControl>
                                                                                    <Input {...field} value={field.value || ""} />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`pdfCertificado-${fp.id}`}>Certificado de Retención (PDF)</Label>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Input
                                                                            id={`pdfCertificado-${fp.id}`}
                                                                            type="file"
                                                                            accept=".pdf"
                                                                            onChange={(e) => handleFileUpload(index, e)}
                                                                            className="hidden"
                                                                        />
                                                                        <Button type="button" onClick={() => document.getElementById(`pdfCertificado-${fp.id}`)?.click()}>
                                                                            <Upload className="mr-2 h-4 w-4" /> Cargar PDF
                                                                        </Button>
                                                                        {fp.pdfCertificado && <span className="text-sm text-green-600">PDF cargado</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <Button type="button" onClick={addFormaPago} className="w-full">
                                        <Plus className="mr-2 h-4 w-4" /> Agregar Forma de Pago
                                    </Button>
                                    <div className="flex justify-between items-center p-2 bg-gray-200 dark:bg-gray-950 rounded-md">
                                        <span>Total Formas de Pago:</span>
                                        <span>{formatCurrency(totalFormasPago, 'ARS')}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-200 dark:bg-gray-950 rounded-md">
                                        <span>Total Documentos a cancelar:</span>
                                        <span>{formatCurrency(importeTotal, 'ARS')}</span>
                                    </div>
                                    {totalFormasPago !== importeTotal && (
                                        <div className="text-red-500 text-sm">
                                            El total de las formas de pago difiere del total de los documentos por {formatCurrency(importeTotal-totalFormasPago,'ARS')}.
                                        </div>

                                    )}
                                </TabsContent>
                            </Tabs>
                            <DialogFooter>
                                <Button 
                                    type="submit" 
                                    disabled={facturas.length < 1 || isProcessing}
                                >
                                    {isProcessing ? 'Procesando...' : 'Procesar Orden'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
                {/* Diálogo de imputación múltiple */}
                <DialogoImputacionMultiple 
                isOpen={showImputacionDialog}
                onClose={() => setShowImputacionDialog(false)}
                facturas={facturasVarios}
                onConfirm={handleImputacionConfirm}
            />
        </>
    )
}