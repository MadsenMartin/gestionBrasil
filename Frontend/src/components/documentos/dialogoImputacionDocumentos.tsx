import { Documento } from "@/types/genericos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "../ui/table";
import { ComboboxAPI } from "../comboboxes/ComboboxAPI";
import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormLabel, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { imputar_documentos } from "@/endpoints/api";

const formSchema = z.object({
    imputaciones: z.array(z.object({
        factura: z.number(),
        presupuesto: z.number().nullable().optional()
    }))
})

export function DialogoImputacionDocumentos({ docs, trigger, toast, updateItem, setSelectMode }: { docs: Documento[], trigger: JSX.Element, toast: Function, updateItem: Function, setSelectMode: Function }) {
    const [open, setOpen] = useState(false)
    const [saldos, setSaldos] = useState<number[]>([])
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            imputaciones: docs.map((doc) => ({ factura: doc.id, presupuesto: null }))
        }
    })

    const onSubmit = async (values:any) => {
        values.imputaciones.forEach((imputacion: any) => {
            imputacion.presupuesto = imputacion.presupuesto ? imputacion.presupuesto : null
            const doc = docs.find((d) => d.id === imputacion.factura)
            if (doc) {
                doc.imputado = true
                updateItem(doc)
            }
        })
        const response = await imputar_documentos({ imputaciones: values.imputaciones })
        if (response.status != 201) {
            toast("Error al imputar documentos")
            return
        } else {
            toast("Documentos imputados correctamente")
            setSelectMode(false)
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            {docs.length > 0 && <DialogContent>
                <DialogHeader>
                    <DialogTitle>Imputar Documentos</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form id="imputacion_documentos" onSubmit={form.handleSubmit(onSubmit)}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Presupuesto</TableHead>
                                    <TableHead>Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docs.map((doc, index) => (
                                    <TableRow key={doc.id}>
                                        <FormField
                                            control={form.control}
                                            name={`imputaciones.${index}.factura`}
                                            defaultValue={doc.id}
                                            render={() => (
                                                
                                                <TableCell>
                                                    <FormLabel>
                                                        {docs[index].proveedor} {docs[index].serie}-{docs[index].numero} - {docs[index].cliente_proyecto}
                                                    </FormLabel>
                                                    <FormMessage />
                                                </TableCell>
                                            )}
                                        />
                                        <TableCell>
                                            <ComboboxAPI
                                                id={`imputaciones.${index}.presupuesto`}
                                                control={form.control}
                                                onItemChange={(item) => {setSaldos(prev => [item ? prev[index] = item.saldo : prev[index] = 0])}}
                                                model="presupuestos"
                                                fieldToShow="nombre"
                                                fieldToSend="id"
                                                queryParams={`cliente_proyecto__cliente_proyecto=${docs[index].cliente_proyecto}&&proveedor__razon_social=${docs[index].proveedor}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {Number(saldos[index]) - Number(docs[index].total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>

                        </Table>
                        <Button type="submit">Enviar</Button>
                    </form>
                </Form>
            </DialogContent>}
        </Dialog>
    )
}