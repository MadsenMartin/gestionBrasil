import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Acopio } from '@/types/acopios';
import { post_generico } from '@/endpoints/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

interface CrearAcopioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (newAcopio: Acopio) => void;
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

export function CrearAcopio({ open, onOpenChange, onSuccess }: CrearAcopioProps) {
    const form = useForm<AcopioFormData>({
        resolver: zodResolver(acopioSchema),
        defaultValues: {
            nombre: '',
            fecha: new Date().toISOString().split('T')[0], // Fecha actual
            acopiante: 0,
            monto: 0,
            iva: 0,
            tipo_de_cambio: 1.0,
            coeficiente_ajuste: 1.0
        }
    });

    const onSubmit = async (data: AcopioFormData) => {
        try {
            const response = await post_generico({model: 'acopios', data: data});
            toast.success('Acopio creado correctamente');
            onSuccess(response.data);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error('Error creating acopio:', error);
            toast.error('Error al crear el acopio');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Acopio</DialogTitle>
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
                                        <Input placeholder="Nombre del acopio" {...field} />
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
                                                placeholder="0.00"
                                                {...field}
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
                                                placeholder="0.00"
                                                {...field}
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
                                                placeholder="1.0000"
                                                {...field}
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
                                                placeholder="1.0000"
                                                {...field}
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
                                {form.formState.isSubmitting ? 'Creando...' : 'Crear Acopio'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}