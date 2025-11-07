import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function InventarioPlaceholder() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Inventario</h1>
      
      <Alert variant="default" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Módulo en desarrollo</AlertTitle>
        <AlertDescription>
          Esta sección está actualmente en desarrollo. Pronto podrás gestionar el inventario desde acá.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
            <CardDescription>Controla el inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Supervisa y actualiza los niveles de stock.</p>
          </CardContent>
          <CardFooter>
            <Button disabled>Gestionar stock</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informes</CardTitle>
            <CardDescription>Analiza el inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Genera informes detallados sobre el inventario.</p>
          </CardContent>
          <CardFooter>
            <Button disabled>Ver informes</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
