import * as React from "react"
import { Loader2, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DialogoConfirmacionProps {
  trigger?: React.ReactNode
  title?: string
  mensaje: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  className?: string
}

export function DialogConfirmacion({
  trigger,
  title = "Confirmación",
  mensaje,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "destructive",
  className,
}: DialogoConfirmacionProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      await onConfirm();
    } catch (error) {
      // Handle the error appropriately.  For example, display an error message.
      console.error("Error during confirmation:", error);
      // Optionally, you might want to avoid closing the dialog if there's an error.
      return;
    } finally {
      setIsLoading(false)
      setOpen(false);
    }
  };

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader className="space-y-3">
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{mensaje}</p>
        </DialogHeader>
        <div className="flex justify-end gap-3">
        <DialogDescription></DialogDescription>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-8"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className="px-8"
            disabled={isLoading}
          >
            {confirmText}
            {isLoading && <Loader2 className="animate-spin ml-2 h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}