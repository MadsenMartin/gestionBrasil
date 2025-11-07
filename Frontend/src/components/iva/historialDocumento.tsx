import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, User, Calendar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { get_historial_documento } from "@/endpoints/api"
import { useEffect, useState } from "react"
import { DialogTrigger } from "@radix-ui/react-dialog"

interface DocumentState {
  id: number
  estado: string
  usuario: string
  timestamp: string
  documento: number
}

interface DialogoEstadosDocumentoProps {
  documento_id: number
  documento_str: string
  trigger: React.ReactNode
}

export function DialogoEstadosDocumento({ documento_id, documento_str, trigger }: DialogoEstadosDocumentoProps) {
    const [states, setStates] = useState<DocumentState[]>([])
    const [isOpen, setIsOpen] = useState(false)
    useEffect(() => {
        const obtener_states = async () => {
            const states = await get_historial_documento(documento_id)
            setStates(states)
        }
        isOpen && obtener_states()
    }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>

      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>

      <DialogContent className="max-h-[95vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Badge variant="secondary">{documento_str}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Historial del documento</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {states.map((state) => (
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
                              {format(new Date(state.timestamp), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
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