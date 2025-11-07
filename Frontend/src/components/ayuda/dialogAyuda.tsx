import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AyudaTablaDocumentos } from "./ayudaTablaDocumentos";

const componenteMap = {
    "Tabla Documentos": <AyudaTablaDocumentos/>,
}

export function DialogAyuda({trigger, componente}: {trigger: React.ReactNode, componente: string}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                   <DialogTitle className="text-lg font-semibold">Ayuda {componente}</DialogTitle>
                </DialogHeader>
                <DialogDescription></DialogDescription>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                    {componenteMap[componente]}
                </div>
            </DialogContent>
        </Dialog>
    )
}