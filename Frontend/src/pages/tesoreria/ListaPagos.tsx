import { Toaster, toast } from 'sonner';
import { TablaPagos } from "@/components/pagos/tablaPagos"

export function PagosView() {

    return (
        <div className="mx-auto p-3 w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold mb-4">Pagos</h1>
          </div>
          <TablaPagos toast={toast} />
          <Toaster />
        </div>
);
}