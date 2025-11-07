import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Desacopio } from '@/types/acopios';
import { post_generico } from '@/endpoints/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ComboboxAPI } from '../comboboxes/ComboboxAPI';

interface CrearDesacopioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (newDesacopio: Desacopio) => void;
}

const desacopioSchema = z.object({
    fecha_entrega: z.string().min(1, 'La fecha de entrega es requerida'),
    remito: z.string().optional(),
    nro_pedido: z.string().optional(),
    arquitecto: z.string().optional(),
    articulo: z.number().min(1, 'El artículo es requerido'),
    cantidad: z.coerce.number().int('La cantidad debe ser un número entero'),
    unitario: z.coerce.number().min(0, 'El precio unitario debe ser positivo'),
    alicuota: z.coerce.number().min(0, 'La alícuota debe ser positiva'),
    obra: z.number().nullable().optional(),
    conciliado: z.boolean(),
    acopio: z.number().min(1, 'El acopio es requerido'),
    presupuesto_cliente_item: z.number().nullable().optional()
});

type DesacopioFormData = z.infer<typeof desacopioSchema>;

export function CrearDesacopio({ open, onOpenChange, onSuccess }: CrearDesacopioProps) {
    const form = useForm<DesacopioFormData>({
        resolver: zodResolver(desacopioSchema),
        defaultValues: {
            fecha_entrega: new Date().toISOString().split('T')[0], // Fecha actual
            remito: '',
            nro_pedido: '',
            arquitecto: '',
            articulo: 0,
            cantidad: 1,
            unitario: 0,
            alicuota: 21,
            obra: null,
            conciliado: false,
            acopio: 0,
            presupuesto_cliente_item: null
        }
    });

    const onSubmit = async (data: DesacopioFormData) => {
        try {
            const response = await post_generico({model: 'acopios/desacopios-crud', data: data});
            toast.success('Desacopio creado correctamente');
            onSuccess(response.data);
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error('Error creating desacopio:', error);
            toast.error('Error al crear el desacopio');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Desacopio</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fecha_entrega"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Entrega</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="remito"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remito</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Número de remito" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nro_pedido"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nro. Pedido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Número de pedido" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="arquitecto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Arquitecto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre del arquitecto" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <ComboboxAPI
                            id="articulo"
                            model="articulos"
                            fieldToShow='nombre'
                            fieldToSend='id'
                            control={form.control}
                        />

                        <ComboboxAPI
                            id="acopio"
                            model="acopios"
                            fieldToShow='nombre'
                            fieldToSend='id'
                            control={form.control}
                        />

                        <ComboboxAPI
                            id="obra"
                            model="clientes_proyectos"
                            fieldToShow='cliente_proyecto'
                            fieldToSend='id'
                            control={form.control}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="cantidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="1"
                                                placeholder="1"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unitario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Unitario</FormLabel>
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
                                name="alicuota"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alícuota (%)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="21.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="conciliado"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Conciliado
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

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
                                {form.formState.isSubmitting ? 'Creando...' : 'Crear Desacopio'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}