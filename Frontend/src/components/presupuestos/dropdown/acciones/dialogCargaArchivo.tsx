import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { carga_archivo_presupuesto } from "@/endpoints/api";

interface DialogCargaArchivoProps {
    presupuesto: number;
    toast: Function;
    trigger: React.ReactNode;
}

export function DialogCargaArchivo({presupuesto, toast, trigger}: DialogCargaArchivoProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [descripcion, setDescripcion] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('descripcion', descripcion);
            formData.append('presupuesto', presupuesto.toString());
            await carga_archivo_presupuesto(formData);
            toast('Archivo cargado exitosamente');
            setOpen(false);
        } catch (error) {
            toast('Error al cargar el archivo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cargar Archivo</DialogTitle>
                    <DialogDescription>
                        Selecciona un archivo para cargarlo.
                    </DialogDescription>
                </DialogHeader>
                <div className="mb-4">
                    <input type="file" onChange={handleFileChange} />
                </div>
                {file && <p>Archivo seleccionado: {file.name}</p>}
                <Input type="text" placeholder="Descripción del archivo" className="mb-4" onChange={(e) => {setDescripcion(e.target.value)}}/>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button disabled={!file || loading} onClick={handleUpload}>
                        {loading ? 'Cargando...' : 'Cargar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}