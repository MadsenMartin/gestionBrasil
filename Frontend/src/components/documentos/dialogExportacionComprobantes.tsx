import { zodResolver } from "@hookform/resolvers/zod";
import { DialogGenerico } from "../dialogs/dialogGenerico";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "../ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { exportar_documentos } from "@/endpoints/api";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    añomes: z.string().min(6).max(6).regex(/^\d{6}$/, "El formato debe ser AAAAMM"),
});

export const DialogExportacionComprobantes = ({trigger}) => {
    const [open, setOpen] = useState(false)
    const [procesando, setProcesando] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            añomes: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setProcesando(true)
            const response = await exportar_documentos(values)
            if (response.status === 200) {
                return
            } else {
                toast.error("Error al exportar" + response.data.error)
            }
        } catch (error) {
            toast.error("Error al exportar: " + (error.response?.data?.error || error.message));
        } finally {
            setProcesando(false)
        }
    }

    const formExportacion = () => {
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="añomes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Añomes (AAAAMM)</FormLabel>
                                <Input
                                    id="añomes"
                                    {...field}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" className="px-4 py-2" disabled={procesando}>
                            {procesando ? "Procesando..." : "Exportar"}
                            {procesando && <Loader2 className="animate-spin ml-2" />}
                        </Button>
                    </div>
                </form>

            </Form>
        );
    }

    return (
        <DialogGenerico
            trigger={trigger}
            title="Exportar Comprobantes"
            description="Seleccione el mes a exportar"
            open={open}
            setOpen={setOpen}
            children={formExportacion()}
        />
    )

}