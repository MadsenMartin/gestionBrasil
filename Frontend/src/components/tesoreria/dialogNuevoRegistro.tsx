import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DialogDescription } from "@radix-ui/react-dialog"
import { post_generico } from "@/endpoints/api"
import { ScrollArea } from "../ui/scroll-area"
import { Label } from "../ui/label"
import { Checkbox } from "../ui/checkbox"
import { ComboboxAPI, ComboboxAPIFormless } from "../comboboxes/ComboboxAPI"
import { CircleX, Loader2 } from "lucide-react"
import { combinacionesDisabled } from "./validacion"
import { Separator } from "../ui/separator"

const formSchema = z.object({
  caja: z.coerce.number().min(1, 'Campo requerido'),
  fecha_reg: z.string(),
  tipo_reg: z.string(),
  añomes_imputacion: z.coerce.number().int(),
  unidad_de_negocio: z.number().int().optional(),
  cliente_proyecto: z.number().int().optional(),
  caja_contrapartida: z.number().int().optional(),
  proveedor: z.number().int().optional(),
  imputacion: z.number().int().optional(),
  observacion: z.string().optional(),
  presupuesto: z.coerce.number().int().optional(),
  monto_gasto_ingreso_neto: z.coerce.number().optional(),
  iva_gasto_ingreso: z.coerce.number().optional(),
  monto_op_rec: z.coerce.number().optional(),
  moneda: z.coerce.number().optional(),
  tipo_de_cambio: z.coerce.number().optional()
})

type DialogNuevoRegistroProps = {
  toast: Function
  trigger: React.ReactNode
  addItem: (newItem: any) => void
}

/**
 * DialogoNuevoRegistro es un componente que renderiza un diálogo para crear un nuevo registro de caja.
 * 
 * @param {Function} toast - La función toast para mostrar mensajes.
 * @param {React.ReactNode} trigger - El elemento que activa el diálogo.
 * @param {Function} addItem - Función para agregar un nuevo item a la lista de registros.
 */
