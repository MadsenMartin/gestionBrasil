import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "../ui/dropdown-menu";
import { DialogNuevoCobro } from "./nuevoCobroCertificado";
import { DialogNuevoISF } from "./nuevoISF";

export function SelectorTipoCobro({ toast, addItem }: { toast: any, addItem: any}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>Nuevo cobro</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DialogNuevoCobro toast={toast} addItem={addItem} trigger={
                    <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                        REC
                    </DropdownMenuItem>
                } />
                <DialogNuevoISF toast={toast} addItem={addItem} trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                    ISF
                </DropdownMenuItem>
                } />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}