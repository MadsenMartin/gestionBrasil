import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { FormNuevoDocumento } from "./formNuevoDocumento";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { DropdownMenuItem } from "../ui/dropdown-menu";

type DialogNuevoDocumentoProps = {
  toast: any
  addDocumento?: any
  updateDocumento?: any
  data?: any
}

export function DialogNuevoDocumento({ toast, addDocumento, updateDocumento, data }: DialogNuevoDocumentoProps) {
  const [showForm, setShowForm] = useState(false)
  const [currentAdjunto, setCurrentAdjunto] = useState<string | null>(data?.archivo)
  return (
    <Dialog open={showForm} onOpenChange={setShowForm}>
      <DialogTrigger asChild>
        {data
          ? <DropdownMenuItem onSelect={(event) => event.preventDefault()} >
            Editar
          </DropdownMenuItem>
          : <Button>Nuevo documento</Button>
        }
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className={currentAdjunto ? "max-w-8xl w-full max-h-fit" : 'max-w-3xl max-h-fit'}>
        <DialogTitle style={{ textAlign: 'center' }}>{data ? "Editar documento" : "Cargar Nuevo Documento"}</DialogTitle>
        <div className={`flex ${currentAdjunto ? 'gap-4 max-h-fit h-[90vh]' : 'justify-center'} max-h-fit h-[70vh]`}>
          {currentAdjunto && (
            <Card className="w-1/2">
              <CardContent className="h-full">
                <iframe
                  src={currentAdjunto}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </CardContent>
            </Card>
          )}
          <Card className={currentAdjunto ? 'w-1/2 h-full' : 'w-full h-full'}>
            <CardContent>
              <FormNuevoDocumento setShowForm={setShowForm} showForm={showForm} toast={toast} setCurrentAdjunto={setCurrentAdjunto} addDocumento={addDocumento} updateDocumento={updateDocumento} data={data} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}