export function DialogoNuevoRegistro({ toast, trigger, addItem }: DialogNuevoRegistroProps) {
  const [open, setOpen] = useState(false)
  const [tipoReg, setTipoReg] = useState('')
  const [contraPresupuesto, setContraPresupuesto] = useState(false)
  const [moneda, setMoneda] = useState(1)
  const [saldoPpto, setSaldoPpto] = useState(0)
  const [nuevoSaldoPpto, setNuevoSaldoPpto] = useState(0)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [plantilla, setPlantilla] = useState<Plantilla>(null)

  const date = new Date().toISOString().split('T')[0]
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caja: 0,
      fecha_reg: date,
      observacion: '',
      monto_gasto_ingreso_neto: 0,
      iva_gasto_ingreso: 0,
      monto_op_rec: 0,
      tipo_reg: '',
      añomes_imputacion: Number(date.split('-')[0] + date.split('-')[1]),
      moneda: 1,
      tipo_de_cambio: 1,
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
  }

  // De esta forma se puede saber si un campo debe estar deshabilitado, se busca la combinacion del tipoReg y el campo en el array de arriba y si se encuentra se deshabilita
  const setDisabled = (campo: keyof z.infer<typeof formSchema> | string) => {
    return combinacionesDisabled.some(
      ([tipo, campoDisabled]) => tipo === tipoReg && campoDisabled === campo
    )
  }

  // De esta forma al deshabilitar un campo se limpia el valor del mismo
  useEffect(() => {
    combinacionesDisabled.forEach(([tipo, campoDisabled]) => {
      if (tipo === tipoReg && campoDisabled in formSchema.shape) {
        form.setValue(campoDisabled as keyof z.infer<typeof formSchema>, undefined)
      } else if (campoDisabled === 'contra_presupuesto' && tipo === tipoReg) {
        form.setValue('presupuesto', undefined)
        setContraPresupuesto(false)
      }
    })
  }, [tipoReg])

  const presupuesto = form.watch('presupuesto');
  const montoGastoIngresoNeto = form.watch('monto_gasto_ingreso_neto');
  const ivaGastoIngreso = form.watch('iva_gasto_ingreso');
  const tipoDeCambio = form.watch('tipo_de_cambio');

  useEffect(() => {
    if (presupuesto === undefined) {
      setSaldoPpto(0)
      setNuevoSaldoPpto(0)
    } else {
      setNuevoSaldoPpto((Number(saldoPpto)) + (Number(montoGastoIngresoNeto) * Number(tipoDeCambio)) + (Number(ivaGastoIngreso) * Number(tipoDeCambio)))
    }

  }, [presupuesto, montoGastoIngresoNeto, ivaGastoIngreso, tipoDeCambio])

  // De esta forma limpio el campo de presupuesto
  // TODO: Creo que con el render condicional no es necesario
  const _setContraPresupuesto = (value) => {
    setContraPresupuesto(value)
    form.setValue('presupuesto', undefined)
  }

  /**
   * Maneja el evento de submit del formulario.
   * 
   * @param {z.infer<typeof formSchema>} values - Los valores del formulario.
   */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setError(false)
      setSending(true)

      // Create object with all schema fields, null for disabled ones
      const allFields = Object.keys(formSchema.shape) as Array<keyof z.infer<typeof formSchema>>;
      const cleanValues = {} as any;
      
      allFields.forEach(key => {
        if (setDisabled(key)) {
          cleanValues[key] = null;
        } else {
          cleanValues[key] = values[key];
        }
      });

      const response = await post_generico({ model: 'registros', data: cleanValues })
      console.log(response)
      if (response.status === 201) {
        setSending(false)
        toast('Registro creado correctamente')
        setOpen(false)
        form.reset()
        setTipoReg('')
        addItem(response.data)
      } else {
        toast(response.data)
        setSending(false)
        setError(true)
      }
    } catch (error) {
      console.error(error)
      toast('Error al crear el registro: ' + error)
      setSending(false)
      setError(true)
    }
  }

  type Plantilla = {
    tipo_reg: string
    unidad_de_negocio: number
    unidad_de_negocio_label: string
    cliente_proyecto: number
    cliente_proyecto_label: string
    proveedor: number
    proveedor_label: string
    imputacion: number
    imputacion_label: string
    observacion: string
  }

  useEffect(() => {
    if (plantilla) {
      form.reset() // Evito que se mantengan los valores ocultos por validación
      setTipoReg(plantilla.tipo_reg)
      form.setValue('tipo_reg', plantilla.tipo_reg)
      form.setValue('unidad_de_negocio', plantilla.unidad_de_negocio)
      form.setValue('cliente_proyecto', plantilla.cliente_proyecto)
      form.setValue('proveedor', plantilla.proveedor)
      form.setValue('imputacion', plantilla.imputacion)
      plantilla.observacion && form.setValue('observacion', plantilla.observacion)
    }
  }, [plantilla])

  return (
    <Dialog open={open} onOpenChange={(open) => {
      setOpen(open);
      if (!open) {
        form.reset();
        setTipoReg('');
      }
    }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-slate-50 dark:bg-black dark:text-white">
        <DialogHeader>
          <DialogTitle>Nuevo Registro</DialogTitle>
        </DialogHeader>
        <Separator/>
        <Label>Plantilla</Label>
        <ComboboxAPIFormless
          model="plantillas_registros"
          fieldToSend="id"
          fieldToShow="nombre"
          onItemChange={(item) => setPlantilla(item)}
          className="w-full mb-4"
        />


        <ScrollArea className="max-h-[calc(100vh-250px)]">
          <Form {...form}>
            <form id='nuevoRegistroForm' onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <Card>
                <CardContent className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <ComboboxAPI
                      id="caja"
                      model="cajas"
                      fieldToShow="caja"
                      fieldToSend="id"
                      control={form.control}
                      className="w-full"
                      onItemChange={(item) => {
                        if (item) {
                          setMoneda(item.moneda);
                          form.setValue('moneda', item.moneda);
                        } else {
                          setMoneda(0);
                          form.setValue('moneda', 0);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <ComboboxAPI
                      id="tipo_reg"
                      model="tipos_reg"
                      fieldToShow="tipo"
                      fieldToSend="tipo"
                      control={form.control}
                      className="w-full"
                      onValueChange={(value) => setTipoReg(String(value))}
                      initialLabel={plantilla?.tipo_reg}

                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <FormField
                        control={form.control}
                        name="fecha_reg"
                        render={({ field }) => {
                          return <FormItem>
                            <FormLabel>Fecha</FormLabel>
                            <FormControl>
                              <Input type="date" placeholder='Fecha' {...field} />
                            </FormControl>
                            <FormDescription>Fecha del gasto/ingreso</FormDescription>
                            <FormMessage />
                          </FormItem>
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FormField control={form.control} name="añomes_imputacion" render={({ field }) => {
                      return <FormItem>
                        <FormLabel>Mes de devengado</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder='Mes de devengado' {...field} />
                        </FormControl>
                        <FormDescription>Mes al que corresponde el gasto/ingreso</FormDescription>
                        <FormMessage />
                      </FormItem>
                    }}
                    />
                  </div>
                  {!setDisabled('unidad_de_negocio') &&
                    <div className="space-y-2">
                      <ComboboxAPI
                        id="unidad_de_negocio"
                        model="unidades_de_negocio"
                        fieldToShow="unidad_de_negocio"
                        fieldToSend="id"
                        control={form.control}
                        className="w-full"
                        disabled={setDisabled('unidad_de_negocio')}
                        initialLabel={plantilla?.unidad_de_negocio_label}
                      />
                    </div>
                  }
                  {!setDisabled('cliente_proyecto') &&
                    <div className="space-y-2">
                      <ComboboxAPI
                        id="cliente_proyecto"
                        model="clientes_proyectos"
                        fieldToShow="cliente_proyecto"
                        fieldToSend="id"
                        control={form.control}
                        className="w-full"
                        disabled={setDisabled('cliente_proyecto')}
                        initialLabel={plantilla?.cliente_proyecto_label}
                      />
                    </div>
                  }
                  {!setDisabled('caja_contrapartida') &&
                    <div className="space-y-2">
                      <ComboboxAPI
                        id="caja_contrapartida"
                        model="cajas"
                        fieldToShow="caja"
                        fieldToSend="id"
                        control={form.control}
                        className="w-full"
                        disabled={setDisabled('caja_contrapartida')}
                      />
                    </div>
                  }
                  {!setDisabled('proveedor') &&
                    <div className="space-y-2">
                      <ComboboxAPI
                        id="proveedor"
                        model="proveedores"
                        fieldToShow="nombre"
                        fieldToSend="id"
                        control={form.control}
                        className="w-full"
                        disabled={setDisabled('proveedor')}
                        initialLabel={plantilla?.proveedor_label}
                      />
                    </div>
                  }
                  {!setDisabled('imputacion') &&
                    <div className="space-y-2">
                      <ComboboxAPI
                        id="imputacion"
                        model="imputaciones"
                        fieldToShow="imputacion"
                        fieldToSend="id"
                        control={form.control}
                        className="w-full"
                        disabled={setDisabled('imputacion')}
                        initialLabel={plantilla?.imputacion_label}
                      />
                    </div>
                  }
                  <div className="col-span-2">
                    <FormField control={form.control} name="observacion" render={({ field }) => {
                      return <FormItem>
                        <FormLabel>Observación</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder='Observación' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    }}
                    />
                  </div>
                  {!setDisabled('contra_presupuesto') && tipoReg !== '' &&
                    <div className="flex items-center space-x-2">
                      <Label>Contra presupuesto</Label>
                      <Checkbox
                        onCheckedChange={(checked) => _setContraPresupuesto(checked === true)}
                        disabled={
                          form.getValues('cliente_proyecto') === undefined ||
                          form.getValues('proveedor') === undefined
                        }
                      />
                    </div>
                  }
                  <div className="space-y-2">
                    {contraPresupuesto &&
                      <div>
                        <ComboboxAPI
                          id="presupuesto"
                          model="presupuestos"
                          fieldToShow="nombre"
                          fieldToSend="id"
                          queryParams={`cliente_proyecto_id=${form.getValues('cliente_proyecto')}&proveedor_id=${form.getValues('proveedor')}`}
                          control={form.control}
                          className="w-full"
                          disabled={!contraPresupuesto}
                          setSaldoPpto={setSaldoPpto}
                        />
                        {(nuevoSaldoPpto !== 0 && form.watch('presupuesto')) &&
                          <FormDescription className={nuevoSaldoPpto < 0 ? "text-red-600" : ''}>Saldo del presupuesto: {formatCurrency(nuevoSaldoPpto)}</FormDescription>
                        }
                      </div>
                    }
                  </div>
                </CardContent>
              </Card>
              {tipoReg !== '' &&
                <Card>
                  <CardContent className="grid grid-cols-2 gap-4 pt-4">
                    {moneda != 1 &&
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="tipo_de_cambio"
                          render={({ field }) => {
                            return <FormItem>
                              <FormLabel>Tipo de cambio</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder='Tipo de cambio' {...field} />
                              </FormControl>
                              <FormDescription>
                                En caso de dejar 1 se tomará la cotización MEP cargada/ a cargar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          }}
                        />
                      </div>
                    }
                    {!setDisabled('monto_gasto_ingreso_neto') &&
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="monto_gasto_ingreso_neto"
                          render={({ field }) => {
                            return <FormItem>
                              <FormLabel>Neto</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder='Neto' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          }}
                        />
                      </div>
                    }
                    {!setDisabled('iva_gasto_ingreso') &&
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="iva_gasto_ingreso"
                          render={({ field }) => {
                            return <FormItem>
                              <FormLabel>IVA</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder='IVA' {...field} disabled={setDisabled('iva_gasto_ingreso')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          }}
                        />
                      </div>
                    }
                    {!setDisabled('monto_op_rec') &&
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="monto_op_rec"
                          render={({ field }) => {
                            return <FormItem>
                              <FormLabel>Monto OP/REC</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder='Monto OP/REC' {...field} disabled={setDisabled('monto_op_rec')} />
                              </FormControl>
                              <FormDescription>
                                Monto total del registro en la moneda de la caja
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          }}
                        />
                      </div>
                    }
                  </CardContent>
                </Card>
              }
            </form>
          </Form>
        </ScrollArea>
        <div className="flex justify-end space-x-2 mt-4">
          <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset(); setTipoReg('') }}>
            Cancelar
          </Button>
          <DialogDescription />
          <Button form="nuevoRegistroForm" disabled={tipoReg === '' || sending} variant={error ? "destructive" : "default"} type="submit">
            Enviar
            {sending && <Loader2 className="animate-spin" size={16} />}
            {error && <CircleX size={16} />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
