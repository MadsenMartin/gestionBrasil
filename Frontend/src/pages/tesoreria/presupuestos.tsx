import { TablaPresupuestos } from '@/components/presupuestos/tabla/tablaPresupuestos';
import { Toaster, toast } from 'sonner';
import { useAuth } from "@/auth/authContext"

export function VistaPresupuestos() {
    const { loading, isRecepcion } = useAuth()
    return (
        <div className="mx-auto p-3 w-full">
            <div className="flex justify-between items-center mb-4 w-full">
                <h1 className="text-2xl font-bold mb-4">Presupuestos</h1>
            </div>
            {!loading && (!isRecepcion() ?
                <TablaPresupuestos toast={toast} />
                :
                <div className="flex justify-center items-center py-32 h-full w-full">
                    <h1 className="text-2xl font-bold mb-4">No tienes permisos para ver esta sección</h1>
                </div>)}
            <Toaster />
        </div>

    )
}

