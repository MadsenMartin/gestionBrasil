import React, { useState } from 'react'
import Barcode from 'react-barcode'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ItemEntryProps {
  onSubmit: (itemInfo: string) => void
}

export function ItemEntry({ onSubmit }: ItemEntryProps) {
  const [itemInfo, setItemInfo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(itemInfo)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        placeholder="Información del artículo"
        value={itemInfo}
        onChange={(e) => setItemInfo(e.target.value)}
      />
      <Button type="submit">Generar Código de Barras</Button>
      {itemInfo && (
        <div>
          <Barcode value={itemInfo} />
        </div>
      )}
    </form>
  )
}

