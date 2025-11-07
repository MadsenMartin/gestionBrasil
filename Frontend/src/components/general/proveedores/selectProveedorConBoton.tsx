import { get_generico } from '@/endpoints/api'
import { Persona } from '@/types/genericos'
import { Control } from 'react-hook-form'
import { FormLabel } from '../../ui/form'
import { useQuery, QueryClient } from '@tanstack/react-query';
import { DialogNuevoProveedor } from '../personas/dialogNuevaPersona'
import { ComboboxAPI } from '@/components/comboboxes/ComboboxAPI'
import { cn } from '@/lib/utils';

function useProveedoresData() { // Función que almacena los proveedores en cache para evitar llamadas innecesarias al servidor
    return useQuery({
        queryKey: ['proveedores'], // Si o si tiene que haber una key
        queryFn: async () => {
            return await get_generico('proveedores');
        },
        staleTime: 1000 * 60 * 5, // 5 minutos (ejemplo)
        gcTime: 1000 * 60 * 10, // 10 minutos (ejemplo)
    });
}

interface SelectProveedorConBotonProps {
    id: string;
    toast: any;
    buttonStr: string;
    control: Control<any>;
    fieldToShow: keyof Persona;
    fieldToSend: keyof Persona;
    onValueChange?: (value: string) => void;
    className?: string;
    omitirResults?: any | null;
    queryParams?: any;
    disabled?: boolean;
    formLabel?: boolean;
    setSaldoPpto?: any;
    value?: any;
    initialLabel?: string | null;
}


export function SelectProveedorConBoton({
    toast,
    buttonStr,
    id,
    control,
    fieldToShow,
    fieldToSend,
    onValueChange,
    disabled,
    className,
    value,
    initialLabel,
    formLabel = true }: SelectProveedorConBotonProps) {
    const { data } = useProveedoresData()
    const queryClient = new QueryClient()

    return (
        <div className='flex flex-col'>
            {formLabel && <FormLabel className="py-2">Proveedor</FormLabel>}
            <div className='flex items-center'>
                <ComboboxAPI
                    id={id}
                    model="proveedores"
                    control={control}
                    data={data}
                    fieldToShow={fieldToShow}
                    fieldToSend={fieldToSend}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    formLabel={false}
                    className={cn(className,"w-60")}
                    value={value}
                    initialLabel={initialLabel}
                    />
                <DialogNuevoProveedor toast={toast} buttonStr={buttonStr} queryClient={queryClient} />
            </div>
        </div>
    )
}

