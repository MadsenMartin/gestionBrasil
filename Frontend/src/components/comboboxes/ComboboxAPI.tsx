"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { get_generico, get_generico_params } from "@/endpoints/api"
import { useEffect, useState } from "react"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"

const modelsLabelMap = {
    proveedores: 'Proveedor',
    clientes_proyectos: 'Cliente/Proyecto',
    imputaciones: 'Imputación',
    estados_presupuesto: 'Estado',
    tipos_reg: "Tipo",
    actividades_presupuesto: 'Actividad',
    comentarios_presupuesto: 'Comentario',
    estados_documento: 'Estado',
    tipos_documento: 'Tipo de documento',
    presupuestos: 'Presupuesto',
    cajas: 'Caja',
    unidades_de_negocio: 'Unidad de negocio',
    receptores: 'Receptor',
    documentos: 'Documento',
    certificados: 'Certificado',
    inversores: 'Inversor',
    tipos_asiento_inversor: 'Tipo de asiento',
    municipio: 'Municipio',
    moneda: 'Moneda',
}

interface ComboboxAPIProps {
    id: string
    model: string
    fieldToShow: string
    fieldToShow2?: string
    fieldToSend: string
    control?: any
    onValueChange?: (value: string | number) => void
    disabled?: boolean
    className?: string
    formLabel?: boolean
    queryParams?: any
    omitirResults?: string | null
    field?: any
    data?: any[]
    value?: string | number
    initialLabel?: string | number
    onItemChange?: (item: any) => void
    setSaldoPpto?: (saldo: number) => void
    setData?: (data: any[]) => void
    description?: string
}

