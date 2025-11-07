import { Toaster } from 'sonner';
import { useAuth } from "@/auth/authContext"
import { TablaGastosARecuperar } from '@/components/tesoreria/gastosARecuperar/tablaGastosARecuperar';

export function GastosARecuperarPage() {
  const { loading, isRecepcion } = useAuth()


  return (
    <div className="mx-auto w-full p-3">
      <div className="flex justify-between items-center mb-0 w-full">
        <h1 className="text-2xl font-bold mb-4">Gastos a recuperar</h1>
      </div>
      {!loading && (!isRecepcion() ?
        <TablaGastosARecuperar/>
        :
        <div className="flex justify-center items-center py-32 h-full w-full">
          <h1 className="text-2xl font-bold mb-4">No tienes permisos para ver esta sección</h1>
        </div>)}
      <Toaster />
    </div>
  );
}