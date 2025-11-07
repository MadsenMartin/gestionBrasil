import { Registro } from "@/types/genericos";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from 'lucide-react';
import { API_BASE_URL, registos_asociados } from "@/endpoints/api";
import { Documento, PagoFactura } from "@/types/genericos";
import { Label } from "../ui/label";
import { formatCurrency, formatDate } from "@/pages/tesoreria/dolarMEP";
import { Certificado, Retencion } from "../cobranzas/types";

interface Archivo {
    id: number;
    archivo: string;
    descripcion: string;
    fecha_subida: string;
    fecha_edicion: string;
    usuario: string;
}

interface RegistrosAsociados {
    registros_fc: Documento[];
    pagos: PagoFactura[];
    retencion: Retencion[];
    certificado: Certificado;
    archivos: Archivo[];
}

export function PDFPreview({ url }: { url: string }) {
    // Distingo PDF de imágen porque sino en caso de ser una imagen grande no se ajusta al Iframe
    const fileExtension = url.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '');
    const base_url = url.startsWith('http') ? '' : API_BASE_URL;
    
    if (isImage) {
        return (
            <div className="w-full flex justify-center border rounded-lg p-2">
                <img 
                    src={`${base_url}${url}`}
                    className="max-w-full max-h-[600px] object-contain"
                    alt="Document preview"
                />
            </div>
        );
    }
    
    return (
        <iframe
            src={`${base_url}${url}`}
            className="w-full h-[600px] border rounded-lg"
            title="PDF Preview"
        />
    );
}

export function DialogoRegistrosAsociados({ registro, trigger }: { registro: Registro, trigger: JSX.Element }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RegistrosAsociados | null>(null);
    const [activeTab, setActiveTab] = useState("documentos");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await registos_asociados(registro.id);
                if (response.status === 200) {
                    setData(response.data);
                    // Set active tab to first non-empty section
                    if (response.data.registros_fc.length > 0 || response.data.retencion) setActiveTab("documentos");
                    else if (response.data.pagos.length > 0) setActiveTab("pagos");
                    else if (response.data.certificado) setActiveTab("certificados");
                    else if (response.data.archivos.length > 0) setActiveTab("archivos");
                    else setActiveTab(null)
                } else {
                    console.error("Error al obtener registros asociados:", response);
                }
            } catch (error) {
                console.error("Error al obtener registros asociados:", error);
            } finally {
                setLoading(false);
            }
        };
        open && fetchData();
    }, [open, registro.id]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[calc(100vh-4rem)] overflow-y-auto m-4">
                <DialogHeader>
                    <DialogTitle>Registros asociados</DialogTitle>
                </DialogHeader>
                <DialogDescription></DialogDescription>
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !data?.certificado && data?.pagos.length === 0 && data?.registros_fc.length === 0 && data?.archivos.length === 0 && !data?.retencion
                    ? <Label className={"text-center text-xl py-8"}>No hay registros asociados</Label>
                    : (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger
                                    value="documentos"
                                    disabled={!data?.registros_fc?.length}
                                >
                                    Documentos ({(data?.registros_fc?.length|| 0) + (data?.retencion?.length || 0)})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pagos"
                                    disabled={!data?.pagos?.length}
                                >
                                    Ordenes de pago ({data?.pagos?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="certificados"
                                    disabled={!data?.certificado}
                                >
                                    Certificados ({data?.certificado ? 1 : 0})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="archivos"
                                    disabled={!data?.archivos?.length}
                                >
                                    Archivos ({data?.archivos?.length || 0})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="documentos" className="space-y-4">
                                {data?.registros_fc?.map((doc) => (
                                    <div key={doc.id} className="space-y-4">
                                        <div className="p-4 border rounded-lg">
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                <div>
                                                    <span className="font-medium">Tipo: </span>
                                                    {doc.tipo_documento}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Fecha: </span>
                                                    {formatDate(doc.fecha_documento)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Importe: </span>
                                                    {formatCurrency(doc.total)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Concepto: </span>
                                                    {doc.concepto}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Proveedor: </span>
                                                    {doc.proveedor}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Receptor: </span>
                                                    {doc.receptor}
                                                </div>
                                                {doc.comentario && (
                                                    <div>
                                                        <span className="font-medium">Comentario: </span>
                                                        {doc.comentario}
                                                    </div>
                                                )}
                                            </div>
                                            {doc.archivo && (
                                                <PDFPreview url={doc.archivo} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {data?.retencion?.map((ret) => (
                                <div key={ret.id} className="space-y-4">
                                    <div className="p-4 border rounded-lg">
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                            <div>
                                                <span className="font-medium">Tipo: Retención </span>
                                                {ret.tipo}
                                            </div>
                                            <div>
                                                <span className="font-medium">Fecha: </span>
                                                {formatDate(ret.fecha)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Número: </span>
                                                {ret.numero}
                                            </div>
                                            <div>
                                                <span className="font-medium">Fecha: </span>
                                                {ret.fecha}
                                            </div>
                                        </div>
                                        {ret.pdf_file && (
                                            <PDFPreview url={ret.pdf_file} />
                                        )}
                                    </div>
                                </div>
                            ))}
                            </TabsContent>

                            <TabsContent value="pagos" className="space-y-4">
                                {data?.pagos?.map((pago) => (
                                    <div key={pago.id} className="space-y-4">
                                        <div className="p-4 border rounded-lg">
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                <div>
                                                    <span className="font-medium">ID: </span>
                                                    {pago.id}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Fecha: </span>
                                                    {formatDate(pago.fecha_pago)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Importe: </span>
                                                    {formatCurrency(pago.monto)}
                                                </div>
                                            </div>
                                            {pago.op && (
                                                <PDFPreview url={pago.op} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                            <TabsContent value="certificados" className="space-y-4">
                                {data?.certificado && (
                                    <div key={data.certificado.id} className="p-4 border rounded-lg">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="font-medium">Cliente/Proyecto: </span>
                                                {data.certificado.cliente_proyecto}
                                            </div>
                                            <div>
                                                <span className="font-medium">Número: </span>
                                                {data.certificado.numero}
                                            </div>
                                            <div>
                                                <span className="font-medium">Fecha: </span>
                                                {formatDate(data.certificado.fecha)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Neto: </span>
                                                {formatCurrency(data.certificado.neto)}
                                            </div>
                                            <div>
                                                <span className="font-medium">IVA: </span>
                                                {formatCurrency(data.certificado.iva)}
                                            </div>
                                            <div>
                                                <span className="font-medium">Saldo: </span>
                                                {formatCurrency(data.certificado.saldo)}
                                            </div>
                                            {data.certificado.observacion && (
                                                <div className="col-span-2">
                                                    <span className="font-medium">Observación: </span>
                                                    {data.certificado.observacion}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="archivos" className="space-y-4">
                                {data?.archivos?.map((archivo) => (
                                    <div key={archivo.id} className="space-y-4">
                                        <div className="p-4 border rounded-lg">
                                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                <div>
                                                    <span className="font-medium">Descripción: </span>
                                                    {archivo.descripcion}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Fecha de subida: </span>
                                                    {archivo.fecha_subida}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Fecha de edición: </span>
                                                    {archivo.fecha_edicion}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Usuario: </span>
                                                    {archivo.usuario}
                                                </div>
                                            </div>
                                            {archivo.archivo && (
                                                <PDFPreview url={archivo.archivo} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                        </Tabs>
                    )}
            </DialogContent>
        </Dialog>
    );
}