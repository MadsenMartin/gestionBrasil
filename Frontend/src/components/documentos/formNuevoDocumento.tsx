import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { get_generico_pk, patch_generico, post_generico } from '@/endpoints/api'
import { SelectProveedorConBoton } from '../general/proveedores/selectProveedorConBoton'
import { ComboboxAPI } from '../comboboxes/ComboboxAPI'
import { Separator } from '../ui/separator'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { formSchema } from '../cruds/schemas/documento'
import { ComboboxModels } from '../comboboxes/comboboxModels'
import { Checkbox } from '../ui/checkbox'

type FormNuevoDocumentoProps = {
    addDocumento: any
    updateDocumento?: any
    toast: any
    setCurrentAdjunto: any
    setShowForm: any
    showForm?: any
    data?: any
}

export const comboboxField = () => z.number().int().nullable()

export function FormNuevoDocumento({ setCurrentAdjunto, addDocumento, updateDocumento, toast, setShowForm, showForm, data }: FormNuevoDocumentoProps) {
    const [fileName, setFileName] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [defaultValues, setDefaultValues] = useState<z.infer<typeof formSchema>>() // Para cargar los valores iniciales en el formulario, que se obtienen de la API
    const [sending, setSending] = useState(false) // Para deshabilitar el botón de enviar mientras se envía el formulario
    const date = new Date()

    // Obtengo los valores iniciales de la API y los guardo en el estado para luego asignarlos al formulario
    useEffect(() => {
        const fetchData = async () => {
            if (data && open) {
                const response = await get_generico_pk({ model: 'documentos', id: data.id })
                if (response.status === 200) {
                    setDefaultValues({
                        tipo_documento: response.data.tipo_documento || null,
                        fecha_documento: response.data.fecha_documento || date.toISOString().split('T')[0],
                        serie: response.data.serie || null,
                        numero: response.data.numero || null,
                        chave_de_acesso: response.data.chave_de_acesso || null,
                        imputacion: response.data.imputacion || null,
                        proveedor: response.data.proveedor || null,
                        receptor: response.data.receptor || null,
                        cliente_proyecto: response.data.cliente_proyecto || null,
                        añomes_imputacion_gasto: response.data.añomes_imputacion_gasto || (date.getFullYear() * 100 + (date.getMonth()+1)),
                        añomes_imputacion_contable: response.data.añomes_imputacion_contable || (date.getFullYear() * 100 + (date.getMonth()+1)),
                        unidad_de_negocio: response.data.unidad_de_negocio || null,
                        concepto: response.data.concepto || '',
                        comentario: response.data.comentario || '',
                        total: response.data.total || 0,
                        impuestos_retidos: response.data.impuestos_retidos || 0,
                        moneda: response.data.moneda || 1,
                        municipio: response.data.municipio || null,
                        archivo: response.data.archivo || null,

                    })
                }
            }
        }
        fetchData()
    }, [open, data])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues || {
            tipo_documento: null,
            fecha_documento: date.toISOString().split('T')[0],
            serie: 0,
            numero: 0,
            imputacion: null,
            proveedor: null,
            receptor: null,
            cliente_proyecto: null,
            añomes_imputacion_gasto: (date.getFullYear() * 100 + (date.getMonth()+1)),
            añomes_imputacion_contable: (date.getFullYear() * 100 + (date.getMonth()+1)),
            unidad_de_negocio: null,
            concepto: '',
            comentario: '',
            total: 0,
            impuestos_retidos: 0,
            moneda: 1,
            municipio: null,
            archivo: null,
        },
    })

    // Reseteo el formulario cuando se cargan los valores iniciales, sino no se cargan
    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues)
        }
    }, [defaultValues, form])

    useEffect(() => {
        if (!showForm) {
            setCurrentAdjunto(null)
            setFile(null)
            setFileName(null)
            form.reset()
        }
    }, [showForm])

    const post = async (values: any) => {
        const formData = new FormData();
        formData.append('archivo', file);

        // Agrega solo los campos que tienen valor definido
        Object.keys(values).forEach((key) => {
            const value = values[key];
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, value);
            }
        });

        const response = await post_generico({
            model: 'documentos',
            data: formData
        });
        return response
    }

    const patch = async (values: any) => {
        const diff = {};
        console.log("values", values)
        console.log("defaultValues", defaultValues)
        for (const key in values) {
            if (values[key] !== defaultValues[key] && key !== 'archivo') {
                diff[key] = values[key];
            }
        }
        console.log("diff", diff)
        const response = await patch_generico({ model: 'documentos', id: data.id, dif: diff })
        return response
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setSending(true)
            const response = data ? await patch(values) : await post(values)
            setSending(false)
            if (response.status === 201) {
                addDocumento(response.data)
                setShowForm(false);
                toast("Documento cargado correctamente.");
                return
            }
            if (response.status === 200) {
                updateDocumento(response.data)
                setShowForm(false);
                toast("Documento actualizado correctamente.");
            } else {
                throw new Error('Error en la respuesta del servidor.');
            }
        } catch (error) {
            console.error('Error uploading documento:', error);
            setSending(false)
            const getErrorMessage = (errorData: any): string => {
                if (typeof errorData === 'string') return errorData;
                if (Array.isArray(errorData)) return errorData[0];
                if (typeof errorData === 'object' && errorData !== null) {
                    const firstKey = Object.keys(errorData)[0];
                    const firstValue = errorData[firstKey];
                    return Array.isArray(firstValue) ? firstValue[0] : firstValue;
                }
                return "Error desconocido";
            };
            const errorMessage = error.response?.data ? getErrorMessage(error.response.data) : "Error de conexión";
            toast("Error al cargar el documento: " + errorMessage);
        }
    };

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const fileURL = URL.createObjectURL(file)
            setFileName(file.name)
            setCurrentAdjunto(fileURL)
            setFile(file)
        }
    }, [])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <ScrollArea className={cn("w-full rounded-md border p-4", file ? "h-[80vh]" : "h-[80vh]")}>
                    {!data && <FormField
                        control={form.control}
                        name="archivo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Archivo</FormLabel>
                                <FormControl>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                </svg>
                                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click para cargar</span> o arrastrar y soltar acá</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 10MB)</p>
                                            </div>
                                            <Input
                                                id="dropzone-file"
                                                type="file"
                                                className="hidden"
                                                accept=".pdf"
                                                onChange={(e) => {
                                                    field.onChange(e.target.files?.[0]);
                                                    handleFileChange(e);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </FormControl>
                                {fileName && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        Archivo seleccionado: {fileName}
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />}
                    <div className="grid grid-cols-2 gap-1">
                        <ComboboxAPI
                            id="tipo_documento"
                            control={form.control}
                            fieldToShow="tipo_documento"
                            fieldToSend="id"
                            model="tipos_documento"
                            disabled={false}
                        />
                        <FormField
                            control={form.control}
                            name="fecha_documento"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Documento</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <SelectProveedorConBoton
                            toast={toast}
                            buttonStr={"+"}
                            id="proveedor"
                            control={form.control}
                            fieldToShow="nombre"
                            fieldToSend="id"
                            value={data?.proveedor}
                            initialLabel={data?.proveedor || null}
                        />
                        <ComboboxAPI
                            id="receptor"
                            control={form.control}
                            fieldToShow="nombre"
                            fieldToSend="id"
                            model="receptores"
                            className='w-full'
                            disabled={false}
                            value={data?.receptor}
                            initialLabel={data?.receptor ? data?.receptor : null}
                        />
                        <FormField
                            control={form.control}
                            name="serie"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serie</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numero"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                        <FormField
                            control={form.control}
                            name="tiene_cno"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tiene CNO</FormLabel>
                                    <FormControl>
                                        <Checkbox                                     
                                            checked={field.value}
                                            onCheckedChange={field.onChange} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    <Separator className="my-1" />
                    <div className="grid grid-cols-2 gap-1">
                        <FormField
                            control={form.control}
                            name="total"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total</FormLabel>
                                    <FormControl>
                                        <Input
                                         type="number" 
                                         inputMode='decimal' 
                                         {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="impuestos_retidos"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Impuestos retidos</FormLabel>
                                    <FormControl>
                                        <Input type="number" inputMode='decimal' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    <ComboboxModels
                            id="moneda"
                            control={form.control}
                            model="moneda"
                            value={data?.moneda}
                            initialLabel={data?.moneda_display}
                    />
                    <ComboboxModels
                            id="municipio"
                            control={form.control}
                            model="municipio"
                            value={data?.municipio}
                            initialLabel={data?.municipio_display}
                    />

                    </div>

                    <Separator className="my-1" />
                    <div className="grid grid-cols-2 gap-1">
                        <FormField
                            control={form.control}
                            name="añomes_imputacion_gasto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Año/Mes Imputación Gasto</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="añomes_imputacion_contable"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Año/Mes Imputación Contable</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ComboboxAPI
                            id="unidad_de_negocio"
                            control={form.control}
                            fieldToShow="unidad_de_negocio"
                            fieldToSend="id"
                            model="unidades_de_negocio"
                            value={data?.unidad_de_negocio}
                            initialLabel={data?.unidad_de_negocio}
                        />
                        <ComboboxAPI
                            id="cliente_proyecto"
                            control={form.control}
                            fieldToShow="cliente_proyecto"
                            fieldToSend="id"
                            model="clientes_proyectos"
                            value={data?.cliente_proyecto}
                            initialLabel={data?.cliente_proyecto}
                        />
                        <ComboboxAPI
                            id="imputacion"
                            control={form.control}
                            fieldToShow="imputacion"
                            fieldToSend="id"
                            model="imputaciones"
                            value={data?.imputacion}
                            initialLabel={data?.imputacion}
                        />
                        <FormField
                            control={form.control}
                            name="concepto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="comentario"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comentario</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </ScrollArea>

                <Button type="submit" className="w-full" disabled={sending}>Enviar{sending && <Loader2 className="animate-spin ml-2 h-4 w-4" />}</Button>
            </form>
        </Form>
    )
}
