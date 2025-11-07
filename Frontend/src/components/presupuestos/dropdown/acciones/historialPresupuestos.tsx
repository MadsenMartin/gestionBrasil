import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, User, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { get_generico_pk } from "@/endpoints/api"
import { useEffect, useState } from "react"
import { formatDate } from "@/pages/tesoreria/dolarMEP"

interface EstadoPresupuesto {
  id: number
  estado: string
  usuario: string
  fecha: string
  presupuesto: string
  observacion: string
}

interface EstadosPresupuestoDialogProps {
  isOpen: boolean
  onClose: any
  presupuesto_id: number
}

export function EstadosPresupuestoDialog({ isOpen, onClose, presupuesto_id }: EstadosPresupuestoDialogProps) {
    const [states, setStates] = useState<EstadoPresupuesto[]>([])
    useEffect(() => {
        const obtener_states = async () => {
            const response = await get_generico_pk({model: 'estados_presupuesto', id:presupuesto_id})
            setStates(response.data)
        }
        if (isOpen) obtener_states()
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[95vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Badge variant="secondary">{states[0]?.presupuesto}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>
                <DialogDescription>
                    Historial del presupuesto
                </DialogDescription>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {states?.map((state) => (
                  <Card key={state.id} className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={state.estado === "Eliminado" ? "destructive" : "default"}
                            className="h-8 w-24 justify-center text-sm"
                          >
                            {state.estado}
                          </Badge>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {state.usuario}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              {state.fecha.length > 10 ? format(new Date(state.fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es }): formatDate(state.fecha)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">#{state.id}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}