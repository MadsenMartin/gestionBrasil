import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { get_generico_params, importar_documentos, ResultadoImportacionDocumentos } from "@/endpoints/api"

/*
 * Página de importación masiva de documentos (Excel + ZIP).
 *
 * Pensada para ser operada por un agente de IA desde el navegador:
 *  - Ruta directa (/iva/importar), sin diálogos ni menús que abrir.
 *  - Controles HTML nativos (<select>, <input type="file">) con id, name y label asociados.
 *  - El resultado queda persistente en el DOM (no solo en un toast), con el estado
 *    expuesto en data-estado y la respuesta cruda del backend en #resultado-json.
 */

type Receptor = { id: number, nombre: string, cnpj: string | null }

type Estado = "inicial" | "procesando" | "completado" | "completado_con_errores" | "error"

// Columnas que espera el backend (ver ImportarDocumentos.COLUMN_MAP en Backend/iva/views.py)
const COLUMNAS = [
    { nombre: "Tipo_de_Documento_Sistema", obligatoria: true, detalle: "Nombre exacto del tipo de documento" },
    { nombre: "Data_Emissao", obligatoria: true, detalle: "Fecha (celda fecha o AAAA-MM-DD)" },
    { nombre: "Fornecedor_Sistema", obligatoria: true, detalle: "CNPJ o Razón Social del proveedor existente" },
    { nombre: "Fornecedor_Razao_Social", obligatoria: false, detalle: "Razón Social. Obligatoria si el proveedor no existe en el sistema (se busca por este valor o se crea)" },
    { nombre: "Fornecedor_CNPJ", obligatoria: false, detalle: "CNPJ. Obligatorio si el proveedor no existe y hay que crearlo" },
    { nombre: "Serie", obligatoria: false, detalle: "Número entero (default 0)" },
    { nombre: "Numero_Nota", obligatoria: true, detalle: "Número entero, sin letras ni separadores" },
    { nombre: "Año/Mes_Imputación_Gasto", obligatoria: true, detalle: "AAAAMM" },
    { nombre: "Año/Mes_Imputación_Contable", obligatoria: true, detalle: "AAAAMM" },
    { nombre: "Tem_CNO?", obligatoria: false, detalle: "sim / si / true / 1" },
    { nombre: "Unidad_de_Negocio", obligatoria: false, detalle: "Nombre exacto" },
    { nombre: "Cliente/Proyecto", obligatoria: false, detalle: "Nombre exacto" },
    { nombre: "Imputación", obligatoria: false, detalle: "Nombre exacto" },
    { nombre: "Descricao_Servicos (Concepto)", obligatoria: false, detalle: "Texto" },
    { nombre: "Valor_Total", obligatoria: false, detalle: "Número" },
    { nombre: "ISS", obligatoria: false, detalle: "Número (impuestos retenidos)" },
    { nombre: "Moeda", obligatoria: true, detalle: "Nombre exacto de la moneda (ej. R$, U$D)" },
    { nombre: "Nombre_Archivo", obligatoria: true, detalle: "Nombre del PDF/imagen dentro del ZIP" },
    { nombre: "Fornecedor_Municipio", obligatoria: false, detalle: "Nombre exacto del municipio" },
    { nombre: "Estado", obligatoria: false, detalle: "Procesado (se saltea) / Sin procesar (se importa). Vacío = Sin procesar" },
]

const selectClassName = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

// El endpoint de receptores está paginado: recorro todas las páginas
const fetchReceptores = async (): Promise<Receptor[]> => {
    const receptores: Receptor[] = []
    let page = 1
    while (true) {
        const response = await get_generico_params({ model: "receptores", params: { page } })
        const data = response.data
        if (Array.isArray(data)) return data
        receptores.push(...data.results)
        if (!data.next) return receptores
        page++
    }
}

