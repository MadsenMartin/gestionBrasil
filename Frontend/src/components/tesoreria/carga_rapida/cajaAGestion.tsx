import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ComboboxAPI } from "@/components/comboboxes/ComboboxAPI";
import { Form } from "@/components/ui/form";
import { comboboxField } from "@/components/documentos/formNuevoDocumento";
import { DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/components/presupuestos_cliente/utils";
import { post_generico } from "@/endpoints/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

const TIPO_REG_CHOICES = ["PSF", "OP", "OPFC", "FCV", "REC", "ISF", "MC", "FC"];

const movimiento = z.object({
    fecha: z.string(),
    tipo_reg: z.string().refine(value => TIPO_REG_CHOICES.includes(value), {
        message: "Debe ser uno de los siguientes valores: PSF, OP, OPFC, FCV, REC, ISF, MC, FC"
    }),
    nombre: z.string().optional(),
    unidad_de_negocio: z.string().optional(),
    obra: z.string().optional(),
    imputacion: z.string().optional(),
    observacion: z.string(),
    entrada: z.number().optional(),
    salida: z.number().optional(),
    presupuesto: z.string().optional(),
    tipo_de_cambio: z.number().optional().default(1.0)
})

const formSchema = z.object({
    movimientos: z.array(movimiento).min(1, "Debe haber al menos un movimiento"),
    caja: comboboxField(),
    flag_crear_proveedor: z.boolean().default(false)
});

interface CajaAGestionProps {
    trigger: React.ReactNode;
    addItem: (item: any) => void;
}

export function CajaAGestion({ trigger, addItem }: CajaAGestionProps) {
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            movimientos: [{ fecha: "2025-01-01", tipo_reg: "ingreso", nombre: "", unidad_de_negocio: "", obra: "", imputacion: null, observacion: "", entrada: 0, salida: 0, presupuesto: "", tipo_de_cambio: 1.0 }],
            caja: null,
            flag_crear_proveedor: false
        },
    })
    const [movimientosPegados, setMovimientosPegados] = useState<any[] | null>(null)
    const [textData, setTextData] = useState("")

    const parseCurrency = (value: string | undefined): number => {
        if (!value) return 0;
        const cleanedValue = value.replace(/[$.]/g, '').replace(/\s/g, '');
        return parseFloat(cleanedValue) || 0;
    };

    const procesarTexto = (text: string) => {
        if (!text.trim()) return;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newMovimientos = lines.map(line => {
            const parts = line.split('\t');
            return {
                fecha: (() => {
                    const [day, month, year] = parts[2].split('/');
                    return `${year}-${month}-${day}`;
                })(),
                tipo_reg: parts[0],
                nombre: parts[3],
                unidad_de_negocio: parts[1] && parts[1].trim() !== "" ? parts[1].trim() : undefined,
                obra: parts[4],
                imputacion: parts[9] && parts[9].trim() !== "" ? parts[9].trim() : undefined,
                observacion: parts[5],
                entrada: parseCurrency(parts[6]),
                salida: parseCurrency(parts[7]),
                // parts[8] es Saldo - se ignora
                presupuesto: parts[10] && parts[10].trim() !== "" ? parts[10] : undefined,
                tipo_de_cambio: parts[11] ? parseCurrency(parts[11]) : 1.0 // Asignar tipo de cambio si existe
                
            };
            
        });
        setMovimientosPegados(newMovimientos);
        form.setValue("movimientos", newMovimientos);
    }

    const handleProcesarTexto = () => {
        procesarTexto(textData);
        setTextData("");
    }

    const getAllFormErrors = (errors: any, path = ''): string[] => {
        const errorMessages: string[] = [];
        
        Object.entries(errors).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (value && typeof value === 'object') {
                if ('message' in value) {
                    errorMessages.push(`${currentPath}: ${value.message}`);
                } else {
                    // Es un objeto anidado, recursar
                    errorMessages.push(...getAllFormErrors(value, currentPath));
                }
            }
        });
        
        return errorMessages;
    };

    const handleSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            setSending(true);
            const response = await post_generico({ model: "carga_caja", data: data });
            setSending(false);
            if (response.status === 201) {
                toast.success("Carga de caja realizada con éxito");
                response.data.forEach((item: any) => {
                    addItem(item);
                });
                setOpen(false);
                form.reset();
                setMovimientosPegados(null);
                setTextData("");
            } else {
                toast.error("Error al cargar la caja: " + response.data.error);
            }
        } catch (error) {
            setSending(false);
            console.error("Error al enviar los datos:", error);
            const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
            toast.error("Error al cargar la caja: " + errorMessage);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Carga Rápida de Caja</DialogTitle>
                    <DialogDescription>Importación de caja a gestión</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="cajaAGestionForm" onSubmit={form.handleSubmit(
                        data => handleSubmit(data),
                        errors => console.log("Errores del form:", errors)
                    )}>
                        <ComboboxAPI
                            id="caja"
                            formLabel={true}
                            model="cajas"
                            control={form.control}
                            fieldToShow="caja"
                            fieldToSend="id"
                        />

                        <FormField
                            control={form.control}
                            name="flag_crear_proveedor"
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
                                            Crear proveedores automáticamente
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Si está marcado, se crearán automáticamente los proveedores que no existan en el sistema
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        {!movimientosPegados ? (
                            <div className="space-y-4 mt-4">

                                <Label htmlFor="textData">Pegar acá los datos de Excel:</Label>
                                <Textarea
                                    id="textData"
                                    placeholder="Pega aquí los datos copiados de Excel (con Ctrl+V)..."
                                    value={textData}
                                    onChange={(e) => setTextData(e.target.value)}
                                    rows={6}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={handleProcesarTexto}
                                    disabled={!textData.trim()}
                                    className="w-full"
                                >
                                    Procesar Datos
                                </Button>
                            </div>
                        )
                            : (
                                <div className="max-h-[60vh] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Tipo Reg</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Unidad de Negocio</TableHead>
                                            <TableHead>Obra</TableHead>
                                            <TableHead>Imputación</TableHead>
                                            <TableHead>Observación</TableHead>
                                            <TableHead>Entrada</TableHead>
                                            <TableHead>Salida</TableHead>
                                            <TableHead>Presupuesto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movimientosPegados.map((movimiento, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{movimiento.fecha}</TableCell>
                                                <TableCell>{movimiento.tipo_reg}</TableCell>
                                                <TableCell>{movimiento.nombre}</TableCell>
                                                <TableCell>{movimiento.unidad_de_negocio}</TableCell>
                                                <TableCell>{movimiento.obra}</TableCell>
                                                <TableCell>{movimiento.imputacion}</TableCell>
                                                <TableCell>{movimiento.observacion}</TableCell>
                                                <TableCell>{formatCurrency(movimiento.entrada)}</TableCell>
                                                <TableCell>{formatCurrency(movimiento.salida)}</TableCell>
                                                <TableCell>{movimiento.presupuesto}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )
                        }

                        {/* Mostrar errores del formulario */}
                        {Object.keys(form.formState.errors).length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                <h4 className="text-red-800 font-medium mb-2">Errores en el formulario:</h4>
                                <ul className="text-red-700 text-sm space-y-1">
                                    {getAllFormErrors(form.formState.errors).map((errorMessage, index) => (
                                        <li key={index}>
                                            {errorMessage}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </form>
                </Form>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); setMovimientosPegados(null); setTextData("") }}>
                        Cancelar
                    </Button>
                    <DialogDescription />
                    <Button form="cajaAGestionForm" type="submit">
                        Enviar
                        {sending && <Loader2 className="animate-spin" size={16} />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )

}