import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Acopio } from '@/types/acopios';
import { patch_generico } from '@/endpoints/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

interface EditarAcopioProps {
    acopio: Acopio | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    updateItem: (item: Acopio) => void;
}

const acopioSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    fecha: z.string().min(1, 'La fecha es requerida'),
    acopiante: z.number().min(1, 'El acopiante es requerido'),
    monto: z.coerce.number().min(0, 'El monto debe ser positivo'),
    iva: z.coerce.number().min(0, 'El IVA debe ser positivo'),
    tipo_de_cambio: z.coerce.number().min(0, 'El tipo de cambio debe ser positivo'),
    coeficiente_ajuste: z.coerce.number().min(0, 'El coeficiente debe ser positivo')
});

type AcopioFormData = z.infer<typeof acopioSchema>;

export function EditarAcopio({ acopio, open, onOpenChange, updateItem }: EditarAcopioProps) {
    const form = useForm<AcopioFormData>({
        resolver: zodResolver(acopioSchema),
        defaultValues: {
            nombre: '',
            fecha: '',
            acopiante: 0,
            monto: 0,
            iva: 0,
            tipo_de_cambio: 1.0,
            coeficiente_ajuste: 1.0
        }
    });

    useEffect(() => {
        if (open && acopio) {
            form.reset({
                nombre: acopio.nombre,
                fecha: acopio.fecha,
                acopiante: acopio.acopiante,
                monto: acopio.monto,
                iva: acopio.iva,
                tipo_de_cambio: acopio.tipo_de_cambio,
                coeficiente_ajuste: acopio.coeficiente_ajuste || 1.0
            });
        }
    }, [open, acopio, form]);

    const onSubmit = async (data: AcopioFormData) => {
        if (!acopio) return;

        try {
            const response = await patch_generico({model: 'acopios', id: acopio.id, dif: data});
            toast.success('Acopio actualizado correctamente');
            updateItem(response.data);
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating acopio:', error);
            toast.error('Error al actualizar el acopio');
        }
    };

    if (!acopio) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Acopio</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        <FormField
                            control={form.control}
                            name="fecha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <ComboboxAPI
                            id="acopiante"
                            model="clientes_proyectos"
                            fieldToShow='cliente_proyecto'
                            fieldToSend='id'
                            control={form.control}
                            initialLabel={acopio.acopiante_nombre || ''}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="monto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Neto</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="iva"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IVA</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo_de_cambio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Cambio</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.0001" 
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 1.0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="coeficiente_ajuste"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coeficiente Ajuste</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.0001" 
                                                {...field}
                                                onChange={e => field.onChange(parseFloat(e.target.value) || 1.0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={form.formState.isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}