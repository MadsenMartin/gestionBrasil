import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Item {
  id: string
  name: string
}

const mockItems: Item[] = [
  { id: '1', name: 'Laptop' },
  { id: '2', name: 'Monitor' },
  { id: '3', name: 'Teclado' },
  { id: '4', name: 'Mouse' },
]

interface ItemSelectionProps {
  onSubmit: (items: string[], person: string) => void
}

export function ItemSelection({ onSubmit }: ItemSelectionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [person, setPerson] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedItems, person)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select onValueChange={(value) => setSelectedItems([...selectedItems, value])}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar artículo" />
        </SelectTrigger>
        <SelectContent>
          {mockItems.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        Artículos seleccionados: {selectedItems.map(id => mockItems.find(item => item.id === id)?.name).join(', ')}
      </div>
      <Input
        type="text"
        placeholder="Nombre de quien retira"
        value={person}
        onChange={(e) => setPerson(e.target.value)}
      />
      <Button type="submit">Siguiente</Button>
    </form>
  )
}
