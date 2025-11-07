import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from "@/components/ui/button"

interface SignatureCaptureProps {
  onCapture: (signature: string) => void
}

export function SignatureCapture({ onCapture }: SignatureCaptureProps) {
  const signatureRef = useRef<SignatureCanvas>(null)

  const handleClear = () => {
    signatureRef.current?.clear()
  }

  const handleCapture = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL()
      onCapture(signatureData)
    }
  }

  return (
    <div className="space-y-4">
      <SignatureCanvas
        ref={signatureRef}
        canvasProps={{ className: 'border border-gray-300 rounded' }}
      />
      <div className="space-x-2">
        <Button onClick={handleClear}>Limpiar</Button>
        <Button onClick={handleCapture}>Guardar Firma</Button>
      </div>
    </div>
  )
}

