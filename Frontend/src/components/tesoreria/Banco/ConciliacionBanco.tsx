
// Función para enviar un .csv a la API y recibir un listado con los movimientos listados en el mismo, para mostrarlos al usuario
// Y permitirle seleccionar los que deben ser cargados en el sistema
// 1. Mostrar un diálogo con un input para seleccionar el archivo .csv
// 2. Enviar el archivo a la API y esperar la respuesta
// 3. Mostrar los movimientos en un Tabs con 5 pestañas: "Transferencias", "Echeqs", "Gastos bancarios", "Pagos", "FCI". Tal como viene presentado desde la API
// 4. Permitir al usuario seleccionar los movimientos que desea cargar en el sistema.
// En la pestaña transferencias, los casos donde ya_cargado = true deben aparecer como deshabilitados con alguna tilde o algo por el estilo
// En caso que ya_cargado = false, deben tener un botón que diga "Generar OP" que disparará un dialogo
// Ejemplo de respuesta de la API:
/*              {
    "transferencias": [
        {
            "cod_concepto": "990",
            "nro_cheque": "",
            "debito": "-197301,75",
            "credito": "",
            "nro_doc": "30711980969",
            "fecha": "3/2/2025",
            "tipo": "transferencia",
            "sub_tipo": "a_terceros",
            "ya_cargado": true
        },
        {
            "cod_concepto": "990",
            "nro_cheque": "",
            "debito": "-100000",
            "credito": "",
            "nro_doc": "20439871386",
            "fecha": "31/1/2025",
            "tipo": "transferencia",
            "sub_tipo": "a_terceros",
            "ya_cargado": false
        },
*/
// Por predeteminado en la respuesta de la API apareceren como deshabilitados los que se detectan como ya cargados (se comparan por fecha/cnpj/monto/n° echeq).
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cargar_gasto_bancario, conciliacion_banco, post_generico } from "@/endpoints/api"
import { NuevaOPDialogDesdeConciliacion } from "./OPDesdeDialogConciliacion"
import { DialogPagoPlantilla } from "./DialogPagoPlantilla"
import { DialogPagoPlantillaMultiple } from "./DialogPagoPlantillaMultiple"

interface Movimiento {
    id: number
    cod_concepto: string
    concepto: string
    nro_cheque: string
    debito: string
    credito: string
    nombre: string
    nro_doc: string
    fecha: string
    tipo: string
    sub_tipo: string
    ya_cargado: boolean
    iva?: string
}

interface ApiResponse {
    transferencias: Movimiento[]
    echeqs: Movimiento[]
    gastos_bancarios: Movimiento[]
    pagos: Movimiento[]
    fci: Movimiento[]
    iva: Movimiento[]
}

