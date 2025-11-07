import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboboxModels } from "@/components/comboboxes/comboboxModels";
import { onCreate } from "@/components/cruds/create/onCreate";
import { onUpdate } from "@/components/cruds/update/onSubmit";
import { CircleX, Loader2 } from "lucide-react";

export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'combobox' | 'date' | 'textarea' | 'email';
    validation: z.ZodTypeAny;
    placeholder?: string;
    defaultValue?: any;
    // Para combobox
    model?: string;
    fieldToSend?: string;
    fieldToShow?: string;
    initialLabel?: string;
    // Para text/number
    min?: number;
    max?: number;
    fullWidth?: boolean;
}

interface FormGenericoCreateProps {
    action: 'POST';
    fields: FieldConfig[];
    model: string;
    onSuccess: (data: any) => void;
    setOpen?: (open: boolean) => void;
}

interface FormGenericoUpdateProps {
    action: 'UPDATE';
    fields: FieldConfig[];
    model: string;
    instancia: any;
    updateItem: (item: any) => void;
    setOpen: (open: boolean) => void;
}

type FormGenericoProps = (FormGenericoCreateProps | FormGenericoUpdateProps) & {
    setOpen?: (open: boolean) => void;
};

// Formulario para crear o actualizar instancias de cualquier modelo, mapea el tipo de campo a renderizar
export function FormGenerico(props: FormGenericoProps) {

    const { fields, model, action, setOpen } = props;
    const [error, setError] = useState(false);
    const [sending, setSending] = useState(false);

    const submitText = action === 'POST' ? "Crear" : "Editar";
    const submitTextLoading = action === 'POST' ? "Creando..." : "Editando...";

    // Construir el schema de Zod dinámicamente
    const schemaObject = fields.reduce((acc, field) => {
        acc[field.name] = field.validation;
        return acc;
    }, {} as Record<string, z.ZodTypeAny>);

    const formSchema = z.object(schemaObject);

    // Construir los valores por defecto
    const defaultValues = fields.reduce((acc, field) => {
        if (action === 'UPDATE' && props.instancia) {
            // En modo update, usar los valores de la instancia
            if (field.type === 'combobox') {
                acc[field.name] = props.instancia[field.name] ?? field.defaultValue ?? null;
            } else {
                acc[field.name] = props.instancia[field.name] ?? field.defaultValue ?? (field.type === 'number' ? "" : "");
            }
        } else {
            // En modo create, usar defaultValue
            if (field.type === 'combobox') {
                acc[field.name] = field.defaultValue ?? null;
            } else {
                acc[field.name] = field.defaultValue ?? "";
            }
        }
        return acc;
    }, {} as Record<string, any>);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (action === 'POST') {
            const handleSuccess = (data: any) => {
                props.onSuccess(data);
                setOpen?.(false);
            };
            await onCreate({
                setError,
                setSending,
                model,
                onSuccess: handleSuccess,
                values,
                form
            });
        } else {
            await onUpdate({
                formSchema,
                values,
                instancia: (props as FormGenericoUpdateProps).instancia,
                model,
                updateItem: (props as FormGenericoUpdateProps).updateItem,
                setOpen: setOpen as (open: boolean) => void,
                setSending,
                setError,
                originalValues: (props as FormGenericoUpdateProps).instancia
            });
        }
    };

    const renderField = (field: FieldConfig) => {
        switch (field.type) {
            case 'text':
            case 'email':
                return (
                    <FormField
                        key={field.name}
                        control={form.control as any}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel className="truncate block">{field.label}</FormLabel>
                                <Input
                                    id={field.name}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    {...formField}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'number':
                return (
                    <FormField
                        key={field.name}
                        control={form.control as any}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel className="truncate block">{field.label}</FormLabel>
                                <Input
                                    id={field.name}
                                    type="number"
                                    placeholder={field.placeholder}
                                    min={field.min}
                                    max={field.max}
                                    {...formField}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'date':
                return (
                    <FormField
                        key={field.name}
                        control={form.control as any}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel className="truncate block">{field.label}</FormLabel>
                                <Input
                                    id={field.name}
                                    type="date"
                                    {...formField}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'textarea':
                return (
                    <FormField
                        key={field.name}
                        control={form.control as any}
                        name={field.name}
                        render={({ field: formField }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="truncate block">{field.label}</FormLabel>
                                <textarea
                                    id={field.name}
                                    placeholder={field.placeholder}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...formField}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );

            case 'combobox':
                if (!field.model) {
                    console.error(`El campo ${field.name} es tipo combobox pero no se especificó el modelo.`);
                    return null;
                }
                return (
                    <ComboboxModels
                        key={field.name}
                        model={field.model!}
                        control={form.control}
                        value={defaultValues?.[field.name] ?? null}
                        initialLabel={field.initialLabel}
                        fieldToSend={field.fieldToSend}
                        fieldToShow={field.fieldToShow}
                        id={field.name}
                        className={field.fullWidth ? "flex col-span-2 w-full" : ""}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(renderField)}
                </div>
                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={sending}
                        variant={error ? "destructive" : "default"}
                        className="w-full md:w-auto"
                    >
                        {sending ? submitTextLoading : submitText}
                        {error && <CircleX size={16} className="ml-2" />}
                        {sending && <Loader2 className="animate-spin ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
