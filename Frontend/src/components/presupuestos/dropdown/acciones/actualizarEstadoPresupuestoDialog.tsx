import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm, Controller } from 'react-hook-form';
import { post_generico } from '@/endpoints/api';
import { useState } from 'react';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '../../../ui/select';
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '../../../ui/alert';
import { Presupuesto } from '../../types/presupuestos';

interface ActualizarEstadoPresupuestoDialogProps {
    toast?: any
    showForm: boolean
    setShowForm: any
    presupuesto: Presupuesto
    updateItem: (updatedItem: any) => void
}

interface ActualizarEstadoPresupuestoForm {
    id: Presupuesto["id"]
    estado: string
}

export function ActualizarEstadoPresupuestoDialog({toast, showForm, setShowForm, presupuesto, updateItem}: ActualizarEstadoPresupuestoDialogProps) {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<ActualizarEstadoPresupuestoForm>();
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleFormSubmit = async (data: ActualizarEstadoPresupuestoForm) => {
        try {
          setIsSubmitting(true)
          setError('')
          await onSubmit(data)
          reset()
          const nuevo_aprobado = data.estado === '2'? "Aprobado" : data.estado === '99'? "Rechazado" : null;
          const updatedPresupuesto = { ...presupuesto, estado: STATUS_OPTIONS.find(opt => opt.value === data.estado)?.label || presupuesto.estado, aprobado: nuevo_aprobado ?? presupuesto.aprobado };
          updateItem(updatedPresupuesto);
          setShowForm(false)
        } catch (err) {
            console.log(err)
          setError('Hubo un error al actualizar el estado. Por favor intente nuevamente.')
        } finally {
          setIsSubmitting(false)
        }
      }

    const onSubmit = async (data: ActualizarEstadoPresupuestoForm) => {
        try {
            const response = await post_generico({model:'estados_presupuesto', data:{...data, presupuesto: presupuesto.id}})
            if (response.status === 403) {
                throw new Error('No tiene permisos para realizar esta acción.')
            }
            if (response.status === 201) {
                reset()
                toast('Estado actualizado exitosamente')
                setShowForm(false)
            } else {  
                throw new Error('Error en la respuesta del servidor.')
            }
        } catch (error) {
            toast('Error al actualizar el estado: ' + error)
            throw error
        }
    }


    const STATUS_OPTIONS = [
        { value: '1', label: 'Cargado' },
        { value: '2', label: 'Aprobado' },
        { value: '3', label: 'Completo' },
        { value: '4', label: 'Excedido' },
        { value: '5', label: 'Ampliado' },
        { value: '99', label: 'Rechazado' },
      ] as const

    return(
        <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Actualizar estado</DialogTitle>
            <DialogDescription className="text-center">
              Seleccione el nuevo estado para el presupuesto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground text-center">
                  Estado actual
                </h3>
                <p className="text-lg font-semibold text-center">
                  {presupuesto?.estado}
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground text-center">
                  Nuevo estado
                </h3>
                <Controller
                  name="estado"
                  control={control}
                  rules={{ required: "Seleccione un estado" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.estado && (
                  <p className="text-sm text-destructive">{errors.estado.message}</p>
                )}
              </div>
            </div>
  
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
  
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )

}