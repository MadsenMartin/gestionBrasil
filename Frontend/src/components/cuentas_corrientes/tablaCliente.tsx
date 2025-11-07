import { Registro } from './types';
import { Card, CardContent} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '../ui/label';

interface RegistroCC extends Registro {
  neto: number
}

export interface CuentaCorriente {
  persona: string
  registros: RegistroCC[]
  saldo: number
}

export function TablaCliente({ data }: { data: CuentaCorriente }) {

      const formatDate = (date: string) => {
        return date.split('T')[0].split('-').reverse().join('/')
      }
    
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
      }
    
      return (
        <Card className="w-full p-4">
          <CardContent>
          <div className="mb-2 flex justify-between items-center">
              <Label className='font-bold'>{data.persona}</Label>
              <Label className='font-bold'>Saldo actual: {formatCurrency(data.saldo)}</Label>
            </div>
            <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Tipo Doc</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className='text-right'>Neto a ingresar</TableHead>
                  <TableHead className='text-right'>IVA a ingresar</TableHead>
                  <TableHead className='text-right'>Ingresó</TableHead>
                  <TableHead className='text-right'>Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.registros.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>{formatDate(movimiento.fecha_reg)}</TableCell>
                    <TableCell>{movimiento.caja}</TableCell>
                    <TableCell>{movimiento.tipo_reg}</TableCell>
                    <TableCell>{movimiento.observacion}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(movimiento.monto_gasto_ingreso_neto)}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(movimiento.iva_gasto_ingreso)}</TableCell>
                    <TableCell className='text-right'>{formatCurrency(movimiento.monto_op_rec)}</TableCell>
                    <TableCell className={`text-right ${movimiento.neto > 0 ? `text-green-400`: movimiento.neto < 0 &&`text-red-500`}`}>{formatCurrency(movimiento.neto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )
    }
    