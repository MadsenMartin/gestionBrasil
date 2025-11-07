import { Toaster } from 'sonner';
import { TablaAcopios } from '@/components/acopios/TablaAcopios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Acopio } from '@/types/acopios';
import { get_generico } from '@/endpoints/api';

export function AcopiosView() {
    const [acopios, setAcopios] = useState<Acopio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAcopios = async () => {
            try {
                const data = await get_generico('acopios');
                setAcopios(data.results);
            } catch (error) {
                console.error('Error fetching acopios:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAcopios();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    const totalAcopios = acopios.length;
    const saldoTotal = acopios.reduce((sum, acopio) => sum + acopio.saldo, 0);
    const acopiosActivos = acopios.filter(acopio => acopio.saldo > 15000).length;
    const saldoCritico = acopios.filter(acopio => acopio.saldo < 100000 && acopio.saldo > 0).length;

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    return (
        <div className="mx-auto p-3 w-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold mb-4">Acopios</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Acopios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAcopios}</div>
                        <p className="text-xs text-muted-foreground">acopios registrados</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(saldoTotal)}</div>
                        <p className="text-xs text-muted-foreground">disponible</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acopios Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{acopiosActivos}</div>
                        <p className="text-xs text-muted-foreground">{"con saldo > $15,000"}</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Crítico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{saldoCritico}</div>
                        <p className="text-xs text-muted-foreground">acopios con saldo bajo</p>
                    </CardContent>
                </Card>
            </div>

            <TablaAcopios />
            <Toaster />
        </div>
    );
}