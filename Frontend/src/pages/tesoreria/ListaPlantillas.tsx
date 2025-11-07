import { TablaPlantillas } from '@/components/tesoreria/Plantillas/tablaPlantillas';
import { Toaster, toast } from 'sonner';

export function PlantillasView() {

  return (
    <div className="mx-auto p-3 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-start">
          <h1 className="text-2xl font-bold mb-4">Plantillas</h1>
        </div>
      </div>
      <div className="overflow-x-auto">
        <TablaPlantillas toast={toast}/>
        <Toaster />
      </div>
    </div>
  )
}