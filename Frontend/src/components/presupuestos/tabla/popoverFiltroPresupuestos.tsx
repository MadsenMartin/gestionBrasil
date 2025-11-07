import * as React from "react"
import { ChevronDown, Filter as FilterIcon, GripVertical, Plus, Trash2 } from 'lucide-react'
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


import type { Filter, FilterBuilderProps, FilterField, Operator } from "../types/filters"
import { v4 as uuidv4 } from 'uuid';
import { Label } from "../../ui/label"

const OPERATORS: { [key: string]: { label: string; value: Operator }[] } = {
    text: [
        { label: "Contiene", value: "contains" },
        { label: "Es", value: "equals" },
        { label: "Comienza con", value: "startsWith" },
        { label: "Termina con", value: "endsWith" },
        { label: "Está vacío", value: "isEmpty" },
        { label: "No está vacío", value: "isNotEmpty" },
    ],
    select: [
        { label: "Es", value: "equals" },
        { label: "Está vacío", value: "isEmpty" },
        { label: "No está vacío", value: "isNotEmpty" },
    ],
    number: [
        { label: "Es", value: "equals" },
        { label: "Está vacío", value: "isEmpty" },
        { label: "No está vacío", value: "isNotEmpty" },
        { label: "Mayor que", value: "greaterThan" },
        { label: "Menor que", value: "lessThan" },
    ],
    date: [
        { label: "Es", value: "equals" },
        { label: "Está vacío", value: "isEmpty" },
        { label: "No está vacío", value: "isNotEmpty" },
    ],
}

export function FilterBuilder({ fields, filters, onChange, onReset }: FilterBuilderProps) {
    const addFilter = React.useCallback(() => {
        const newFilter: Filter = {
            id: uuidv4(),
            field: fields[0].id,
            operator: OPERATORS[fields[0].type][0].value,
            value: fields[0].type === "select" ? fields[0].options[0].value : "",
        }
        onChange([...filters, newFilter])
    }, [fields, filters, onChange])

    const updateFilter = React.useCallback(
        (id: string, partial: Partial<Filter>) => {
            onChange(
                filters.map((filter) =>
                    filter.id === id ? { ...filter, ...partial } : filter
                )
            )
        },
        [filters, onChange]
    )

    const removeFilter = React.useCallback(
        (id: string) => {
            onChange(filters.filter((filter) => filter.id !== id))
        },
        [filters, onChange]
    )

    const handleDragEnd = React.useCallback(
        (result: any) => {
            if (!result.destination) return

            const items = Array.from(filters)
            const [reorderedItem] = items.splice(result.source.index, 1)
            items.splice(result.destination.index, 0, reorderedItem)

            onChange(items)
        },
        [filters, onChange]
    )

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button>
                    <FilterIcon/>
                    Filtros{filters.length>0 && ` (${filters.length})`}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-2">
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <div className="p-4">
                            {filters.length === 0 && (
                                <Label className="text-center text-sm text-muted-foreground"
                                    >Sin filtros aplicados</Label>
                            )}
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="filters">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {filters.map((filter, index) => (
                                                <Draggable
                                                    key={filter.id}
                                                    draggableId={filter.id}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="flex items-center gap-4 mb-4 last:mb-0"
                                                        >
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className="px-2 cursor-grab"
                                                            >
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <FilterRow
                                                                key={filter.id}
                                                                fields={fields}
                                                                filter={filter}
                                                                onChange={updateFilter}
                                                                onRemove={removeFilter}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={addFilter}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir filtro
                        </Button>
                        {onReset && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={onReset}
                            >
                                Borrar filtros
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function FilterRow({
    fields,
    filter,
    onChange,
    onRemove,
}: {
    fields: FilterField[]
    filter: Filter
    onChange: (id: string, partial: Partial<Filter>) => void
    onRemove: (id: string) => void
}) {
    const field = fields.find((f) => f.id === filter.field)
    const operators = field ? OPERATORS[field.type] : []

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-fit justify-between"
                        role="combobox"
                    >
                        {field?.label}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-0">
                    <Command>
                        <CommandInput placeholder="Buscar campo..." />
                        <CommandEmpty>Campo no encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandList>
                                {fields?.map((field) => (
                                    <CommandItem
                                        key={field.id}
                                        value={field.id}
                                        onSelect={() => {
                                            onChange(filter.id, {
                                                field: field.id,
                                                operator: OPERATORS[field.type][0].value,
                                                value: "",
                                            })
                                        }}
                                    >
                                        {field.label}
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            <Select
                value={filter.operator}
                onValueChange={(value) =>
                    onChange(filter.id, { operator: value as Operator })
                }
            >
                <SelectTrigger className="w-fit">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {operators.map((operator) => (
                        <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {field?.type === "select" ? (
                <Select
                    value={filter.value}
                    onValueChange={(value) => onChange(filter.id, { value })}
                >
                    <SelectTrigger className="w-fit">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    className="w-fit"
                    placeholder="Introducir valor..."
                    value={filter.value}
                    onChange={(e) => onChange(filter.id, { value: e.target.value })}
                />
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(filter.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </>
    )
}