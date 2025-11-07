import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormLabel, FormControl, FormMessage, FormItem, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { patch_generico } from '@/endpoints/api';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

const PERSONA_NOMBRE_MAP: Record<string, string[]> = {
    "proveedor": ["Proveedores", "Proveedor", "proveedores", "1"], // El número representa proveedor/receptor en el modelo de django
    "receptor": ["Receptores", "Receptor", "receptores", "2"],
}

const formSchema = z
    .object({
        razon_social: z.string().max(100, 'Máximo 100 caracteres').optional(),
        nombre_fantasia_pila: z.string().max(100, 'Máximo 100 caracteres').optional(),
        cnpj: z.coerce.number().max(99999999999, 'Máximo 11 caracteres').optional(),
        proveedor_receptor: z.number(),
        cbu_alias: z.string().max(22, 'Máximo 22 caracteres').optional(),
        activo: z.boolean()
    })
    .refine(
        (data) =>
            (!!data.razon_social && data.razon_social.trim() !== '') ||
            (!!data.nombre_fantasia_pila && data.nombre_fantasia_pila.trim() !== '') ||
            (!!data.cnpj && data.cnpj !== 0),
        {
            message: 'Debe completar al menos un campo: Razón social, Nombre de fantasía o CNPJ',
            path: ['cnpj'], // Puedes especificar el path donde mostrar el error
        }
    );

interface DialogUpdatePersonaProps {
    tipo?: "proveedor" | "receptor";
    toast: any;
    buttonStr: string;
    queryClient?: any;
    initialData: any;
}

/**
 * Componente que muestra un formulario para actualizar un cliente-proyecto.
 * @param toast Función para mostrar mensajes al usuario.
 * @param queryClient Cliente de queries de react-query.
 * @param id ID del cliente-proyecto a actualizar.
 * @param initialData Datos iniciales del cliente-proyecto.
 * @returns JSX.Element
 */
function DialogUpdatePersona({ toast, queryClient, initialData, tipo }: DialogUpdatePersonaProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            razon_social: initialData.razon_social|| '',
            nombre_fantasia_pila: initialData.nombre_fantasia_pila || '',
            cnpj: initialData.cnpj|| null,
            cbu_alias: initialData.cbu_alias || '',
            activo: initialData.activo,
            proveedor_receptor: initialData.proveedor_receptor
        },
    });
    const [showForm, setShowForm] = useState(false);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (values.nombre_fantasia_pila === '') {
                values.nombre_fantasia_pila = values.razon_social
            }
            if (values.cnpj === 0) {
                values.cnpj = null
            }
            const diff = {};
            for (const key in values) {
                if (values[key] !== initialData[key]) {
                    diff[key] = values[key];
                }
            }
            const response = await patch_generico({ model: 'personas', id: initialData.id, dif: diff });
            if (response.status !== 200) {
                toast('Error al actualizar el ' + PERSONA_NOMBRE_MAP[tipo][1]);
                return;
            }
            form.reset();
            toast(PERSONA_NOMBRE_MAP[tipo][1] + ' actualizado correctamente')
            queryClient?.invalidateQueries({ queryKey: [tipo] });
            setShowForm(false);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                <Button variant='ghost'>
                    <Pencil />
                </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className='max-w-2xl'>
                <DialogTitle style={{ textAlign: 'center' }}>Modificar {PERSONA_NOMBRE_MAP[tipo][1]}</DialogTitle>
                <div className='flex justify-center h-fit'>
                    <Card className='w-full'>
                        <CardContent>
                            <Form {...form}>
                                <form id='nuevaPersonaForm' onSubmit={e => {
                                    e.stopPropagation(); // De esta forma prevengo que se envíe el formulario del parent junto a este al presionar el botón
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
                                                    <Input type="number" placeholder='CNPJ' {...field} />
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
                                                <FormDescription>Alias de la cuenta bancaria</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        }}
                                        />
                                    </div>

                                    <Button type="submit">Enviar</Button>
                                    </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function DialogUpdateProveedor({ toast, buttonStr, queryClient, initialData }: DialogUpdatePersonaProps) {
    return <DialogUpdatePersona tipo="proveedor" toast={toast} buttonStr={buttonStr} queryClient={queryClient} initialData={initialData} />
}

export function DialogUpdateReceptor({ toast, buttonStr, queryClient, initialData }: DialogUpdatePersonaProps) {
    return <DialogUpdatePersona tipo="receptor" toast={toast} buttonStr={buttonStr} queryClient={queryClient} initialData={initialData} />
}