const formatCurrency = (amount: number, currency: string) => {
    currency = currency.replace('$', "S")
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

export function ConciliacionBanco({ trigger, toast }: { trigger: React.ReactNode, toast: any }) {
    const [showDialog, setShowDialog] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
    const [selectedPagos, setSelectedPagos] = useState<Set<number>>(new Set())

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!file) return

        const formData = new FormData()
        formData.append("archivo", file)

        try {
            const response = await conciliacion_banco(formData)
            setApiResponse(response)
        } catch (error) {
            console.error(error)
        }
    }

    const onGenerarOPExitoso = (movimiento) => {
        setApiResponse((prev) => {
            if (!prev) return null
            return {
                ...prev,
                transferencias: prev.transferencias.map((transferencia) => {
                    if (transferencia.id === movimiento.id) {
                        return { ...transferencia, ya_cargado: true }
                    }
                    return transferencia
                })
            }
        }
        )
    }

    const onGenerarPagoExitoso = (movimiento) => {
        setApiResponse((prev) => {
            if (!prev) return null
            return {
                ...prev,
                pagos: prev.pagos.map((pago) => {
                    if (pago.id === movimiento.id) {
                        return { ...pago, ya_cargado: true }
                    }
                    return pago
                })
            }
        })
        // Quitar de seleccionados si estaba seleccionado
        setSelectedPagos(prev => {
            const newSet = new Set(prev)
            newSet.delete(movimiento.id)
            return newSet
        })
    }

    const handleTogglePagoSelection = (movimientoId: number) => {
        setSelectedPagos(prev => {
            const newSet = new Set(prev)
            if (newSet.has(movimientoId)) {
                newSet.delete(movimientoId)
            } else {
                newSet.add(movimientoId)
            }
            return newSet
        })
    }

    const handleSelectAllPagos = () => {
        if (!apiResponse) return
        const pagosDisponibles = apiResponse.pagos.filter(pago => !pago.ya_cargado)
        const todosSeleccionados = pagosDisponibles.every(pago => selectedPagos.has(pago.id))
        
        setSelectedPagos(prev => {
            const newSet = new Set(prev)
            if (todosSeleccionados) {
                // Deseleccionar todos
                pagosDisponibles.forEach(pago => newSet.delete(pago.id))
            } else {
                // Seleccionar todos
                pagosDisponibles.forEach(pago => newSet.add(pago.id))
            }
            return newSet
        })
    }

    const onGenerarPagosMultiplesExitoso = (movimientos: any[]) => {
        setApiResponse((prev) => {
            if (!prev) return null
            return {
                ...prev,
                pagos: prev.pagos.map((pago) => {
                    if (movimientos.some(mov => mov.id === pago.id)) {
                        return { ...pago, ya_cargado: true }
                    }
                    return pago
                })
            }
        })
        // Quitar de seleccionados los que fueron procesados exitosamente
        setSelectedPagos(prev => {
            const newSet = new Set(prev)
            movimientos.forEach(mov => newSet.delete(mov.id))
            return newSet
        })
    }

    const handleGenerarOP = (movimiento: Movimiento) => {
        // Implementar lógica para generar OP
        console.log("Generar OP para:", movimiento)
    }

    const handleGenerarMovimientoFCI = async (movimiento: Movimiento) => {
        try {
            movimiento.fecha = movimiento.fecha.split("/").reverse().join("-")
            let data
            if (movimiento.debito) {
                data = {
                    fecha: movimiento.fecha,
                    tipo: "suscripcion",
                    monto: movimiento.debito.replace("-", "").replace(",", "."),
                }
            } else if (movimiento.credito) {
                data = {
                    fecha: movimiento.fecha,
                    tipo: "rescate",
                    monto: movimiento.credito.replace("-", "").replace(",", "."),
                }
            } else {
                toast.error("Error: no se puede generar el movimiento FCI")
                return
            }
            const response = await post_generico({model: "fci", data: data})
            if (response.status === 201) {
                setApiResponse((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        fci: prev.fci.map((fci) => {
                            if (fci.id === movimiento.id) {
                                return { ...fci, ya_cargado: true }
                            }
                            return fci
                        })
                    }
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar el movimiento FCI: " + error.response.data)
        }
    }
             

    const handleGenerarGastoBancario = async (movimiento: Movimiento) => {
        try {
            movimiento.fecha = movimiento.fecha.split("/").reverse().join("-")
            const response = await cargar_gasto_bancario(movimiento)
            console.log(response)
            if (response.status === 201) {
                setApiResponse((prev) => {
                    if (!prev) return null
                    return {
                        ...prev,
                        gastos_bancarios: prev.gastos_bancarios.map((gasto) => {
                            if (gasto.id === movimiento.id) {
                                return { ...gasto, ya_cargado: true }
                            }
                            return gasto
                        })
                    }
                })
            } else (
                toast("Error al cargar el gasto bancario")
            )
        } catch (error) {
            console.error(error)
            toast("Error al cargar el gasto bancario: " + error.response.data)
        }
    }

    const renderTabContent = ({ movimientos, tipo }: { movimientos: Movimiento[], tipo: string }) => {
        if (tipo === "Pagos") {
            const pagosDisponibles = movimientos.filter(pago => !pago.ya_cargado)
            const todosSeleccionados = pagosDisponibles.length > 0 && pagosDisponibles.every(pago => selectedPagos.has(pago.id))
            const movimientosSeleccionados = movimientos.filter(mov => selectedPagos.has(mov.id))

            return (
                <div className="space-y-4">
                    {pagosDisponibles.length > 0 && (
                        <div className="flex gap-2 items-center justify-between bg-gray-50 p-3 rounded">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={todosSeleccionados}
                                    onCheckedChange={handleSelectAllPagos}
                                />
                                <span className="text-sm">
                                    Seleccionar todos ({selectedPagos.size} de {pagosDisponibles.length} seleccionados)
                                </span>
                            </div>
                            {selectedPagos.size > 0 && (
                                <DialogPagoPlantillaMultiple
                                    trigger={
                                        <Button variant="default">
                                            Crear {selectedPagos.size} pagos desde plantilla
                                        </Button>
                                    }
                                    toast={toast}
                                    movimientos={movimientosSeleccionados}
                                    onSuccess={onGenerarPagosMultiplesExitoso}
                                />
                            )}
                        </div>
                    )}
                    <ScrollArea className="w-full h-[600px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead>Seleccionar</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-end">Monto</TableHead>
                                    <TableHead className="text-center">Cargado</TableHead>
                                    <TableHead>Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movimientos.map((movimiento, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {!movimiento.ya_cargado && (
                                                <Checkbox
                                                    checked={selectedPagos.has(movimiento.id)}
                                                    onCheckedChange={() => handleTogglePagoSelection(movimiento.id)}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>{movimiento.fecha}</TableCell>
                                        <TableCell>{movimiento.concepto}</TableCell>
                                        <TableCell>{movimiento.sub_tipo}</TableCell>
                                        <TableCell className="text-end">{formatCurrency(Number(movimiento.credito ? movimiento.credito.replace(",", ".") : movimiento.debito.replace(",", ".")), "ARS")}</TableCell>
                                        <TableCell className="justify-items-center">
                                            {movimiento.ya_cargado ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                        </TableCell>
                                        <TableCell>
                                            {!movimiento.ya_cargado && (
                                                <DialogPagoPlantilla
                                                    trigger={<Button size="sm">Crear individual</Button>}
                                                    toast={toast}
                                                    movimiento={movimiento}
                                                    onSuccess={onGenerarPagoExitoso}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )
        }

        // Para las demás pestañas, mantener el render original
        return (
            <ScrollArea className="w-full h-[600px]">
                <Table>
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-end">Monto</TableHead>
                            {tipo === "Gastos bancarios" && <TableHead className="text-end">IVA</TableHead>}
                            {tipo === "Transferencias" && <TableHead>Razón social</TableHead>}
                            <TableHead className="text-center">Cargado</TableHead>
                            <TableHead>Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movimientos.map((movimiento, index) => (
                            <TableRow key={index}>
                                <TableCell>{movimiento.fecha}</TableCell>
                                <TableCell>{movimiento.concepto}</TableCell>
                                <TableCell>{movimiento.sub_tipo}</TableCell>
                                <TableCell className="text-end">{formatCurrency(Number(movimiento.credito ? movimiento.credito.replace(",", ".") : movimiento.debito.replace(",", ".")), "ARS")}</TableCell>
                                {tipo === "Gastos bancarios" && <TableCell className="text-end">{formatCurrency(Number(movimiento.iva ? movimiento.iva.replace(",", ".") : "0"), "ARS")}</TableCell>}
                                {tipo === "Transferencias" && <TableCell>{movimiento.nombre}</TableCell>}
                                <TableCell className="justify-items-center">
                                    {movimiento.ya_cargado ? <Check className="text-green-500" /> : <X className="text-red-500" />}
                                </TableCell>
                                <TableCell>
                                    {!movimiento.ya_cargado && (
                                        tipo === "Transferencias" ?
                                            <NuevaOPDialogDesdeConciliacion
                                                trigger={
                                                    <Button>Generar OP</Button>
                                                }
                                                toast={toast}
                                                movimiento={movimiento}
                                                onSuccess={onGenerarOPExitoso}
                                            />
                                            : tipo === "Echeqs" ? <Button onClick={() => handleGenerarOP(movimiento)}>Generar Echeq</Button>
                                                : tipo === "Gastos bancarios" ? <Button onClick={() => handleGenerarGastoBancario(movimiento)}>Generar Registro</Button>
                                                    : tipo === "FCI" ? <Button onClick={() => handleGenerarMovimientoFCI(movimiento)}>Generar Movimiento</Button>
                                                        : null)
                                    }
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        )
    }

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-6xl">
                <DialogTitle>Conciliación de banco</DialogTitle>
                <DialogDescription>
                    Conciliación a partir de archivo CSV
                    <Input type="file" accept=".csv" onChange={handleFileChange} className="my-4" />
                    <Button onClick={handleSubmit} disabled={!file}>
                        Enviar archivo
                    </Button>
                </DialogDescription>
                {apiResponse && (
                    <Tabs defaultValue="transferencias" className="w-full">
                        <div className="flex justify-center">
                            <TabsList>
                                <TabsTrigger value="transferencias">Transferencias</TabsTrigger>
                                <TabsTrigger value="echeqs">Echeqs</TabsTrigger>
                                <TabsTrigger value="gastos_bancarios">Gastos bancarios</TabsTrigger>
                                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                                <TabsTrigger value="fci">FCI</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="transferencias">{renderTabContent({ movimientos: apiResponse.transferencias, tipo: "Transferencias" })}</TabsContent>
                        <TabsContent value="echeqs">{renderTabContent({ movimientos: apiResponse.echeqs, tipo: "Echeqs" })}</TabsContent>
                        <TabsContent value="gastos_bancarios">{renderTabContent({ movimientos: apiResponse.gastos_bancarios, tipo: "Gastos bancarios" })}</TabsContent>
                        <TabsContent value="pagos">{renderTabContent({ movimientos: apiResponse.pagos, tipo: "Pagos" })}</TabsContent>
                        <TabsContent value="fci">{renderTabContent({ movimientos: apiResponse.fci, tipo: "FCI" })}</TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}