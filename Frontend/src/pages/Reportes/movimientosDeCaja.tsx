import { ComboboxAPIFormless } from "@/components/comboboxes/ComboboxAPI";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Registro } from "@/types/genericos";
import { get_movimientos_de_caja } from "@/endpoints/api";
import { Input } from "@/components/ui/input";
import { TablaMovimientosDeCaja } from "@/components/reportes/tablaMovDeCaja";

interface RegistroCaja extends Registro {
  saldo_acumulado: number
}

export interface MovimientosDeCaja {
  saldo_inicial: number
  registros: RegistroCaja[]
  saldo_final: number
}

export function MovimientosDeCaja() {
    const [caja, setCaja] = useState<number | null>(null);
    const [cargando, setCargando] = useState(false);
    const [movimientos, setMovimientos] = useState<MovimientosDeCaja | null>(null);
    const [fechaMin, setFechaMin] = useState<string | null>(null);
    const [fechaMax, setFechaMax] = useState<string | null>(null);

    const handleConsultar = async () => {
        if (caja && fechaMin && fechaMax) {
            setCargando(true);
            try {
                const response = await get_movimientos_de_caja(caja, fechaMin, fechaMax);
                setMovimientos(response);
            } catch (error) {
                console.error("Error al obtener los movimientos:", error);
            } finally {
                setCargando(false);
            }
        }
    };

    return (
        <>
            <div className="flex justify-center gap-4">
                <Card className="max-w-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-end gap-4">
                            <div className="flex-1 max-w-sm">
                                <ComboboxAPIFormless
                                    model="cajas"
                                    fieldToSend="id"
                                    fieldToShow="caja"
                                    onValueChange={(value) => setCaja(Number(value))}
                                />
                                <Input type='date' placeholder='Fecha mínima' onChange={(e) => setFechaMin(e.target.value)} />
                                <Input type='date' placeholder='Fecha máxima' onChange={(e) => setFechaMax(e.target.value)} />
                            </div>
                            <Button
                                onClick={handleConsultar}
                                disabled={!caja || cargando}
                                className="min-w-[100px]"
                            >
                                {cargando ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cargando
                                    </>
                                ) : (
                                    "Consultar"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {movimientos && (
                <TablaMovimientosDeCaja
                    data={movimientos}
                />
            )}
        </>
    );
}