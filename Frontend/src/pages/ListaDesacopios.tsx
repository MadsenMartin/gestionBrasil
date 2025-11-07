import { Toaster } from 'sonner';
import { TablaDesacopios } from '@/components/acopios/TablaDesacopios';

export function DesacopiosView() {

    return (
        <div className="mx-auto p-3 w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold mb-4">Desacopios</h1>
          </div>
          <TablaDesacopios />
          <Toaster />
        </div>
);
}