export function ImportarDocumentosView() {
    const formRef = useRef<HTMLFormElement>(null)
    const [receptores, setReceptores] = useState<Receptor[]>([])
    const [errorReceptores, setErrorReceptores] = useState<string | null>(null)
    const [estado, setEstado] = useState<Estado>("inicial")
    const [resultado, setResultado] = useState<ResultadoImportacionDocumentos | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchReceptores()
            .then(setReceptores)
            .catch((e) => setErrorReceptores(e.message))
    }, [])

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (!formData.get("receptor_cnpj")) {
            setEstado("error")
            setError('Falta seleccionar el receptor (campo "receptor_cnpj")')
            return
        }

        setEstado("procesando")
        setResultado(null)
        setError(null)
        try {
            const response = await importar_documentos(formData)
            setResultado(response.data)
            setEstado(response.data.errores.length ? "completado_con_errores" : "completado")
        } catch (e) {
            setEstado("error")
            setError(e.response?.data?.error || e.message)
        }
    }

    const nuevaImportacion = () => {
        formRef.current?.reset()
        setEstado("inicial")
        setResultado(null)
        setError(null)
    }

    const procesando = estado === "procesando"

    return (
        <div className="mx-auto p-3 w-full max-w-5xl space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Importar documentos</h1>
                <Link to="/iva" className="text-sm underline">Volver a documentos</Link>
            </div>

            <form
                ref={formRef}
                id="form-importar-documentos"
                name="importar_documentos"
                onSubmit={onSubmit}
                className="space-y-4 rounded-md border p-4"
            >
                <div className="space-y-1">
                    <Label htmlFor="receptor_cnpj">Receptor (obligatorio)</Label>
                    {errorReceptores ? (
                        <>
                            <Input id="receptor_cnpj" name="receptor_cnpj" placeholder="CNPJ del receptor" required disabled={procesando} />
                            <p className="text-xs text-muted-foreground">No se pudo cargar la lista de receptores ({errorReceptores}). Ingresá el CNPJ manualmente.</p>
                        </>
                    ) : (
                        <select id="receptor_cnpj" name="receptor_cnpj" required defaultValue="" className={selectClassName} disabled={procesando}>
                            <option value="" disabled>Seleccione un receptor</option>
                            {receptores.filter((r) => r.cnpj).map((r) => (
                                <option key={r.id} value={r.cnpj!}>{r.nombre} — CNPJ {r.cnpj}</option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-muted-foreground">Se aplica a todas las filas del Excel.</p>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="pagina">Hoja del Excel</Label>
                    <Input id="pagina" name="pagina" defaultValue="Facturas" disabled={procesando} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="excel">Archivo Excel (.xlsx, obligatorio)</Label>
                    <Input id="excel" name="excel" type="file" accept=".xlsx" required disabled={procesando} />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="archivos">ZIP con los comprobantes (.zip, obligatorio)</Label>
                    <Input id="archivos" name="archivos" type="file" accept=".zip" required disabled={procesando} />
                </div>

                <div className="flex justify-end gap-2">
                    {estado !== "inicial" && !procesando && (
                        <Button id="btn-nueva-importacion" type="button" variant="outline" onClick={nuevaImportacion}>
                            Nueva importación
                        </Button>
                    )}
                    <Button id="btn-importar" type="submit" disabled={procesando}>
                        {procesando ? "Importando..." : "Importar"}
                        {procesando && <Loader2 className="animate-spin ml-2" />}
                    </Button>
                </div>
            </form>

            <section id="resultado-importacion" aria-live="polite" data-estado={estado} className="space-y-4">
                <h2 className="sr-only">Resultado de la importación</h2>
                <p id="estado-importacion" className="text-sm">
                    Estado: <strong>{estado}</strong>
                </p>

                {estado === "error" && error && (
                    <Alert variant="destructive" id="error-importacion">
                        <AlertTitle>No se realizó la importación</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {resultado && (
                    <>
                        <Alert id="resumen-importacion" variant={resultado.errores.length ? "destructive" : "default"}>
                            <AlertTitle>Importación finalizada</AlertTitle>
                            <AlertDescription>
                                Documentos creados: <span id="cantidad-creados">{resultado.creados}</span>.
                                Filas omitidas (procesadas): <span id="cantidad-omitidos">{resultado.omitidos}</span>.
                                Filas con error: <span id="cantidad-errores">{resultado.errores.length}</span>.
                            </AlertDescription>
                        </Alert>

                        {resultado.errores.length > 0 && (
                            <div className="rounded-md border">
                                <Table id="tabla-errores-importacion">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-24">Fila Excel</TableHead>
                                            <TableHead>Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resultado.errores.map((err) => (
                                            <TableRow key={err.fila} data-fila={err.fila}>
                                                <TableCell>{err.fila}</TableCell>
                                                <TableCell>{err.error}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <details>
                            <summary className="cursor-pointer text-sm">Respuesta JSON</summary>
                            <pre id="resultado-json" className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                                {JSON.stringify(resultado, null, 2)}
                            </pre>
                        </details>
                    </>
                )}
            </section>

            <section id="formato-excel" className="space-y-2">
                <h2 className="text-lg font-semibold">Formato esperado del Excel</h2>
                <p className="text-sm text-muted-foreground">
                    Los encabezados van en la fila 2 (no distingue mayúsculas); la fila 1 se ignora. Desde la fila 3, cada fila es un documento.
                    Las filas se procesan de forma independiente: una fila con error no impide que se creen las demás.
                    Las columnas Chave_Acesso y Estado se ignoran.
                </p>
                <div className="rounded-md border overflow-x-auto">
                    <Table id="tabla-columnas-excel">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Columna</TableHead>
                                <TableHead>Obligatoria</TableHead>
                                <TableHead>Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {COLUMNAS.map((c) => (
                                <TableRow key={c.nombre}>
                                    <TableCell className="font-mono">{c.nombre}</TableCell>
                                    <TableCell>{c.obligatoria ? "Sí" : "No"}</TableCell>
                                    <TableCell>{c.detalle}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
        </div>
    )
}
