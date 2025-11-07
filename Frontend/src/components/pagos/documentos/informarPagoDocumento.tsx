import { DialogGenerico } from "@/components/dialogs/dialogGenerico";
import { FieldConfig, FormGenerico } from "@/components/genericos/formGenerico";
import { FIELDS } from "@/config/models";
import { Documento } from "@/types/genericos";
import { useState } from "react";

interface InformarPagoDocumentoDialogProps {
    documento: Documento,
    updateItem: (item: Documento) => void,
    trigger: React.ReactNode
}

export function InformarPagoDocumentoDialog({ documento, updateItem, trigger }: InformarPagoDocumentoDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <DialogGenerico
            title="Informar pago de documento"
            trigger={trigger}
            description={"Complete los campos"}
            open={open}
            setOpen={setOpen}
            children={<InformarPagoDocumentoForm documento={documento} updateItem={updateItem} setOpen={setOpen} />}
        />
    )

}

function InformarPagoDocumentoForm({ documento, updateItem, setOpen }: { documento: Documento, updateItem: (item: Documento) => void, setOpen: (open: boolean) => void }) {
    const formFields: FieldConfig[] = [
        FIELDS.fecha,
        { ...FIELDS.monto, fullWidth: true, defaultValue: documento.total - documento.impuestos_retidos || 0 },
        { ...FIELDS.monto_retenido, defaultValue: documento.impuestos_retidos || 0 },
        { ...FIELDS.caja, fullWidth: true },
        { ...FIELDS.documento, defaultValue: documento.id }
    ] as FieldConfig[];

    return (
        <div className="gap-4">
            <div className="space-y-4 py-2">
                <div className="rounded-lg border bg-card p-4">
                    <FormGenerico
                        action='POST'
                        model='pagar_documento'
                        fields={formFields}
                        setOpen={setOpen}
                        onSuccess={updateItem}
                    />
                </div>
            </div>
        </div>

    )
}