export function ComboboxAPIsimple({
    model,
    fieldToShow,
    fieldToSend,
    onValueChange,
    omitirResults,
    queryParams,
    disabled,
    className,
    field = { onChange: () => { } },
    data: initialData,
    value: initialValue,
    setData: _setData,
}: ComboboxAPIProps) {
    const [open, setOpen] = React.useState(false)

    // Este useState es para tomar un valor inicial, una vez poblado el combobox se le asigna el valor del parámetro initialValue
    // Luego, en el combobox con un condicional, si este valor no es null, se asigna como valor del combobox
    const [value, setValue] = React.useState(null)

    // Este useState almacena los datos del combobox, que pueden ser los que vienen por parámetro o los que se obtienen de la API
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            if (data.length < 1) {
                setValue(null)
                field.onChange(null)
            }
            setData(initialData);
            return
        }
        const fetch = async () => {
            if (queryParams) {
                const response = await get_generico_params({ model, params: queryParams });
                setData(response.data.results);

                // Ver dialog pago MDO
                _setData && _setData(response.data.results);

            } else if (omitirResults) {
                const response = await get_generico(model, true);
                setData(response);
                _setData && _setData(response)
            } else {
                const response = await get_generico(model, null);
                setData(response.results);
                _setData && _setData(response.results)
            }
        };
        fetch();
        setValue(initialValue)
    }, [queryParams, omitirResults, model, initialData]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={className ? className : "w-[200px] justify-between"}
                    disabled={disabled || data?.length === 0}
                >
                    {value
                        ? data.find((item) => item[fieldToSend] === value)?.[fieldToShow]
                        : "Seleccionar item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar item..." />
                    <CommandList>
                        <CommandEmpty>No hay resultados.</CommandEmpty>
                        <CommandGroup>
                            {data?.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item[fieldToSend]}
                                    onSelect={() => {
                                        const selectedValue = item[fieldToSend];
                                        // Si el valor seleccionado es el mismo que ya está, vaciar
                                        const newValue = selectedValue === value ? null : selectedValue;

                                        // Esto actualiza tanto el estado local como el formulario
                                        field.onChange(newValue);
                                        setValue(newValue);

                                        // Si existe callback, también le pasamos el nuevo valor
                                        onValueChange && onValueChange(newValue);

                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item[fieldToSend] ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item[fieldToShow]}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

import { useDebounce } from "@/hooks/useDebounce"
import { useInfiniteQuery } from '@tanstack/react-query';

export function useModelData(model: string, queryParams?: any, omitirResults?: string | null, search?: string) {

    const getQueryParams = (pageParam: number, search: string) => {
        if (search != '') return `page=${pageParam}&search=${search}`
        return `page=${pageParam}`
    }

    const queryFn = async ({ pageParam = 1 }) => {
        if (search !== undefined && search !== '') {
            const queryParams = new URLSearchParams(getQueryParams(pageParam, search));
            const response = await get_generico_params({
                model,
                params: queryParams
            })
                ;
            return response.data;
        } else if (queryParams) {
            const response = await get_generico_params({
                model,
                params: `page=${pageParam}&${queryParams}`
            });
            return response.data;
        } else if (omitirResults) {
            return await get_generico_params({ model, params: `page=${pageParam}` });
        } else {
            const response = await get_generico_params({ model, params: `page=${pageParam}` });
            return response.data;
        }
    }

    return useInfiniteQuery({
        queryKey: [model, queryParams, omitirResults, search],
        queryFn: queryFn,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.next) {
                const urlParams = new URLSearchParams(new URL(lastPage.next).search);
                const nextPage = urlParams.get('page');
                return nextPage ? Number(nextPage) : undefined;
            } else {
                return undefined;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
}

export function ComboboxAPI({
    id,
    control,
    model,
    fieldToShow,
    fieldToShow2,
    fieldToSend,
    onValueChange,
    omitirResults,
    queryParams,
    disabled,
    className,
    formLabel = true,
    value: initialValue,
    onItemChange,
    setSaldoPpto,
    initialLabel,
    description,
}: ComboboxAPIProps) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(initialValue)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [selectedItem, setSelectedItem] = useState(null)

    const handleSelect = (item, field) => {
        const selectedValue = item[fieldToSend];
        if (selectedValue === value) {
            // Acá se vacía el campo si se selecciona el mismo valor, a partir de fieldToSend determino si el valor nulo es 0 o ''
            fieldToSend === "id" && field.onChange(null);
            fieldToSend !== "id" && field.onChange("");

            setValue("");
            onValueChange && onValueChange("");
            onItemChange && onItemChange(null);
            setSaldoPpto && setSaldoPpto(null);
            setSelectedItem(null); // clear selected item
        } else {
            field.onChange(selectedValue);
            setValue(selectedValue);
            onValueChange && onValueChange(selectedValue);
            onItemChange && onItemChange(item);
            setSaldoPpto && setSaldoPpto(item.saldo);
            setSelectedItem(item); // store selected item
        }
    }

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
    } = useModelData(model, queryParams, omitirResults, debouncedSearch)

    const allItems = data?.pages.flatMap((page) => page.results) || []

    const containerRef = React.useRef(null);

    const setContainerRef = React.useCallback((node) => {
        if (node !== null) {
            containerRef.current = node;
        }
    }, []);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container || !open) return;

        const handleScroll = () => {
            if (
                container.scrollTop + container.clientHeight >=
                container.scrollHeight - 20
            ) {
                if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const handleOpenChange = (nextOpen) => {
        setSearch('')
        setOpen(nextOpen)
    }

    useEffect(() => {
        if (disabled) {
            control.setValue(id, null)
            setValue(null)
            setSelectedItem(null)
            setOpen(false)
            return
        }
    }, [disabled])

    // Con este ref se puede enfocar el input de búsqueda al abrir el Popover, evitando que el valor introducido aparezca seleccionado
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Para enfocar el input cuando se abre el Popover
    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    return (
        <FormField
            control={control}
            name={id}
            render={({ field }) => (
                <FormItem>
                    {formLabel && <FormLabel>{modelsLabelMap[model]}</FormLabel>}
                    <FormControl>
                        <Popover modal={true} open={open} onOpenChange={(nextOpen) => handleOpenChange(nextOpen)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    onKeyDown={(e) => {
                                        // Solo permitir letras, números y caracteres especiales para búsqueda
                                        const isValidSearchKey = /^[a-zA-Z0-9\s.,;:'"´`!@#$%^&*()_+\-=\[\]{}\\|/<>?]$/.test(e.key);
                                        if (isValidSearchKey) {
                                            setOpen(true);
                                            // Ya no hacemos setSearch aquí
                                        }
                                    }}
                                    aria-expanded={open}
                                    className={cn(
                                        className ? className : "w-full",
                                        "justify-start text-left"
                                    )}
                                    disabled={disabled}// || allItems.length === 0}
                                >
                                    <span className="flex-1 truncate text-left">
                                        {(value && fieldToShow === fieldToSend) ? value : field.value
                                            ? (selectedItem ?
                                                selectedItem?.[fieldToShow] || selectedItem?.[fieldToShow2] || allItems.find((item) => item[fieldToSend] === field.value)?.[fieldToShow] || "Seleccionar item..."
                                                : (initialLabel && initialValue === value) ? initialLabel : "Seleccionar item...")
                                            : "Seleccionar item..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        ref={searchInputRef}
                                        placeholder="Buscar item..."
                                        onValueChange={setSearch}
                                        value={search}
                                    />
                                    <CommandList className="max-h-[200px] overflow-y-auto" ref={setContainerRef}>
                                        <CommandEmpty>{isFetching ? "Espere..." : allItems.length === 0 && search === debouncedSearch ? "No hay resultados." : "Espere..."}</CommandEmpty>
                                        <CommandGroup>
                                            {allItems.map((item) => (
                                                <CommandItem
                                                    key={item.id}
                                                    value={`${item[fieldToShow]}${fieldToShow2 ? ` ${item[fieldToShow2]}` : ''}`}
                                                    onSelect={() => {
                                                        handleSelect(item, field)
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === item?.[fieldToSend] ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {fieldToShow2 ? `${item?.[fieldToShow]} - ${item?.[fieldToShow2]}` : item?.[fieldToShow]}
                                                </CommandItem>
                                            ))}

                                        </CommandGroup>
                                        {isFetchingNextPage && <CommandItem>Cargando más...</CommandItem>}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                </ FormItem>
            )}
        />
    )
}

interface ComboboxAPIFormlessProps {
    model: string
    fieldToShow: string
    fieldToShow2?: string
    fieldToSend: string
    onValueChange?: (value: string | number) => void
    omitirResults?: string | null
    queryParams?: any
    disabled?: boolean
    className?: string
    onItemChange?: (item: any) => void
    placeholder?: string
}

export function ComboboxAPIFormless({
    model,
    fieldToShow,
    fieldToShow2,
    fieldToSend,
    onValueChange,
    onItemChange,
    omitirResults,
    queryParams,
    disabled,
    className,
    placeholder = "Seleccionar item...",
}: ComboboxAPIFormlessProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [value, setValue] = useState(null)
    const debouncedSearch = useDebounce(search, 300)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
    } = useModelData(model, queryParams, omitirResults, debouncedSearch)

    const allItems = data?.pages.flatMap((page) => page.results) || []

    const containerRef = React.useRef(null);

    const setContainerRef = React.useCallback((node) => {
        if (node !== null) {
            containerRef.current = node;
        }
    }, []);

    useEffect(() => {
        const container = containerRef?.current;
        if (!container || !open) return;

        const handleScroll = () => {
            if (
                container.scrollTop + container.clientHeight >=
                container.scrollHeight - 20
            ) {
                if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleOpenChange = (nextOpen) => {
        setSearch('')
        setOpen(nextOpen)
    }

    return (
        <Popover modal={true} open={open} onOpenChange={(nextOpen) => handleOpenChange(nextOpen)}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={className ? className : "w-full justify-between"}
                    disabled={disabled || allItems.length === 0}
                >

                    {value ? value[fieldToShow] : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Buscar item..."
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto" ref={setContainerRef}>
                        <CommandEmpty>{isFetching ? "Espere..." : allItems.length === 0 && search === debouncedSearch ? "No hay resultados." : "Espere..."}</CommandEmpty>
                        <CommandGroup>
                            {allItems.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={`${item[fieldToShow]}${fieldToShow2 ? ` ${item[fieldToShow2]}` : ''}`}
                                    onSelect={() => {
                                        onValueChange && onValueChange(item[fieldToSend]);
                                        onItemChange && onItemChange(item);
                                        setValue(item);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value?.[fieldToSend] === item?.[fieldToSend] ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {fieldToShow2 ? `${item?.[fieldToShow]} - ${item?.[fieldToShow2]}` : item?.[fieldToShow]}
                                </CommandItem>
                            ))}

                        </CommandGroup>
                        {isFetchingNextPage && <CommandItem>Cargando más...</CommandItem>}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

interface ComboboxFormProps {
    id: string
    model: string
    fieldToShow: string
    fieldToSend: string
    control?: any
    onValueChange?: (value: string | number) => void
    disabled?: boolean
    className?: string
    formLabel?: boolean
    data: any[]
    value?: string | number
    initialLabel?: string | number
    onItemChange?: (item: any) => void
}

export function ComboboxForm ({
    id,
    control,
    model,
    fieldToShow,
    fieldToSend,
    onValueChange,
    disabled,
    className,
    formLabel = true,
    data,
    value: initialValue,
    initialLabel,
    onItemChange,
}: ComboboxFormProps) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(initialValue)
    const [search, setSearch] = useState('')
    const [selectedItem, setSelectedItem] = useState(null)

    // Filtrar datos basado en la búsqueda (sin debounce porque es filtrado local)
    const filteredData = data.filter((item) =>
        item[fieldToShow]?.toString().toLowerCase().includes(search.toLowerCase())
    )

    const handleSelect = (item, field) => {
        const selectedValue = item[fieldToSend];
        if (selectedValue === value) {
            // Vaciar el campo si se selecciona el mismo valor
            fieldToSend === "id" && field.onChange(null);
            fieldToSend !== "id" && field.onChange("");

            setValue("");
            onValueChange && onValueChange("");
            onItemChange && onItemChange(null);
            setSelectedItem(null);
        } else {
            field.onChange(selectedValue);
            setValue(selectedValue);
            onValueChange && onValueChange(selectedValue);
            onItemChange && onItemChange(item);
            setSelectedItem(item);
        }
    }

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    const handleOpenChange = (nextOpen) => {
        setSearch('')
        setOpen(nextOpen)
    }

    useEffect(() => {
        if (disabled) {
            control.setValue(id, null)
            setValue(null)
            setSelectedItem(null)
            setOpen(false)
            return
        }
    }, [disabled])

    const searchInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    return (
        <FormField
            control={control}
            name={id}
            render={({ field }) => (
                <FormItem>
                    {formLabel && <FormLabel>{modelsLabelMap[model] || 'Seleccionar'}</FormLabel>}
                    <FormControl>
                        <Popover modal={true} open={open} onOpenChange={(nextOpen) => handleOpenChange(nextOpen)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    onKeyDown={(e) => {
                                        const isValidSearchKey = /^[a-zA-Z0-9\s.,;:'"´`!@#$%^&*()_+\-=\[\]{}\\|/<>?]$/.test(e.key);
                                        if (isValidSearchKey) {
                                            setOpen(true);
                                        }
                                    }}
                                    aria-expanded={open}
                                    className={cn(
                                        className ? className : "w-full",
                                        "justify-start text-left"
                                    )}
                                    disabled={disabled || data.length === 0}
                                >
                                    <span className="flex-1 truncate text-left">
                                        {(value && fieldToShow === fieldToSend) ? value : field.value
                                            ? (selectedItem ?
                                                selectedItem?.[fieldToShow] || data.find((item) => item[fieldToSend] === field.value)?.[fieldToShow] || "Seleccionar item..."
                                                : (initialLabel && initialValue === value) ? initialLabel : "Seleccionar item...")
                                            : "Seleccionar item..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        ref={searchInputRef}
                                        placeholder="Buscar item..."
                                        onValueChange={setSearch}
                                        value={search}
                                    />
                                    <CommandList className="max-h-[200px] overflow-y-auto">
                                        <CommandEmpty>No hay resultados.</CommandEmpty>
                                        <CommandGroup>
                                            {filteredData.map((item) => (
                                                <CommandItem
                                                    key={item.id || item[fieldToSend]}
                                                    value={item[fieldToShow]}
                                                    onSelect={() => {
                                                        handleSelect(item, field)
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === item?.[fieldToSend] ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {item?.[fieldToShow]}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}