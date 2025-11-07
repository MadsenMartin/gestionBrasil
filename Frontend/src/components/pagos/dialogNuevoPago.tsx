import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SelectComponent } from "@/components/comboboxes/SelectAPI"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Caja, Documento, Imputacion, UnidadDeNegocio, ClienteProyecto, PagoFactura } from "@/types/genericos"
import { useState } from "react"

type FormData = {
    caja: string
    documento: string
    fecha_reg: string
    añomes_imputacion: number
    unidad_de_negocio: string
    cliente_proyecto: string
    imputacion: string
    observacion: string
    monto_gasto_ingreso_neto: number
    iva_gasto_ingreso: number
    monto_op_rec: number
    moneda: string
    tipo_de_cambio: number
    archivo: FileList | File
}

interface DialogNuevoPagoProps {
    pagos: PagoFactura[]
    setPagos: (value: PagoFactura[]) => void
    cajas: Caja[]
    documentos: Documento[]
    unidades_de_negocio: UnidadDeNegocio[]
    clientes_proyectos: ClienteProyecto[]
    imputaciones: Imputacion[]
}

export function DialogNuevoPago({ pagos, setPagos, cajas, documentos, unidades_de_negocio, clientes_proyectos, imputaciones }: DialogNuevoPagoProps) {
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>()
    const [showForm, setShowForm] = useState(false)

    const onSubmit = async (data: FormData) => {
        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'archivo' && value instanceof FileList) {
                    formData.append(key, value[0])
                } else {
                    formData.append(key, value as string)
                }
            })

            const response = await axios.post('http://192.168.1.75:8000/api/tesoreria/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            if (response.status == 201) {
                setPagos([...pagos, response.data])
                reset()
                setShowForm(false)
                toast.success("Registro creado exitosamente")
            } else {
                throw new Error(response.data)
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error("Error al crear el registro")
        }
    };

    return (
        <Dialog
            open={showForm}
            onOpenChange={() => setShowForm(false)}
            aria-labelledby="form-dialog-title"
        >
            <DialogTrigger asChild>
                <Button>Cargar Nuevo Registro</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogTitle id="form-dialog-title">Detalle</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="caja">Caja</Label>
                        <SelectComponent
                            id="caja"
                            control={control}
                            error={errors.caja}
                            data={cajas}
                            fieldToShow="caja"
                            fieldToSend="id"
                        />
                        {errors.caja && <p className="text-red-500">{errors.caja.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="documento">Documento</Label>
                        <SelectComponent
                            id="documento"
                            control={control}
                            error={errors.documento}
                            data={documentos}
                            fieldToShow="numero"
                            fieldToSend="id"
                        />
                        {errors.documento && <p className="text-red-500">{errors.documento.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fecha_reg">Fecha de registro</Label>
                        <Input
                            id="fecha_reg"
                            type="date"
                            {...register("fecha_reg", { required: "Este campo es requerido" })}
                        />
                        {errors.fecha_reg && <p className="text-red-500">{errors.fecha_reg.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="añomes_imputacion">Año y mes de imputación</Label>
                        <Input
                            id="añomes_imputacion"
                            type="number"
                            {...register("añomes_imputacion", { required: "Este campo es requerido" })}
                        />
                        {errors.añomes_imputacion && <p className="text-red-500">{errors.añomes_imputacion.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unidad_de_negocio">Unidad de negocio</Label>
                        <SelectComponent
                            id="unidad_de_negocio"
                            control={control}
                            error={errors.unidad_de_negocio}
                            data={unidades_de_negocio}
                            fieldToShow="unidad_de_negocio"
                            fieldToSend="id"
                        />
                        {errors.unidad_de_negocio && <p className="text-red-500">{errors.unidad_de_negocio.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cliente_proyecto">Cliente/Proyecto</Label>
                        <SelectComponent
                            id="cliente_proyecto"
                            control={control}
                            error={errors.cliente_proyecto}
                            data={clientes_proyectos}
                            fieldToShow="nombre"
                            fieldToSend="id"
                        />
                        {errors.cliente_proyecto && <p className="text-red-500">{errors.cliente_proyecto.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="imputacion">Imputación</Label>
                        <SelectComponent
                            id="imputacion"
                            control={control}
                            error={errors.imputacion}
                            data={imputaciones}
                            fieldToShow="imputacion"
                            fieldToSend="id"
                        />
                        {errors.imputacion && <p className="text-red-500">{errors.imputacion.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="observacion">Observación</Label>
                        <Input
                            id="observacion"
                            {...register("observacion", { maxLength: { value: 200, message: "Máximo 200 caracteres" } })}
                        />
                        {errors.observacion && <p className="text-red-500">{errors.observacion.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="monto_gasto_ingreso_neto">Monto gasto/ingreso neto</Label>
                        <Input
                            id="monto_gasto_ingreso_neto"
                            type="number"
                            {...register("monto_gasto_ingreso_neto", { required: "Este campo es requerido" })}
                        />
                        {errors.monto_gasto_ingreso_neto && <p className="text-red-500">{errors.monto_gasto_ingreso_neto.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="iva_gasto_ingreso">IVA gasto/ingreso</Label>
                        <Input
                            id="iva_gasto_ingreso"
                            type="number"
                            {...register("iva_gasto_ingreso", { required: "Este campo es requerido" })}
                        />
                        {errors.iva_gasto_ingreso && <p className="text-red-500">{errors.iva_gasto_ingreso.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="monto_op_rec">Monto op/rec</Label>
                        <Input
                            id="monto_op_rec"
                            type="number"
                            {...register("monto_op_rec", { required: "Este campo es requerido" })}
                        />
                        {errors.monto_op_rec && <p className="text-red-500">{errors.monto_op_rec.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="moneda">Moneda</Label>
                        <Input
                            id="moneda"
                            {...register("moneda", { maxLength: { value: 3, message: "Máximo 3 caracteres" } })}
                        />
                        {errors.moneda && <p className="text-red-500">{errors.moneda.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tipo_de_cambio">Tipo de cambio</Label>
                        <Input
                            id="tipo_de_cambio"
                            type="number"
                            {...register("tipo_de_cambio", { required: "Este campo es requerido" })}
                        />
                        {errors.tipo_de_cambio && <p className="text-red-500">{errors.tipo_de_cambio.message}</p>}
                    </div>
                    <Button type="submit" className="mt-4 w-full">Guardar</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}