import * as z from "zod";
import { toast } from "sonner";
import { patch_generico } from "@/endpoints/api";

interface onUpdateProps<T extends z.ZodObject<any>> {
    formSchema: T;
    values: z.infer<T>;
    instancia: any
    model: string;
    updateItem: (item: any) => void;
    setOpen: (open: boolean) => void;
    setSending: (sending: boolean) => void;
    setError: (error: boolean) => void;
    setErrorMessage?: (message: string | null) => void;
    originalValues?: z.infer<T>;
}

export const onUpdate = async <T extends z.ZodObject<any>>({ formSchema, values, instancia, model, updateItem, setOpen, setSending, setError, setErrorMessage, originalValues }: onUpdateProps<T>) => {

    try {
        setError(false)
        setSending(true)
        const diff = {} as Partial<Record<keyof z.infer<typeof formSchema>, z.infer<typeof formSchema>[keyof z.infer<typeof formSchema>] | null>>;

        // Usar originalValues si está disponible, sino usar instancia
        const baseValues = originalValues || instancia;

        for (const key in values) {
            const formValue = values[key as keyof typeof values];
            const originalValue = baseValues[key as keyof typeof baseValues];

            // Normalizar valores para comparación
            const normalizedFormValue = formValue === '' ? null : formValue;
            const normalizedOriginalValue = typeof originalValue === 'string' && !isNaN(Number(originalValue))
                ? Number(originalValue)
                : originalValue;

            // Solo incluir en diff si los valores son realmente diferentes
            if (normalizedFormValue !== normalizedOriginalValue) {
                diff[key] = formValue;
            }
        }

        const response = await patch_generico({ model: model, id: instancia.id, dif: diff })
        if (response.status === 200) {
            setSending(false)
            toast.success(`${String(model).charAt(0).toUpperCase() + String(model).slice(1)} actualizado exitosamente`)
            updateItem(response.data)
            setOpen(false);
        } else {
            toast.error("Error al actualizar el " + model + ": " + response.data.error)
            setError(true)
            setSending(false)
        }
    } catch (error) {
        setSending(false);
        console.error("Error al enviar los datos:", error);
        const errorData = (error as any)?.response?.data;
        const errorMessage = errorData?.error ||
            (typeof errorData === 'object' && !Array.isArray(errorData)
                ? Object.entries(errorData).map(([field, messages]) =>
                    `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`).join('; ')
                : Array.isArray(errorData) ? errorData[0]
                    : 'Error desconocido');
        setErrorMessage && setErrorMessage(errorMessage);
        toast.error("Error al actualizar el movimiento: " + errorMessage);
        setError(true);
    }
};