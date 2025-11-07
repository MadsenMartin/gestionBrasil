import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormField, FormLabel, FormControl, FormDescription, FormMessage, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { post_generico } from '@/endpoints/api'
import Draggable from 'react-draggable'

const formSchema = z.object({
    razon_social: z.string().max(100, 'Máximo 100 caracteres'),
    nombre_fantasia_pila: z.string().max(100, 'Máximo 100 caracteres'),
    cnpj: z.string().min(18, 'Debe tener 18 caracteres').max(18, 'Debe tener 18 caracteres'),
    cbu_alias: z.string().max(22, 'Máximo 22 caracteres').optional(),
    proveedor_receptor: z.number(),
    activo: z.boolean()
})

interface DialogNuevaPersonaProps {
    tipo?: "proveedor" | "receptor";
    toast: any;
    buttonStr: string;
    queryClient?: any;
}

const PERSONA_NOMBRE_MAP: Record<string, string[]> = {
    "proveedor": ["Proveedores", "Proveedor", "proveedores", "1"], // El número representa proveedor/receptor en el modelo de django
    "receptor": ["Receptores", "Receptor", "receptores", "2"],
}

/**
 * Componente que muestra un formulario para cargar un nuevo proveedor o receptor.
 * @param tipo Tipo de persona a cargar.
 * @param toast Función para mostrar mensajes al usuario.
 * @param buttonStr Texto del botón que muestra el formulario.
 * @param queryClient Cliente de queries de react-query.
 * @returns JSX.Element
 */
function DialogNuevaPersona({ tipo, toast, buttonStr, queryClient }: DialogNuevaPersonaProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            razon_social: '',
            nombre_fantasia_pila: '',
            cnpj: '',
            activo: true,
            proveedor_receptor: 0
        }
    })
    const [showForm, setShowForm] = useState(false)

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {

            // Si no se especifica un nombre de fantasía, se asigna la razón social
            if (values.nombre_fantasia_pila === '') {
                values.nombre_fantasia_pila = values.razon_social
            }
            values.proveedor_receptor = parseInt(PERSONA_NOMBRE_MAP[tipo][3])
            
            const response = await post_generico({ model: PERSONA_NOMBRE_MAP[tipo][2], data: values })
            console.log(response)
            if (response.status === 201) {
                toast.success(PERSONA_NOMBRE_MAP[tipo][1] + ' creado correctamente')
                setShowForm(false)
                queryClient?.invalidateQueries({ queryKey: [tipo] })
                form.reset()
            } else {
                toast(response.data)
            }
        } catch (error: any) {
            console.error(error)
            if (error.response && error.response.data && error.response.data.message) {
                toast.error('Error al crear el ' + tipo + ": " + error.response.data.message)
            } else {
                toast.error('Error al crear el ' + tipo + ": " + error.message || error)
            }
        }
    }
    const [position, setPosition] = useState({ x: 0, y: -500 }) // New state for dialog position

    // ... (keep the existing onSubmit function)

    return (
        <Dialog modal={false} open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                <Button onClick={() => setShowForm(!showForm)}>{buttonStr}</Button>
            </DialogTrigger>
            <Draggable
                position={position}
                onStop={(_e,data) => setPosition({ x: data.x, y: data.y })}
                handle=".dialog-handle"
            >
                <DialogContent aria-describedby={undefined} className='max-w-2xl relative dialog-handle cursor-move'>
                    <DialogTitle style={{ textAlign: 'center', marginTop: '1.5rem' }}>Cargar Nuevo {PERSONA_NOMBRE_MAP[tipo][1]}</DialogTitle>
                    <div className='flex justify-center h-fit'>
                        <Card className='w-full'>
                            <CardContent>
                                <Form {...form}>
                                    <form id='nuevaPersonaForm' onSubmit={e => {
                                        e.stopPropagation();
                                        return form.handleSubmit(onSubmit)(e);
                                    }}>
                                        <div className="space-y-2">
                                            <FormField control={form.control} name="razon_social" render={({ field }) => {
                                                return <FormItem>
                                                    <FormLabel>Razón social</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder='Razón social' {...field} />
                                                    </FormControl>
                                                    <FormDescription>Nombre legal de la entidad</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <FormField control={form.control} name="nombre_fantasia_pila" render={({ field }) => {
                                                return <FormItem>
                                                    <FormLabel>Nombre de fantasía</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder='Nombre de fantasía' {...field} />
                                                    </FormControl>
                                                    <FormDescription>Nombre comercial de la entidad, en caso de no especificar se asignará la razón social</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <FormField control={form.control} name="cnpj" render={({ field }) => {
                                                return <FormItem>
                                                    <FormLabel>CNPJ</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder='CNPJ' {...field} />
                                                    </FormControl>
                                                    <FormDescription>CNPJ de la entidad</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            }}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <FormField control={form.control} name="cbu_alias" render={({ field }) => {
                                                return <FormItem>
                                                    <FormLabel>CBU/Alias</FormLabel>
                                                    <FormControl>
                                                        <Input type="text" placeholder='CBU/Alias' {...field} />
                                                    </FormControl>
                                                    <FormDescription>Cuenta bancaria de la entidad</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            }}
                                            />
                                        </div>

                                        <Button type="submit" className="mt-4 w-full">Cargar {PERSONA_NOMBRE_MAP[tipo][1]}</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Draggable>
        </Dialog>
    )
}

export function DialogNuevoProveedor({ toast, buttonStr, queryClient }: DialogNuevaPersonaProps) {
    return <DialogNuevaPersona tipo="proveedor" toast={toast} buttonStr={buttonStr} queryClient={queryClient} />
}

export function DialogNuevoReceptor({ toast, buttonStr, queryClient }: DialogNuevaPersonaProps) {
    return <DialogNuevaPersona tipo="receptor" toast={toast} buttonStr={buttonStr} queryClient={queryClient} />
}