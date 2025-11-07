import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, SendIcon, ActivityIcon, MessageSquareIcon, DollarSign, Loader2, File } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EstadoPresupuesto, ComentariosPresupuesto, Presupuesto } from '../../types/presupuestos'
import { API_BASE_URL, get_generico_params, post_generico } from '@/endpoints/api'
import { DialogDescription } from '@radix-ui/react-dialog'
import { formatDate } from '@/pages/tesoreria/dolarMEP'
import { PDFPreview } from '../../../tesoreria/dialogoRegistrosAsociados'

interface ConsumoPresupuesto {
    id: number
    presupuesto: number
    total: number
    fecha_reg: string
    observacion: string
    caja: string
    tipo_reg: string
    accion: string
    fecha: string
}

interface ArchivoPresupuesto {
    id: number
    accion: string
    archivo: string
    descripcion: string
    fecha: string
    usuario: string
}

interface PresupuestoDetalleDialogProps {
    presupuesto: Presupuesto
    children: React.ReactNode
    toast: any
}

export function PresupuestoDetalleDialog({ presupuesto, children, toast }: PresupuestoDetalleDialogProps) {
    const [actividades, setActividades] = useState<(EstadoPresupuesto | ComentariosPresupuesto | ConsumoPresupuesto)[]>([])
    const [nuevoComentario, setNuevoComentario] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchActividades()
        }
    }, [isOpen])

    const fetchActividades = async () => {
        try {
            setIsFetching(true)
            const queryParam = `?presupuesto_id=${presupuesto.id}`
            const response = await get_generico_params({ model: 'actividad_presupuesto', params: queryParam })
            setIsFetching(false)
            setActividades(response.data)
        } catch (error) {
            console.error('Error fetching actividades:', error)
            toast('Error al obtener el historial del presupuesto. Por favor intente nuevamente.')
        }
    }

    const handleSubmitComentario = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nuevoComentario.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const body = {
                comentario: nuevoComentario,
                presupuesto_id: presupuesto.id
            }
            await post_generico({ model: 'comentarios_presupuesto', data: body })
            await fetchActividades()
            setNuevoComentario('')
        } catch (error) {
            console.error('Error al guardar el comentario:', error)
            toast('Error al guardar el comentario. Por favor intente nuevamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Función para detectar si el archivo es una imagen
    function isImageFile(url: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }

    // Función para obtener el nombre del archivo desde la URL
    function getFileNameFromUrl(url: string): string {
        try {
            const path = new URL(url).pathname;
            return path.split('/').pop() || 'archivo';
        } catch {
            // Si no es una URL válida, intenta extraer el nombre del archivo de la cadena
            return url.split('/').pop() || 'archivo';
        }
    }

    const abrirArchivoButton = (actividad: ArchivoPresupuesto) => {
        return (
            <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => window.open(API_BASE_URL + actividad.archivo, '_blank')}
            >
                <File className="h-4 w-4" />
                Abrir {getFileNameFromUrl(actividad.archivo)}
            </Button>
        )
    }

    const renderActividad = (actividad: EstadoPresupuesto | ComentariosPresupuesto | ConsumoPresupuesto | ArchivoPresupuesto) => {
        const isEstado = 'estado' in actividad
        const isConsumo = 'fecha_reg' in actividad
        const isArchivo = 'archivo' in actividad
        const icon = isEstado ? <ActivityIcon className="h-4 w-4" /> : isConsumo ? <DollarSign className="h-4 w-4" /> : isArchivo ? <File className="h-4 w-4" /> : <MessageSquareIcon className="h-4 w-4" />
        const content = isEstado ? actividad.accion : isConsumo ? actividad.accion : isArchivo ? actividad.descripcion : actividad.comentario

        return (
            <>
                <div key={actividad.fecha} className="flex items-start space-x-4">
                    <div className="mt-1">
                        {icon}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{isConsumo ? actividad.caja : actividad.usuario}</p>
                            <span className="text-xs text-muted-foreground">{actividad.fecha.length > 10 ? format(new Date(actividad.fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es }) : formatDate(actividad.fecha)}</span>
                        </div>
                        <p className="text-sm">{content}</p>
                        {isEstado && actividad.observacion && (
                            <p className="text-sm text-muted-foreground">{actividad.observacion}</p>
                        )}
                    </div>
                </div>
                {isArchivo && (
                    <div className="flex items-center justify-between mt-2">
                        {actividad.archivo.toLowerCase().endsWith(".pdf") ? (
                            <div className='mx-0 w-full'>
                            {abrirArchivoButton(actividad)}
                            <PDFPreview url={actividad.archivo} />
                            </div>
                        ) : isImageFile(actividad.archivo) ? (
                            <div className="w-full">
                                <PDFPreview url={actividad.archivo} />
                            </div>
                        ) : (
                            <>
                            {abrirArchivoButton(actividad)}
                            </>
                        )}
                    </div>
                )}
            </>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[calc(100vh-50px)]">
                <DialogHeader>
                    <DialogDescription className="text-center"> </DialogDescription>
                    <DialogTitle className="text-2xl font-semibold">Detalle del Presupuesto</DialogTitle>
                    <Badge variant="outline" className="font-medium w-fit">
                       {presupuesto.id} - {presupuesto.cliente_proyecto} - {presupuesto.proveedor} - {presupuesto.observacion}
                    </Badge>
                </DialogHeader>
                <ScrollArea className='max-h-[calc(100vh-200px)]'>

                    <div className="space-y-3">
                        {/* Información General */}
                        <div className="rounded-lg bg-card p-6 shadow-sm border">
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>Fecha:</span>
                                    </div>
                                    <span className="font-medium">{formatDate(presupuesto.fecha)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Monto:</span>
                                    </div>
                                    <span className="font-medium text-lg">
                                        ${parseFloat(presupuesto.monto).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Saldo:</span>
                                    </div>
                                    <span className="font-medium text-lg">
                                        ${parseFloat(presupuesto.saldo).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Estado:</span>
                                    </div>
                                    <Badge variant="outline" className="font-medium">
                                        {presupuesto.estado}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actividad */}
                        <div className="rounded-lg bg-card p-4 shadow-sm border">
                            <h3 className="text-lg font-semibold mb-4">Actividad</h3>

                            <ScrollArea className="h-[calc(100vh-660px)] pr-4">

                                <div className="space-y-4">

                                    {isFetching ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    )
                                        : actividades.length === 0 && (
                                            <div className="flex items-center justify-center">
                                                <p className="text-sm text-muted-foreground">No hay actividades registradas.</p>
                                            </div>
                                        )}

                                    {actividades.map((actividad, index) => (
                                        <div key={`${actividad.id}-${actividad.accion}`}>
                                            {renderActividad(actividad)}
                                            {index < actividades.length - 1 && <Separator className="my-4" />}
                                        </div>
                                    ))}

                                </div>

                            </ScrollArea>

                            {/* Nuevo Comentario */}
                            <form onSubmit={handleSubmitComentario} className="mt-4">
                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Escribe un comentario..."
                                        value={nuevoComentario}
                                        onChange={(e) => setNuevoComentario(e.target.value)}
                                        className="min-h-[80px]"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !nuevoComentario.trim()}
                                        >
                                            <SendIcon className="h-4 w-4 mr-2" />
                                            Enviar Comentario
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}