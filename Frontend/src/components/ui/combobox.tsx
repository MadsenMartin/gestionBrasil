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
 
 
export function Combobox({proveedores,}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? proveedores.find((proveedor) => proveedor.id === value)?.razon_social
            : "Seleccionar proveedor"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar proveedor..." />
          <CommandList>
            <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
            <CommandGroup>
              {proveedores.map((proveedor) => (
                <CommandItem
                  key={proveedor.id}
                  value={proveedor.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === proveedor.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {proveedor.razon_social}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}