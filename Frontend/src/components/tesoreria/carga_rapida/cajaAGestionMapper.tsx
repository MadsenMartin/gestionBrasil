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
import { Badge } from "@/components/ui/badge";

const TIPO_REG_CHOICES = ["PSF", "OP", "OPFC", "FCV", "REC", "ISF", "MC"];

const movimiento = z.object({
    fecha: z.string(),
    tipo_reg: z.string().refine(value => TIPO_REG_CHOICES.includes(value), {
        message: "Debe ser uno de los siguientes valores: PSF, OP, OPFC, FCV, REC, ISF, MC",
    }),
    nombre: z.string().optional(),
    unidad_de_negocio: z.string().optional(),
    obra: z.string().optional(),
    imputacion: z.string().optional(),
    observacion: z.string(),
    entrada: z.number().optional(),
    salida: z.number().optional(),
    neto: z.number().optional(),
    iva: z.number().optional(),
    presupuesto: z.string().optional(),
    tipo_de_cambio: z.number().optional().default(1.0)
})

const formSchema = z.object({
    movimientos: z.array(movimiento).min(1, "Debe haber al menos un movimiento"),
    caja: comboboxField(),
    flag_crear_proveedor: z.boolean().default(false)
});

interface CajaAGestionMapperProps {
    trigger: React.ReactNode;
    addItem: (item: any) => void;
}

interface ColumnMapping {
    fecha?: number;
    tipo_reg?: number;
    nombre?: number;
    unidad_de_negocio?: number;
    obra?: number;
    imputacion?: number;
    observacion?: number;
    entrada?: number;
    salida?: number;
    presupuesto?: number;
    neto?: number;
    iva?: number;
    tipo_de_cambio?: number;
}

