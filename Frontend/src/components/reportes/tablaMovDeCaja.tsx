import { Card, CardContent} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '../ui/label';
import { Registro } from '@/types/genericos';

interface RegistroCaja extends Registro {
  saldo_acumulado: number
}

export interface MovimientosDeCaja {
  saldo_inicial: number
  registros: RegistroCaja[]
  saldo_final: number
}

export function TablaMovimientosDeCaja({ data }: { data: MovimientosDeCaja }) {

     const formatDate = (date: string) => {
        return date.split('T')[0].split('-').reverse().join('/')
      }
    
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
      }
    
      return (
        <Card className="w-full p-4">
          <CardContent>
          <div className="mb-2 flex justify-between items-end">
              <Label className='font-bold'>Saldo inicial: {formatCurrency(data.saldo_inicial)}</Label>
            </div>
            <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Caja</TableHead>
                  <TableHead>Tipo Doc</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead className='text-right'>Neto</TableHead>
                  <TableHead className='text-right'>IVA</TableHead>
                  <TableHead className='text-right'>Monto OP/REC</TableHead>
                  <TableHead className='text-right'>Saldo</TableHead>
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
                    <TableCell className={`text-right ${movimiento.saldo_acumulado > 0 ? `text-green-400`: movimiento.saldo_acumulado < 0 &&`text-red-500`}`}>{formatCurrency(movimiento.saldo_acumulado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )
    }
    