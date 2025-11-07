import { post_generico } from "@/endpoints/api";
import { toast } from "sonner";

interface onSubmitProps {
    setError: (error: boolean) => void;
    setErrorMessage?: (message: string | null) => void;
    setSending: (sending: boolean) => void;
    model: string;
    onSuccess: (data: any) => void;
    values: any;
    form: any;
}

export const onCreate = async ({ setError, setErrorMessage, setSending, model, onSuccess, values, form }: onSubmitProps) => {
    try {
        setError(false)
        setSending(true)

        const response = await post_generico({ model, data: values })
        if (response.status === 201) {
            setSending(false)
            onSuccess(response.data)
            form.reset();
            toast.success("Elemento creado exitosamente")
            // Remover setOpen de aquí ya que se maneja en FormGenerico
        }
        else {
            toast.error("Error al crear el elemento: " + response.data.error)
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
        toast.error("Error al crear el elemento: " + errorMessage);
        setError(true);
    }
}