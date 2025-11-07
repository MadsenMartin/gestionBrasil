import { useState, useEffect } from "react"
import { Search, X, DollarSign, FileText, Building2 } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
//import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { get_generico_params } from "@/endpoints/api"
import { post_generico, delete_generico_data } from "@/endpoints/api"

interface ItemPresupuestoCliente {
    id: number
    cliente_proyecto_id: number
    cliente_proyecto: string
    numero: string  // Cambié de number a string
    nombre: string
    iva_considerado: number
    monto_mdo: number
    monto_mat: number
    monto: number
    gastado_mdo: number
    gastado_mat: number
    gastado: number
    saldo_mdo: number
    saldo_mat: number
    saldo: number
    nivel?: number  // Campos opcionales para jerarquía
    item_padre_id?: number | null
}

interface Registro {
    id: number
    tipo_reg: string
    caja: string
    certificado: string
    documento: string
    fecha_reg: string
    añomes_imputacion: string
    unidad_de_negocio: string
    cliente_proyecto: string
    proveedor: string
    caja_contrapartida: string
    imputacion: string
    presupuesto: string
    observacion: string
    monto_gasto_ingreso_neto: number
    iva_gasto_ingreso: number
    total_gasto_ingreso: number
    monto_op_rec: number
    moneda: string
    tipo_de_cambio: number
    realizado: boolean
    presupuesto_cliente_item_id: number | null
    tipo_gasto?: string  // MDO, MAT o null/undefined
}

interface AsignacionRegistrosDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: ItemPresupuestoCliente | null
    onRegistrosUpdated: () => void
}

const availableColumns = [
    { key: "tipo", label: "Tipo", width: "w-24" },
    { key: "tipo_gasto", label: "MDO/MAT", width: "w-20" },
    { key: "fecha", label: "Fecha", width: "w-28" },
    { key: "documento", label: "Documento", width: "w-32" },
    { key: "proveedor", label: "Proveedor", width: "w-40" },
    { key: "imputacion", label: "Imputación", width: "w-32" },
    { key: "presupuesto", label: "Presupuesto", width: "w-32" },
    { key: "observacion", label: "Observación", width: "w-64" },
    { key: "monto", label: "Monto", width: "w-32" },
    { key: "caja", label: "Caja", width: "w-24" },
]


function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-AR")
}

