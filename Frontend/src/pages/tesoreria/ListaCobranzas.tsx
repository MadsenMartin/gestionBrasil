import { TablaCobranzas } from '@/components/cobranzas/tablaCobranzas';
import { Toaster, toast } from 'sonner';

export function CobranzasView() {

    return(
        <div className="w-full mx-auto p-3">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold mb-4">Cobranzas</h1>
            </div>
            <div>
                <TablaCobranzas toast={toast} />
            </div>
            <Toaster/>
        </div>
    )
}