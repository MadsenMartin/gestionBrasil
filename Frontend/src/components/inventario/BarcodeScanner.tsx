import { useState } from 'react'
import { useZxing } from 'react-zxing'
import { Button } from "@/components/ui/button"

interface BarcodeScannerProps {
  onScan: (data: string) => void
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false)

  const { ref } = useZxing({
    onDecodeResult(result) {
      onScan(result.getText())
      setScanning(false)
    },
  })

  return (
    <div className="space-y-4">
      <Button onClick={() => setScanning(true)}>
        {scanning ? 'Detener Escaneo' : 'Iniciar Escaneo'}
      </Button>
      {scanning && (
        <div className="relative w-full max-w-md mx-auto">
          <video ref={ref} className="w-full" />
        </div>
      )}
    </div>
  )
}
