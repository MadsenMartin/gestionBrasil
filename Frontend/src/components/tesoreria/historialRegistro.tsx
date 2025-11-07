import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, User, Calendar, Edit, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useState } from "react"
import { get_historial_registro } from "@/endpoints/api"

interface HistoricalRecord {
  history_id: number
  history_date: string
  history_type: string
  history_type_display: string
  history_user: string | null
  id: number
  tipo_reg: string
  fecha_reg: string
  monto_gasto_ingreso_neto: number | null
  iva_gasto_ingreso: number | null
  monto_op_rec: number | null
  observacion: string | null
  realizado: boolean
  activo: boolean
  moneda: number
  tipo_de_cambio: number | null
  proveedor_nombre: string | null
  cliente_proyecto_nombre: string | null
  imputacion_nombre: string | null
  caja_nombre: string | null
}

interface FieldChange {
  field: string
  fieldLabel: string
  oldValue: any
  newValue: any
}

interface HistorialRegistroDialogProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  registro_id: number
  registro_str: string
}

function getHistoryTypeIcon(type: string) {
  switch (type) {
    case '+':
      return <Plus className="h-4 w-4" />
    case '~':
      return <Edit className="h-4 w-4" />
    case '-':
      return <Trash2 className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getHistoryTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" {
  switch (type) {
    case '+':
      return "default"
    case '~':
      return "secondary"
    case '-':
      return "destructive"
    default:
      return "secondary"
  }
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "N/A"
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount)
}

// Mapeo de campos técnicos a etiquetas legibles
const fieldLabels: { [key: string]: string } = {
  tipo_reg: 'Tipo de Registro',
  fecha_reg: 'Fecha de Registro',
  monto_gasto_ingreso_neto: 'Monto Neto',
  iva_gasto_ingreso: 'IVA',
  monto_op_rec: 'Monto OP/REC',
  observacion: 'Observación',
  realizado: 'Realizado',
  activo: 'Activo',
  moneda: 'Moneda',
  tipo_de_cambio: 'Tipo de Cambio',
  proveedor_nombre: 'Proveedor',
  cliente_proyecto_nombre: 'Cliente/Proyecto',
  imputacion_nombre: 'Imputación',
  caja_nombre: 'Caja'
}

// Campos que queremos comparar para detectar cambios
const fieldsToCompare = [
  'tipo_reg', 'fecha_reg', 'monto_gasto_ingreso_neto', 'iva_gasto_ingreso', 
  'monto_op_rec', 'observacion', 'realizado', 'activo', 'moneda', 'tipo_de_cambio',
  'proveedor_nombre', 'cliente_proyecto_nombre', 'imputacion_nombre', 'caja_nombre'
]

function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) return "N/A"
  
  switch (field) {
    case 'monto_gasto_ingreso_neto':
    case 'iva_gasto_ingreso':
    case 'monto_op_rec':
      return formatCurrency(value)
    case 'realizado':
    case 'activo':
      return value ? 'Sí' : 'No'
    case 'fecha_reg':
      return value ? format(new Date(value), "dd/MM/yyyy") : "N/A"
    case 'moneda':
      return value === 1 ? 'ARS' : value === 2 ? 'USD' : `Moneda ${value}`
    default:
      return String(value)
  }
}

function compareRecords(current: HistoricalRecord, previous: HistoricalRecord | null): FieldChange[] {
  if (!previous) {
    // Si es el primer registro, mostrar todos los campos como "nuevos"
    return fieldsToCompare
      .filter(field => current[field] !== null && current[field] !== undefined && current[field] !== '')
      .map(field => ({
        field,
        fieldLabel: fieldLabels[field] || field,
        oldValue: null,
        newValue: current[field]
      }))
  }

  // Comparar campos y encontrar diferencias
  const changes: FieldChange[] = []
  
  for (const field of fieldsToCompare) {
    const currentValue = current[field]
    const previousValue = previous[field]
    
    if (currentValue !== previousValue) {
      changes.push({
        field,
        fieldLabel: fieldLabels[field] || field,
        oldValue: previousValue,
        newValue: currentValue
      })
    }
  }
  
  return changes
}

export function HistorialRegistroDialog({ isOpen, onClose, registro_id, registro_str }: HistorialRegistroDialogProps) {
  const [records, setRecords] = useState<HistoricalRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isOpen || !registro_id) return
      
      setLoading(true)
      try {
        const response = await get_historial_registro(registro_id)
        setRecords(response || [])
      } catch (error) {
        console.error('Error fetching registro history:', error)
        setRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [isOpen, registro_id])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5" />
            Historial del Registro
            <Badge variant="secondary">{registro_str}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Cambios realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Cargando historial...</div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No hay historial disponible</p>
                <p className="text-sm">Este registro no tiene cambios registrados o se creó antes de activar el sistema de historial.</p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  {records.map((record, index) => {
                    const previousRecord = records[index + 1] || null
                    const changes = compareRecords(record, previousRecord)
                    
                    return (
                      <div
                        key={record.history_id}
                        className="flex gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            {getHistoryTypeIcon(record.history_type)}
                          </div>
                          {index < records.length - 1 && (
                            <div className="w-px h-full bg-border"></div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getHistoryTypeBadgeVariant(record.history_type)}>
                              {record.history_type_display}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(record.history_date), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </div>
                            {record.history_user && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                {record.history_user}
                              </div>
                            )}
                          </div>

                          {changes.length > 0 ? (
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-foreground">
                                {record.history_type === '+' 
                                  ? 'Registro creado con los siguientes valores:' 
                                  : record.history_type === '~' 
                                    ? 'Campos modificados:' 
                                    : 'Registro eliminado'}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {changes.map((change) => (
                                  <div key={change.field} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                    <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">
                                      {change.fieldLabel}:
                                    </span>
                                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                      {change.oldValue !== null && record.history_type === '~' && (
                                        <>
                                          <span className="text-red-700 bg-red-100 px-2 py-1 rounded text-xs min-w-0 truncate border border-red-200">
                                            {formatFieldValue(change.field, change.oldValue)}
                                          </span>
                                          <span className="text-muted-foreground font-bold">→</span>
                                        </>
                                      )}
                                      <span className={`px-2 py-1 rounded text-xs min-w-0 truncate ${
                                        record.history_type === '+' 
                                          ? 'text-green-600 bg-green-50' 
                                          : record.history_type === '~' 
                                            ? 'text-blue-600 bg-blue-50' 
                                            : 'text-red-600 bg-red-50'
                                      }`}>
                                        {formatFieldValue(change.field, change.newValue)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              No se detectaron cambios específicos en este registro.
                            </div>
                          )}

                          {record.observacion && record.history_type === '+' && (
                            <div className="space-y-1">
                              <span className="font-medium text-muted-foreground text-sm">Observación inicial:</span>
                              <p className="text-sm bg-muted/50 p-2 rounded">{record.observacion}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}