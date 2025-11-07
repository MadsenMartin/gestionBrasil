import { NuevaCuentaCorriente } from './types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TablaProveedor({ cuentaCorriente }: { cuentaCorriente: NuevaCuentaCorriente }) {

    const handleRowClick = (movimiento) => {
        if (movimiento.tipo_reg === 'FC') {
            console.log('FC', movimiento)
        }
    }

    const formatDate = (date: string) => {
        return date.split('T')[0].split('-').reverse().join('/')
      }

    return(
        <Card>
        <CardContent className="pt-6">
        <div className="rounded-md border">
            <Table>
            <TableHeader>
            <TableRow>
                <TableCell colSpan={6} className="font-bold">Saldo Final</TableCell>
                <TableCell className={`text-right font-bold ${cuentaCorriente.saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cuentaCorriente.saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </TableCell>
                </TableRow>
                <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Caja</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className='text-right'>Total gasto/ingreso</TableHead>
                <TableHead className='text-right'>Monto OP/REC</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cuentaCorriente.registros.map((movimiento, index) => (
                <TableRow key={index} onClick={() => handleRowClick(movimiento)}>
                    <TableCell>{formatDate(movimiento.fecha_reg)}</TableCell>
                    <TableCell>{movimiento.tipo_reg}</TableCell>
                    <TableCell>{movimiento.caja}</TableCell>
                    <TableCell>{movimiento.observacion}</TableCell>
                    <TableCell className='text-right'>{`$${(Number(movimiento.monto_gasto_ingreso_neto) + Number(movimiento.iva_gasto_ingreso)).toFixed(2)}`}</TableCell>
                    <TableCell className='text-right'>{movimiento.monto_op_rec}</TableCell>
                    <TableCell className={`text-right ${movimiento.monto_op_rec < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {movimiento.neto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
        </CardContent>
        </Card>
    )
}