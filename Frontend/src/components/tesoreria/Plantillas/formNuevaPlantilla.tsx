import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { comboboxField } from '@/components/documentos/formNuevoDocumento'
import { patch_generico, post_generico } from '@/endpoints/api'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ComboboxAPI } from '@/components/comboboxes/ComboboxAPI'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'

const formSchema = z.object({
    nombre: z.string().min(1, { message: 'Campo requerido' }),
    tipo_reg: z.string().min(1, { message: 'Campo requerido' }),
    unidad_de_negocio: comboboxField(),
    cliente_proyecto: comboboxField(),
    imputacion: comboboxField(),
    proveedor: comboboxField(),
    observacion: z.string().optional(),
})

interface NuevaPlantillaRegistroProps {
    toast: Function
    addPlantilla: Function
    setShowForm: any
    updateItem?: Function
    data?: any
}

export function FormNuevaPlantillaRegistro({ toast, addPlantilla, setShowForm, updateItem, data }: NuevaPlantillaRegistroProps) {
    const [sending, setSending] = useState(false)

    // Si data existe, es porque se está editando una plantilla, por lo que se deben cargar los valores por defecto, caso contrario se cargan los valores por defecto vacíos
    const getDefaultValues = () => {
        if (data) {
            return {
                nombre: data.nombre,
                tipo_reg: data.tipo_reg,
                unidad_de_negocio: data.unidad_de_negocio,
                cliente_proyecto: data.cliente_proyecto,
                imputacion: data.imputacion,
                proveedor: data.proveedor,
                observacion: data.observacion,
            }
        }
        return {
            nombre: '',
            tipo_reg: null,
            unidad_de_negocio: null,
            cliente_proyecto: null,
            imputacion: null,
            proveedor: null,
            observacion: '',
        }
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(),
    })

    const post = async (values: z.infer<typeof formSchema>) => {
        try {
            const response = await post_generico({
                model: 'plantillas_registros',
                data: values,
            })
            if (response.status === 201) {
                addPlantilla(response.data)
                toast("Plantilla creada", { type: "success" })
                return response
            } else {
                toast("Error al crear la plantilla: " + response.data)
                return null
            }
        } catch (error) {
            toast("Error al crear la plantilla: " + error)
            return null
        }
    }
    
    const patch = async (values: z.infer<typeof formSchema>) => {
        try {
            // Solo enviar campos modificados
            const diff = {}
            Object.keys(values).forEach((key) => {
                if (values[key] !== data[key]) {
                    diff[key] = values[key]
                }
            })
            
            const response = await patch_generico({
                model: 'plantillas_registros',
                id: data.id,
                dif: diff
            })
            
            if (response.status === 200) {
                updateItem(response.data)
                toast("Plantilla actualizada", { type: "success" })
                return response
            } else {
                toast("Error al actualizar la plantilla: " + response.data)
                return null
            }
        } catch (error) {
            toast("Error al actualizar la plantilla: " + error)
            return null
        }
    }
    
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setSending(true)
        
        try {
            if (!data) {
                await post(values);
            } else {
                await patch(values);
            }
        } finally {
            setSending(false)
            setShowForm(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <ComboboxAPI
                        id="tipo_reg"
                        model="tipos_reg"
                        fieldToShow="tipo"
                        fieldToSend="tipo"
                        control={form.control}
                        className="w-full"
                        value={data?.tipo_reg}
                        initialLabel={data?.tipo_reg}
                    />
                    <ComboboxAPI
                        id="unidad_de_negocio"
                        control={form.control}
                        fieldToShow="unidad_de_negocio"
                        fieldToSend="id"
                        model="unidades_de_negocio"
                        value={data?.unidad_de_negocio}
                        initialLabel={data?.unidad_de_negocio_label}
                    />
                    <ComboboxAPI
                        id="cliente_proyecto"
                        control={form.control}
                        fieldToShow="cliente_proyecto"
                        fieldToSend="id"
                        model="clientes_proyectos"
                        value={data?.cliente_proyecto}
                        initialLabel={data?.cliente_proyecto_label}
                    />
                    <ComboboxAPI
                        id="proveedor"
                        control={form.control}
                        fieldToShow="nombre"
                        fieldToSend="id"
                        model="proveedores"
                        value={data?.proveedor}
                        initialLabel={data?.proveedor_label}
                    />
                    <ComboboxAPI
                        id="imputacion"
                        control={form.control}
                        fieldToShow="imputacion"
                        fieldToSend="id"
                        model="imputaciones"
                        value={data?.imputacion}
                        initialLabel={data?.imputacion_label}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="observacion"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observacion</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <Button type="submit" className="w-full" disabled={sending}>Enviar{sending && <Loader2 className="animate-spin ml-2 h-4 w-4" />}</Button>
            </form>
        </Form>
    )
}