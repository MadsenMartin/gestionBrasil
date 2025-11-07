// SelectComponent.tsx
import { Controller, Control } from 'react-hook-form';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { get_generico, get_generico_params } from "@/endpoints/api";
import { useEffect, useState } from "react";

interface SelectComponentProps<T> {
  id: string;
  control: Control<any>;
  error: any;
  data: T[];
  fieldToShow: keyof T;
  fieldToSend: keyof T;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface SelectGenericoProps<T> {
  id: string;
  control: Control<any>;
  error: any;
  model: string;
  fieldToShow: keyof T;
  fieldToSend: keyof T;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function SelectGenerico<T>({ id, control, error, model, fieldToShow, fieldToSend, onValueChange }: SelectGenericoProps<T>) {
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const response = await get_generico(model, null);
      setData(response);
    };
    fetch();
  }, []);
  return (
    <div>
      <Controller
        name={id}
        control={control}
        render={({ field }) => (
          <Select
            onValueChange={(value) => { field.onChange(value); onValueChange && onValueChange(value); }}
            value={field.value || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una opción" />
            </SelectTrigger>
            <SelectContent>
              {data?.map((item, index) => (
                <SelectItem
                  key={index}
                  value={String(item[fieldToSend])}
                >
                  {String(item[fieldToShow])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}


import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField
} from "@/components/ui/form";

interface SelectGenericoV2Props<U extends object> {
  id: string;
  control: Control<any>;
  model: string;
  fieldToShow: keyof U;
  fieldToSend: keyof U;
  onValueChange?: (value: string) => void;
  className?: string;
  omitirResults?: any | null;
  queryParams?: any;
  disabled?: boolean;
  formLabel?: boolean;
  setSaldoPpto?: any;
}

interface SelectGenericoV4Props<U extends object> {
  id: string;
  control?: Control<any>;
  model: string;
  fieldToShow: keyof U;
  fieldToSend: keyof U;
  onValueChange?: (value: string) => void;
  className?: string;
  omitirResults?: any | null;
  queryParams?: any;
  disabled?: boolean;
  formLabel?: boolean;
  setSaldoPpto?: any;
  form?: boolean;
}

const modelsLabelMap = {
  proveedores: 'Proveedor',
  clientes_proyectos: 'Cliente/Proyecto',
  imputaciones: 'Imputación',
  estados_presupuesto: 'Estado',
  actividades_presupuesto: 'Actividad',
  comentarios_presupuesto: 'Comentario',
  estados_documento: 'Estado',
  tipos_documento: 'Tipo de documento',
  presupuestos: 'Presupuesto',
  cajas: 'Caja',
  unidades_de_negocio: 'Unidad de negocio',
  receptores: 'Receptor',
  documentos: 'Documento',
}

export function SelectGenericoV2<U extends object>({
  id,
  control,
  model,
  fieldToShow,
  fieldToSend,
  onValueChange,
  omitirResults,
  queryParams,
  disabled,
  className,
  setSaldoPpto,
  formLabel = true
}: SelectGenericoV2Props<U>) {
  const [data, setData] = useState<U[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (queryParams) {
        const response = await get_generico_params({ model, params: queryParams });
        setData(response.data);
      } else if (omitirResults) {
        const response = await get_generico(model, true);
        setData(response);
      } else {
        const response = await get_generico(model, null);
        setData(response);
      }
    };
    fetch();
  }, []);

  return (
    <FormField
      control={control}
      name={id}
      render={({ field }) => (
        <FormItem>
          {formLabel && <FormLabel>{modelsLabelMap[model]}</FormLabel>}
          <FormControl>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                onValueChange && onValueChange(value);

                // Asignar el saldo del presupuesto en caso de que el modelo sea 'presupuestos' y  el componente tenga la prop setSaldoPpto
                if (setSaldoPpto && model === 'presupuestos') {
                  const selectedItem = data.find((item) => item[fieldToSend] === Number(value));
                  // Since saldo exists only when model === 'presupuesto', we can safely assert or check it:
                  if (selectedItem && 'saldo' in selectedItem && typeof (selectedItem as any).saldo === 'string') {
                    setSaldoPpto((selectedItem as { saldo: number }).saldo);
                  }
                }

              }}
              value={field.value || ''}
              disabled={disabled || data?.length === 0}
            >
              <SelectTrigger className={className}>
                <SelectValue
                  placeholder={
                    data?.length === 0 ? 'No hay resultados' : 'Seleccione una opción'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {data?.map((item, index) => (
                  <SelectItem key={index} value={String(item[fieldToSend])}>
                    {String(item[fieldToShow])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}



function SelectComponent<T>({
  id,
  control,
  error,
  data,
  fieldToShow,
  fieldToSend,
  onValueChange,
}: SelectComponentProps<T>) {
  return (
    <div>
      <Controller
        name={id}
        control={control}
        render={({ field }) => (
          <Select
            onValueChange={(value) => { onValueChange; field.onChange(value); }}
            value={field.value || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una opción" />
            </SelectTrigger>
            <SelectContent>
              {data.map((item, index) => (
                <SelectItem
                  key={index}
                  value={String(item[fieldToSend])}
                >
                  {String(item[fieldToShow])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}

export { SelectComponent };

interface SelectTipoRegFormComponentProps {
  id: string;
  control: Control<any>;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  initialValue?: string;
}

export function SelectTipoRegForm({ id, control, onValueChange, disabled, className, initialValue }: SelectTipoRegFormComponentProps) {
  const data = [
    { tipo: 'PSF', id: 1 },
    { tipo: 'REC', id: 2 },
    { tipo: 'OP', id: 3 },
    { tipo: 'OPFC', id: 4 },
    { tipo: 'RETH', id: 5 },
    { tipo: 'FC', id: 6 },
    { tipo: 'PERCS', id: 7 },
    { tipo: 'RETS', id: 8 },
  ];

  const triggerPlaceholder = () => {
    if (initialValue) {
      const item = data?.find((item) => item.tipo === initialValue.toString());
      onValueChange && onValueChange(item?.tipo);
      return item?.tipo;
    } else {
      return "Seleccionar item";
    }
  }

  return (
    <FormField
      control={control}
      name={id}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo</FormLabel>
          <FormControl>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                onValueChange && onValueChange(value);
              }}
              value={initialValue || field.value || ''}
              disabled={disabled || data?.length === 0}
            >
              <SelectTrigger className={className}>
                <SelectValue
                  placeholder={triggerPlaceholder()}

                />
              </SelectTrigger>
              <SelectContent>
                {data?.map((item, index) => (
                  <SelectItem key={index} value={item.tipo}>
                    {item.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

import { useQuery } from '@tanstack/react-query';

function useModelData(model: string, queryParams?: any, omitirResults?: any) {
  return useQuery({
    queryKey: [model, queryParams, omitirResults],
    queryFn: async () => {
      if (queryParams) {
        return await get_generico_params({ model, params: queryParams });
      } else if (omitirResults) {
        return await get_generico(model, true);
      } else {
        return await get_generico(model, null);
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos (ejemplo)
    gcTime: 1000 * 60 * 10, // 10 minutos (ejemplo)
  });
}

export function SelectGenericoV4<U extends object>(props: SelectGenericoV4Props<U>) {
  const {
    form = false,
    id,
    control,
    model,
    fieldToShow,
    fieldToSend,
    onValueChange,
    omitirResults,
    queryParams,
    disabled,
    className,
    setSaldoPpto,
    formLabel = true
  } = props;

  // Aquí usamos el hook que nos devuelve React Query
  const { data, isLoading, isError } = useModelData(model, queryParams, omitirResults);
  return (
    <>
      {form &&
        <FormField control={control} name={id} render={({ field }) => (
          <FormItem>
            {formLabel && <FormLabel>{modelsLabelMap[model]}</FormLabel>}
            <FormControl>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  onValueChange && onValueChange(value);

                  if (setSaldoPpto && model === 'presupuestos' && data) {
                    const selectedItem = data.find((item) => item[fieldToSend] === Number(value));
                    if (selectedItem && 'saldo' in selectedItem && typeof (selectedItem as any).saldo === 'number') {
                      setSaldoPpto((selectedItem as { saldo: number }).saldo);
                    }
                  }
                }}
                value={field.value || ''}
                disabled={disabled || isLoading || !data || data.length === 0}
              >
                <SelectTrigger className={className}>
                  <SelectValue
                    placeholder={
                      isLoading ? 'Cargando...' :
                        isError ? 'Error' :
                          (data?.length === 0 ? 'No hay resultados' : 'Seleccione una opción')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {data?.map((item, index) => (
                    <SelectItem key={index} value={String(item[fieldToSend])}>
                      {String(item[fieldToShow])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />}
      {!form &&

        <Select
          onValueChange={(value) => {
            onValueChange && onValueChange(value);

            if (setSaldoPpto && model === 'presupuestos' && data) {
              const selectedItem = data.find((item) => item[fieldToSend] === Number(value));
              if (selectedItem && 'saldo' in selectedItem && typeof (selectedItem as any).saldo === 'number') {
                setSaldoPpto((selectedItem as { saldo: number }).saldo);
              }
            }
          }}
          value={''}
          disabled={disabled || isLoading || !data || data.length === 0}
        >
          <SelectTrigger className={className}>
            <SelectValue
              placeholder={
                isLoading ? 'Cargando...' :
                  isError ? 'Error' :
                    (data?.length === 0 ? 'No hay resultados' : 'Seleccione una opción')
              }
            />
          </SelectTrigger>
          <SelectContent>
            {data?.map((item, index) => (
              <SelectItem key={index} value={String(item[fieldToSend])}>
                {String(item[fieldToShow])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }

    </>

  );
}

export function SelectGenericoV3<U extends object>(props: SelectGenericoV2Props<U>) {
  const {
    id,
    control,
    model,
    fieldToShow,
    fieldToSend,
    onValueChange,
    omitirResults,
    queryParams,
    disabled,
    className,
    setSaldoPpto,
    formLabel = true
  } = props;

  // Aquí usamos el hook que nos devuelve React Query
  const { data, isLoading, isError } = useModelData(model, queryParams, omitirResults);
  return (
    <FormField control={control} name={id} render={({ field }) => (
      <FormItem>
        {formLabel && <FormLabel>{modelsLabelMap[model]}</FormLabel>}
        <FormControl>
          <Select
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange && onValueChange(value);

              if (setSaldoPpto && model === 'presupuestos' && data) {
                const selectedItem = data.find((item) => item[fieldToSend] === Number(value));
                if (selectedItem && 'saldo' in selectedItem && typeof (selectedItem as any).saldo === 'number') {
                  setSaldoPpto((selectedItem as { saldo: number }).saldo);
                }
              }
            }}
            value={field.value || ''}
            disabled={disabled || isLoading || !data || data.length === 0}
          >
            <SelectTrigger className={className}>
              <SelectValue
                placeholder={
                  isLoading ? 'Cargando...' :
                    isError ? 'Error' :
                      (data?.length === 0 ? 'No hay resultados' : 'Seleccione una opción')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {data?.map((item, index) => (
                <SelectItem key={index} value={String(item[fieldToSend])}>
                  {String(item[fieldToShow])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}