import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "../ui/dialog";
import * as z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { handlePost } from "../general/crudsGenericos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const formSchema = z.object({
    file: z.instanceof(File).refine(file => file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {
        message: "El archivo debe ser un archivo Excel (.xlsx)"
    })
});
export function DialogCargaMisComprobantes({ trigger, toast }: { trigger: JSX.Element, toast: Function }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            file: null
        }
    })
    const onSubmit = async (values: any) => {
        const file = values.file
        if (!file) {
            toast("Por favor, selecciona un archivo");
            return;
        }
        const formData = new FormData()
        formData.append('file', file)
        const response = await handlePost({
            model: 'mis_comprobantes',
            data: formData,
            toast: toast
        })
        if (response) {
            setOpen(false)
            form.reset()
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Importar mis comprobantes recibidos</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form id="carga_mis_comprobantes" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="file"
                            render={({ field: { onChange, value, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Selecciona un archivo Excel (.xlsx)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".xlsx"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                onChange(file);
                                            }}
                                            {...fieldProps}
                                        />
                                    </FormControl>
                                    {value && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            Archivo seleccionado: {value.name}
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="mt-4">
                            Cargar Comprobantes
                        </Button>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    )
}