export function CajaAGestionMapper({ trigger, addItem }: CajaAGestionMapperProps) {
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            movimientos: [],
            caja: null,
            flag_crear_proveedor: false
        },
    })
    
    const [rawData, setRawData] = useState<string[][]>([]);
    const [textData, setTextData] = useState("");
    const [showMapping, setShowMapping] = useState(false);
    const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
    const [processedData, setProcessedData] = useState<any[]>([]);
    const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

    const fieldLabels: Record<keyof ColumnMapping, string> = {
        fecha: "Fecha",
        tipo_reg: "Tipo de Registro",
        nombre: "Nombre",
        unidad_de_negocio: "Unidad de Negocio",
        obra: "Obra",
        imputacion: "Imputación",
        observacion: "Observación", 
        entrada: "Entrada",
        salida: "Salida",
        neto: "Neto",
        iva: "IVA",
        presupuesto: "Presupuesto",
        tipo_de_cambio: "Tipo de Cambio"
    };

    const parseCurrency = (value: string | undefined): number => {
        if (!value) return 0;
        const cleanedValue = value.replace(/[$.]/g, '').replace(/\s/g, '').replace(/,/g, '.');
        return parseFloat(cleanedValue) || 0;
    };

    const parseDate = (dateStr: string): string => {
        if (!dateStr) return "";
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
    };

    const procesarTextoInicial = (text: string) => {
        if (!text.trim()) return;

        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const data = lines.map(line => line.split('\t'));
        
        setRawData(data);
        setShowMapping(true);
    };

    const procesarConMapeo = () => {
        if (rawData.length === 0) return;

        const newMovimientos = rawData.map(row => {
            const movimiento: any = {
                fecha: columnMapping.fecha !== undefined ? parseDate(row[columnMapping.fecha] || "") : "",
                tipo_reg: columnMapping.tipo_reg !== undefined ? (row[columnMapping.tipo_reg] || "") : "",
                nombre: columnMapping.nombre !== undefined ? (row[columnMapping.nombre] || "") : "",
                unidad_de_negocio: columnMapping.unidad_de_negocio !== undefined ? (row[columnMapping.unidad_de_negocio]?.trim() || undefined) : undefined,
                obra: columnMapping.obra !== undefined ? (row[columnMapping.obra] || "") : "",
                imputacion: columnMapping.imputacion !== undefined ? (row[columnMapping.imputacion]?.trim() || undefined) : undefined,
                observacion: columnMapping.observacion !== undefined ? (row[columnMapping.observacion] || "") : "",
                entrada: columnMapping.entrada !== undefined ? parseCurrency(row[columnMapping.entrada]) : 0,
                salida: columnMapping.salida !== undefined ? parseCurrency(row[columnMapping.salida]) : 0,
                neto: columnMapping.neto !== undefined ? parseCurrency(row[columnMapping.neto]) : undefined,
                iva: columnMapping.iva !== undefined ? parseCurrency(row[columnMapping.iva]) : undefined,
                presupuesto: columnMapping.presupuesto !== undefined ? (row[columnMapping.presupuesto]?.trim() || undefined) : undefined,
                tipo_de_cambio: columnMapping.tipo_de_cambio !== undefined ? parseCurrency(row[columnMapping.tipo_de_cambio]) : 1.0
            };

            return movimiento;
        });

        setProcessedData(newMovimientos);
        form.setValue("movimientos", newMovimientos);
    };

    const handleProcesarTexto = () => {
        procesarTextoInicial(textData);
        setTextData("");
    };

    const handleDrop = (field: keyof ColumnMapping, columnIndex: number) => {
        setColumnMapping(prev => {
            // Remover mapeo existente de esta columna
            const newMapping = { ...prev };
            Object.keys(newMapping).forEach(key => {
                if (newMapping[key as keyof ColumnMapping] === columnIndex) {
                    newMapping[key as keyof ColumnMapping] = undefined;
                }
            });
            // Asignar nueva columna
            newMapping[field] = columnIndex;
            return newMapping;
        });
    };

    const handleDragStart = (columnIndex: number) => {
        setDraggedColumn(columnIndex);
    };

    const handleDragEnd = () => {
        setDraggedColumn(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDropOnField = (e: React.DragEvent, field: keyof ColumnMapping) => {
        e.preventDefault();
        if (draggedColumn !== null) {
            handleDrop(field, draggedColumn);
        }
    };

    const removeMappingForField = (field: keyof ColumnMapping) => {
        setColumnMapping(prev => ({
            ...prev,
            [field]: undefined
        }));
    };

    const getAllFormErrors = (errors: any, path = ''): string[] => {
        const errorMessages: string[] = [];
        
        Object.entries(errors).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (value && typeof value === 'object') {
                if ('message' in value) {
                    errorMessages.push(`${currentPath}: ${value.message}`);
                } else {
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
                resetComponent();
            } else {
                toast.error("Error al cargar la caja: " + response.data.error);
            }
        } catch (error) {
            setSending(false);
            console.error("Error al enviar los datos:", error);
            const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
            toast.error("Error al cargar la caja: " + errorMessage);
        }
    };

    const resetComponent = () => {
        setRawData([]);
        setTextData("");
        setShowMapping(false);
        setColumnMapping({});
        setProcessedData([]);
    };

    const getUsedColumns = () => {
        return Object.values(columnMapping).filter(col => col !== undefined) as number[];
    };

    const isColumnUsed = (columnIndex: number) => {
        return getUsedColumns().includes(columnIndex);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Carga Rápida de Caja - Mapeo de Columnas</DialogTitle>
                    <DialogDescription>Importación de caja a gestión con mapeo personalizable</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form id="cajaAGestionMapperForm" onSubmit={form.handleSubmit(
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

                        {!showMapping ? (
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
                        ) : !processedData.length ? (
                            <div className="space-y-6 mt-4">
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <h3 className="font-medium text-blue-900 mb-2">Configurar Mapeo de Columnas - Drag & Drop</h3>
                                    <p className="text-sm text-blue-700">
                                        Arrastra las columnas de Excel (azules) hacia los campos correspondientes (grises). 
                                        Los campos marcados con * son obligatorios.
                                    </p>
                                </div>

                                {/* Columnas de Excel disponibles */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Columnas de Excel disponibles:</Label>
                                    <div className="flex flex-wrap gap-2 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                                        {rawData.length > 0 && (() => {
                                            // Encontrar la fila con más columnas
                                            const maxColumns = Math.max(...rawData.map(row => row.length));
                                            return Array.from({ length: maxColumns }, (_, index) => {
                                                // Buscar contenido representativo para esta columna
                                                const sampleContent = rawData.find(row => row[index] && row[index].trim() !== '')?.[index] || 
                                                                     rawData[0]?.[index] || '';
                                                
                                                return (
                                                    <Badge
                                                        key={index}
                                                        variant={isColumnUsed(index) ? "secondary" : "default"}
                                                        className={`cursor-move p-2 ${
                                                            draggedColumn === index ? 'opacity-50' : ''
                                                        } ${
                                                            isColumnUsed(index) ? 'bg-gray-300 text-gray-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                        draggable={!isColumnUsed(index)}
                                                        onDragStart={() => handleDragStart(index)}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        Col {index + 1}: {sampleContent ? sampleContent.substring(0, 15) + (sampleContent.length > 15 ? '...' : '') : 'Vacío'}
                                                    </Badge>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* Campos objetivo */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Campos del sistema:</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(fieldLabels).map(([fieldKey, label]) => {
                                            const mappedColumn = columnMapping[fieldKey as keyof ColumnMapping];
                                            const isRequired = ['fecha', 'tipo_reg', 'observacion'].includes(fieldKey);
                                            
                                            return (
                                                <div
                                                    key={fieldKey}
                                                    className={`p-4 border-2 border-dashed rounded-lg min-h-[60px] flex flex-col justify-center ${
                                                        mappedColumn !== undefined 
                                                            ? 'border-green-300 bg-green-50' 
                                                            : isRequired 
                                                                ? 'border-red-200 bg-red-50' 
                                                                : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDropOnField(e, fieldKey as keyof ColumnMapping)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <Label className={`font-medium ${isRequired ? 'text-red-700' : 'text-gray-700'}`}>
                                                            {label}
                                                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        {mappedColumn !== undefined && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeMappingForField(fieldKey as keyof ColumnMapping)}
                                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                            >
                                                                ×
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {mappedColumn !== undefined ? (
                                                        <Badge variant="outline" className="w-fit mt-1">
                                                            Columna {mappedColumn + 1}: {(() => {
                                                                // Buscar contenido representativo para mostrar
                                                                const sampleContent = rawData.find(row => row[mappedColumn] && row[mappedColumn].trim() !== '')?.[mappedColumn] || 
                                                                                     rawData[0]?.[mappedColumn] || '';
                                                                return sampleContent.substring(0, 20);
                                                            })()}
                                                        </Badge>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Arrastra una columna aquí
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        type="button"
                                        onClick={() => { setShowMapping(false); setRawData([]); }}
                                        variant="outline"
                                    >
                                        Volver
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={procesarConMapeo}
                                        disabled={columnMapping.fecha === undefined || columnMapping.tipo_reg === undefined || columnMapping.observacion === undefined}
                                    >
                                        Aplicar Mapeo
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-[60vh] overflow-auto mt-4">
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
                                            <TableHead>Neto</TableHead>
                                            <TableHead>IVA</TableHead>
                                            <TableHead>Presupuesto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.map((movimiento, index) => (
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
                                                <TableCell>{formatCurrency(movimiento.neto)}</TableCell>
                                                <TableCell>{formatCurrency(movimiento.iva)}</TableCell>
                                                <TableCell>{movimiento.presupuesto}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setProcessedData([]);
                                        setShowMapping(true);
                                    }}
                                    variant="outline"
                                    className="mt-2"
                                >
                                    Modificar Mapeo
                                </Button>
                            </div>
                        )}

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
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); resetComponent(); }}>
                        Cancelar
                    </Button>
                    <Button 
                        form="cajaAGestionMapperForm" 
                        type="submit"
                        disabled={processedData.length === 0}
                    >
                        Enviar
                        {sending && <Loader2 className="animate-spin" size={16} />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}