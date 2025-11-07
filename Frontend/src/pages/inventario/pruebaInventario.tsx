'use client'

import { useState } from 'react'
import { ItemSelection } from '@/components/inventario/ItemSelection'
import { SignatureCapture } from '@/components/inventario/SignatureCapture'
import { ItemEntry } from '@/components/inventario/ItemEntry'
import { BarcodeScanner } from '@/components/inventario/BarcodeScanner'
import { Button } from "@/components/ui/button"

export default function Inventario() {
  const [step, setStep] = useState(1)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [person, setPerson] = useState('')
  const [signature, setSignature] = useState('')

  const handleItemSelection = (items: string[], selectedPerson: string) => {
    setSelectedItems(items)
    setPerson(selectedPerson)
    setStep(2)
  }

  const handleSignatureCapture = (signatureData: string) => {
    setSignature(signatureData)
    // Aquí simularemos el guardado en el servidor
    console.log('Guardando en el servidor:', { selectedItems, person, signature: signature })
    setStep(1) // Volver al inicio después de guardar
  }

  const handleItemEntry = (itemInfo: string) => {
    console.log('Nuevo artículo ingresado:', itemInfo)
    // Aquí podrías implementar la lógica para guardar el nuevo artículo
  }

  const handleBarcodeScan = (data: string) => {
    console.log('Código de barras escaneado:', data)
    // Aquí podrías implementar la lógica para procesar el artículo escaneado
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Sistema de Inventario</h1>
      
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Salida de Inventario</h2>
          <ItemSelection onSubmit={handleItemSelection} />
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Firma de Salida</h2>
          <SignatureCapture onCapture={handleSignatureCapture} />
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Ingreso de Artículos</h2>
        <ItemEntry onSubmit={handleItemEntry} />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Escanear Código de Barras</h2>
        <BarcodeScanner onScan={handleBarcodeScan} />
      </div>
      
      <Button onClick={() => setStep(1)} className="mt-4">
        Volver al Inicio
      </Button>
    </div>
  )
}