export function AsignacionRegistrosDialog({
    open,
    onOpenChange,
    item,
    onRegistrosUpdated,
}: AsignacionRegistrosDialogProps) {
    const [registros, setRegistros] = useState<Registro[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedRegistros, setSelectedRegistros] = useState<Set<number>>(new Set())
    const [registrosToRemove, setRegistrosToRemove] = useState<Set<number>>(new Set())
    const [saving, setSaving] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(["tipo", "tipo_gasto", "fecha", "proveedor", "imputacion", "monto", "observacion"]),
    )
    const [tiposGastoTemporales, setTiposGastoTemporales] = useState<{[key: number]: string}>({})

    useEffect(() => {
        if (open && item) {
            loadRegistros()
            setRegistrosToRemove(new Set())
        }
    }, [open, item])

    const loadRegistros = async () => {
        if (!item) return

        try {
            setLoading(true)
            const response = await get_generico_params({
                model: "registros_presupuesto_cliente",
                params: `cliente_proyecto_id=${item.cliente_proyecto_id}&item_presupuesto_id=${item.id}`,
            })
            setRegistros(response.data.results)

            // No pre-seleccionar registros, iniciar con selección vacía
            setSelectedRegistros(new Set())
        } catch (error) {
            console.error("Error loading registros:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredRegistros = registros.filter(
        (registro) =>
            registro.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            registro.observacion?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const registrosAsignados = filteredRegistros.filter((r) => 
        r.presupuesto_cliente_item_id === item?.id && !registrosToRemove.has(r.id)
    )
    const registrosDisponibles = filteredRegistros.filter((r) => 
        !r.presupuesto_cliente_item_id && !registrosToRemove.has(r.id)
    )

    const handleRegistroToggle = (registroId: number) => {
        const newSelected = new Set(selectedRegistros)
        if (newSelected.has(registroId)) {
            newSelected.delete(registroId)
            // Limpiar tipo temporal si se deselecciona
            setTiposGastoTemporales(prev => {
                const newTipos = { ...prev }
                delete newTipos[registroId]
                return newTipos
            })
        } else {
            newSelected.add(registroId)
        }
        setSelectedRegistros(newSelected)
    }

    const handleRemoveRegistro = (registroId: number) => {
        const newToRemove = new Set(registrosToRemove)
        newToRemove.add(registroId)
        setRegistrosToRemove(newToRemove)
        
        // También quitarlo de seleccionados si estaba
        const newSelected = new Set(selectedRegistros)
        newSelected.delete(registroId)
        setSelectedRegistros(newSelected)
    }

    const handleSelectAll = (registrosList: Registro[], select: boolean) => {
        const newSelected = new Set(selectedRegistros)
        registrosList.forEach((registro) => {
            // Solo procesar registros que tienen clasificación
            const tieneClasificacion = tiposGastoTemporales[registro.id] || registro.tipo_gasto
            if (!tieneClasificacion) return
            
            if (select) {
                newSelected.add(registro.id)
            } else {
                newSelected.delete(registro.id)
                // Limpiar tipo temporal si se deselecciona
                setTiposGastoTemporales(prev => {
                    const newTipos = { ...prev }
                    delete newTipos[registro.id]
                    return newTipos
                })
            }
        })
        setSelectedRegistros(newSelected)
    }

    const handleTipoGastoTemporal = (registroId: number, nuevoTipo: string) => {
        setTiposGastoTemporales(prev => ({
            ...prev,
            [registroId]: nuevoTipo
        }))
        // El checkbox ahora estará habilitado automáticamente debido a la nueva clasificación
    }

    const handleSave = async () => {
        if (!item) return

        try {
            setSaving(true)

            // Obtener registros actualmente asignados del estado original
            const currentlyAssigned = new Set(
                registros
                    .filter(r => r.presupuesto_cliente_item_id === item.id)
                    .map(r => r.id)
            )

            // Registros a agregar: están seleccionados pero no estaban asignados originalmente
            const registrosToAdd = Array.from(selectedRegistros).filter(id => !currentlyAssigned.has(id))
            
            // Registros a eliminar: los marcados para eliminación
            const registrosToDelete = Array.from(registrosToRemove)

            // Ejecutar asignaciones si hay registros para agregar
            if (registrosToAdd.length > 0) {
                // Preparar objeto con tipos de gasto para registros que los necesiten
                const registrosConTipo: {[key: string]: string} = {}
                
                registrosToAdd.forEach(registroId => {
                    const registro = registros.find(r => r.id === registroId)
                    const tipoTemporal = tiposGastoTemporales[registroId]
                    
                    // Si tiene tipo temporal o no tiene tipo_gasto original, agregar al objeto
                    if (tipoTemporal || !registro?.tipo_gasto) {
                        registrosConTipo[registroId.toString()] = tipoTemporal || 'MDO' // Default a MDO si no se especifica
                    }
                })

                try {
                    await post_generico({
                        model: "registros_presupuesto_cliente",
                        data: {
                            cliente_proyecto_id: item.cliente_proyecto_id,
                            item_presupuesto_id: item.id,
                            registro_ids: registrosToAdd,
                            registros_con_tipo: registrosConTipo
                        }
                    })
                } catch (error: any) {
                    // Manejar error específico de tipo_gasto
                    if (error.response?.data?.error?.includes("tipo de gasto")) {
                        toast.error(`Error: ${error.response.data.error}`)
                        return
                    }
                    throw error
                }
            }

            // Ejecutar eliminaciones si hay registros para eliminar
            if (registrosToDelete.length > 0) {
                await delete_generico_data({
                    model: "registros_presupuesto_cliente",
                    data: {
                        cliente_proyecto_id: item.cliente_proyecto_id,
                        item_presupuesto_id: item.id,
                        registro_ids: registrosToDelete
                    }
                })
            }

            // Limpiar tipos temporales y actualizar la lista
            setTiposGastoTemporales({})
            await loadRegistros()
            onRegistrosUpdated()
            onOpenChange(false)
            toast.success("Asignaciones guardadas correctamente")
        } catch (error) {
            console.error("Error saving assignments:", error)
            toast.error("Error al guardar las asignaciones. Por favor, intenta nuevamente.")
        } finally {
            setSaving(false)
        }
    }

    const getTotalSelectedByTipo = (tipo: 'MDO' | 'MAT') => {
        return registros
            .filter((r) => selectedRegistros.has(r.id))
            .filter((r) => {
                const tipoActual = tiposGastoTemporales[r.id] || r.tipo_gasto
                return tipoActual === tipo
            })
            .reduce((sum, r) => sum - Number(r.total_gasto_ingreso), 0)
    }

    const getRegistroIcon = (tipo: string) => {
        if (["PSF", "OPFC", "FC"].includes(tipo)) {
            return <DollarSign className="h-4 w-4 text-red-500" />
        }
        else if (["REC", "FCV", "ISF", "OPFCV", "NC"].includes(tipo)) {
            return <DollarSign className="h-4 w-4 text-green-500" />
        }
        return (
            <FileText className="h-4 w-4 text-gray-500" />
        )
    }

    const getTipoGastoBadge = (registro: Registro) => {
        const tipoActual = tiposGastoTemporales[registro.id] || registro.tipo_gasto
        
        if (!tipoActual) {
            return (
                <Select onValueChange={(value) => handleTipoGastoTemporal(registro.id, value)}>
                    <SelectTrigger className="w-20 h-6 text-xs">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MDO">MDO</SelectItem>
                        <SelectItem value="MAT">MAT</SelectItem>
                    </SelectContent>
                </Select>
            )
        }
        
        const variant = tipoActual === 'MDO' ? 'default' : 'secondary'
        const hasTemporaryChange = tiposGastoTemporales[registro.id] && !registro.tipo_gasto
        
        return (
            <div className="flex items-center gap-1">
                <Badge variant={variant} className="text-xs">{tipoActual}</Badge>
                {hasTemporaryChange && <span className="text-xs text-orange-500">*</span>}
            </div>
        )
    }

if (!item) return null
const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns)
    if (newVisible.has(columnKey)) {
        newVisible.delete(columnKey)
    } else {
        newVisible.add(columnKey)
    }
    setVisibleColumns(newVisible)
}

const renderTableCell = (registro: Registro, columnKey: string) => {
    switch (columnKey) {
        case "tipo":
            return (
                <div className="flex items-center gap-2">
                    {getRegistroIcon(registro.tipo_reg)}
                    <Badge variant="outline">{registro.tipo_reg}</Badge>
                </div>
            )
        case "tipo_gasto":
            return getTipoGastoBadge(registro)
        case "fecha":
            return formatDate(registro.fecha_reg)
        case "documento":
            return <span className="font-medium">{registro.documento}</span>
        case "proveedor":
            return registro.proveedor
        case "monto":
            return <span className="font-medium">{formatCurrency(registro.total_gasto_ingreso)}</span>
        case "observacion":
            return <span className="max-w-xs truncate">{registro.observacion}</span>
        case "caja":
            return registro.caja
        case "certificado":
            return registro.certificado
        case "imputacion":
            return registro.imputacion
        case "presupuesto":
            return registro.presupuesto
        case "unidad_negocio":
            return registro.unidad_de_negocio
        case "moneda":
            return registro.moneda
        default:
            return ""
    }
}

if (!item) return null

return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[80vw] max-h-[90vh] w-[80vw] flex flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Asignación de Gastos - {item.nombre}
                </DialogTitle>
                <DialogDescription>
                    Cliente: {item.cliente_proyecto} | Presupuesto: {formatCurrency(item.monto)}
                </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
                {/* Alert for registros without tipo_gasto */}
                {/*registros.filter(r => !r.tipo_gasto && !r.presupuesto_cliente_item_id).length > 0 && (
                    <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Hay {registros.filter(r => !r.tipo_gasto && !r.presupuesto_cliente_item_id).length} registro(s) sin tipo de gasto (MDO/MAT) asignado. 
                            Estos registros están deshabilitados hasta que les asignes un tipo desde la columna "MDO/MAT".
                        </AlertDescription>
                    </Alert>
                )*/}

                {/* Stats Cards - Versión simplificada */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm">Presupuesto Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{formatCurrency(item.monto)}</div>
                            <div className="text-xs space-y-1 mt-1">
                                <div className="flex justify-between">
                                    <span className="text-blue-600">MDO:</span>
                                    <span className="text-blue-600">
                                        {formatCurrency(item.monto_mdo)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600">MAT:</span>
                                    <span className="text-green-600">
                                        {formatCurrency(item.monto_mat)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm">Gastado Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-red-600">{formatCurrency(item.gastado)}</div>
                            <div className="text-xs space-y-1 mt-1">
                                <div className="flex justify-between">
                                    <span className="text-blue-600">MDO:</span>
                                    <span className="text-red-600">
                                        {formatCurrency(item.gastado_mdo)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600">MAT:</span>
                                    <span className="text-red-600">
                                        {formatCurrency(item.gastado_mat)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm">Saldo Disponible</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-lg font-bold ${item.saldo < 0 ? "text-red-600" : "text-green-600"}`}>
                                {formatCurrency(item.saldo)}
                            </div>
                            <div className="text-xs space-y-1 mt-1">
                                <div className="flex justify-between">
                                    <span className="text-blue-600">MDO:</span>
                                    <span className={item.saldo_mdo < 0 ? "text-red-600" : "text-green-600"}>
                                        {formatCurrency(item.saldo_mdo)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600">MAT:</span>
                                    <span className={item.saldo_mat < 0 ? "text-red-600" : "text-green-600"}>
                                        {formatCurrency(item.saldo_mat)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por proveedor u observación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Column Selector */}
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium">Columnas visibles:</span>
                    <div className="flex flex-wrap gap-2">
                        {availableColumns.map((column) => (
                            <Button
                                key={column.key}
                                variant={visibleColumns.has(column.key) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleColumn(column.key)}
                                className="h-7 text-xs"
                            >
                                {column.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="asignados" className="flex-1">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="disponibles">Disponibles ({registrosDisponibles.length})</TabsTrigger>
                        <TabsTrigger value="asignados">Asignados ({registrosAsignados.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="disponibles" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Registros Disponibles</CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleSelectAll(registrosDisponibles, true)}>
                                            Seleccionar Todos
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleSelectAll(registrosDisponibles, false)}>
                                            Deseleccionar Todos
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                {availableColumns
                                                    .filter((col) => visibleColumns.has(col.key))
                                                    .map((column) => (
                                                        <TableHead key={column.key} className={column.key === "monto" ? "text-right" : ""}>
                                                            {column.label}
                                                        </TableHead>
                                                    ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={visibleColumns.size + 1} className="text-center py-8">
                                                        Cargando registros...
                                                    </TableCell>
                                                </TableRow>
                                            ) : registrosDisponibles.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={visibleColumns.size + 1}
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No hay registros disponibles
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                registrosDisponibles.map((registro) => {
                                                    const tieneClasificacion = tiposGastoTemporales[registro.id] || registro.tipo_gasto
                                                    return (
                                                        <TableRow 
                                                            key={registro.id} 
                                                            className={!tieneClasificacion ? "bg-gray-50 dark:bg-gray-900/50" : ""}
                                                        >
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedRegistros.has(registro.id)}
                                                                    onCheckedChange={() => handleRegistroToggle(registro.id)}
                                                                    disabled={!tieneClasificacion}
                                                                />
                                                            </TableCell>
                                                            {availableColumns
                                                                .filter((col) => visibleColumns.has(col.key))
                                                                .map((column) => (
                                                                    <TableCell key={column.key} className={column.key === "monto" ? "text-right" : ""}>
                                                                        {renderTableCell(registro, column.key)}
                                                                    </TableCell>
                                                                ))}
                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="asignados" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Registros Asignados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                {availableColumns
                                                    .filter((col) => visibleColumns.has(col.key))
                                                    .map((column) => (
                                                        <TableHead key={column.key} className={column.key === "monto" ? "text-right" : ""}>
                                                            {column.label}
                                                        </TableHead>
                                                    ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {registrosAsignados.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={visibleColumns.size + 1}
                                                        className="text-center py-8 text-muted-foreground"
                                                    >
                                                        No hay registros asignados
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                registrosAsignados.map((registro) => (
                                                    <TableRow key={registro.id}>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveRegistro(registro.id)}>
                                                                <X className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                        {availableColumns
                                                            .filter((col) => visibleColumns.has(col.key))
                                                            .map((column) => (
                                                                <TableCell key={column.key} className={column.key === "monto" ? "text-right" : ""}>
                                                                    {renderTableCell(registro, column.key)}
                                                                </TableCell>
                                                            ))}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Separator />

            {/* Footer simplificado */}
            <div className="flex items-center justify-between pt-1">
                <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                        {selectedRegistros.size} registros para asignar | {registrosToRemove.size} marcados para eliminar
                    </div>
                    {selectedRegistros.size > 0 && (
                        <div className="text-xs">
                            Nuevos gastos: MDO: {formatCurrency(getTotalSelectedByTipo('MDO'))} | MAT: {formatCurrency(getTotalSelectedByTipo('MAT'))}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar Asignaciones"}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
)
}
