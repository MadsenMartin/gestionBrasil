import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Documento } from "@/types/genericos"
import { useState } from "react"

export function DetalleDocumento({ currentDoc = null, trigger }: {currentDoc?: Documento | null, trigger: React.ReactNode}) {
    const [openDialog, setOpenDialog] = useState(false)
    const isPDF = currentDoc?.archivo?.toLowerCase().endsWith('.pdf')
  
    return (
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>

        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>

        <DialogContent className="max-w-5xl w-full max-h-screen">
          <DialogHeader>
            <DialogTitle>Detalle del documento {currentDoc?.tipo_documento} {currentDoc?.serie}-{currentDoc?.numero}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 w-full">
            <div className="w-2/3">
              {isPDF ? (
                <iframe
                  src={currentDoc?.archivo}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    No se puede mostrar una vista previa. El archivo no es un PDF o no existe.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <ScrollArea className="w-1/3 h-full">
              <Table>
                <TableBody>
                  {currentDoc && Object.entries(currentDoc).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}</TableCell>
                      <TableCell>{key === 'archivo' ? (
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Ver archivo
                        </a>
                      ) : value as string}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }