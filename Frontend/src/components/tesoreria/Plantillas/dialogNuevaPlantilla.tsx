import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { FormNuevaPlantillaRegistro } from "./formNuevaPlantilla";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DialogNuevaPlantillaProps {
    toast: Function
    addPlantilla?: Function
    updateItem?: Function
    data?: any
}

export function DialogNuevaPlantilla({toast, addPlantilla, updateItem, data}: DialogNuevaPlantillaProps) {
    const [showForm, setShowForm] = useState(false)

    return (
        <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
                {data
                    ? <DropdownMenuItem onSelect={(event) => event.preventDefault()}>Editar</DropdownMenuItem>
                    :<Button>Crear Plantilla</Button>}
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} >
                <DialogTitle style={{ textAlign: 'center' }}>Crear Nueva Plantilla</DialogTitle>
                <Card className="w-full max-h-fit">
                    <CardContent className="p-4">
                        <FormNuevaPlantillaRegistro toast={toast} addPlantilla={addPlantilla} setShowForm={setShowForm} updateItem={updateItem} data={data} />
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>

    )
}