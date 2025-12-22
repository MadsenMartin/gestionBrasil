import { Toaster, toast } from 'sonner';
import { TablaDocumentos } from "@/components/documentos/tablaDocumentos"

export function DocumentosView() {

  return (
    <div className="mx-auto p-3 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-start">
          {/*<DropdownMenuGeneral></DropdownMenuGeneral>*/}
          <h1 className="text-2xl font-bold mb-4">Documentos</h1>
        </div>
      </div>
      <div className="overflow-x-auto">
        <TablaDocumentos toast={toast}/>
        <Toaster theme={"dark"}/>
      </div>
    </div>
  )
}