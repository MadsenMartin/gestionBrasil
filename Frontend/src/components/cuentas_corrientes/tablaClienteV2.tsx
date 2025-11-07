import { CuentaCorrienteCliente } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react';

export function TablaCliente({ data }: { data: CuentaCorrienteCliente }) {
    const [expandedCertificados, setExpandedCertificados] = useState<Set<string>>(new Set())

    const toggleExpand = (certificadoNumero: string) => {
        setExpandedCertificados(prev => {
          const newSet = new Set(prev)
          if (newSet.has(certificadoNumero)) {
            newSet.delete(certificadoNumero)
          } else {
            newSet.add(certificadoNumero)
          }
          return newSet
        })
      }
    
    const toggleExpandAll = () => {
        if (expandedCertificados.size > 0) {
          setExpandedCertificados(new Set())
        } else {
          setExpandedCertificados(new Set(Array.isArray(data.detalle) ? data.detalle.map(movimiento => movimiento.certificado.numero) : []))
        }
      }

      const formatDate = (date: string) => {
        return format(new Date(date), 'dd/MM/yyyy', { locale: es })
      }
    
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
      }
    
      return (
        <Card className="w-full p-4">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Button variant="ghost" size="sm" onClick={toggleExpandAll}>
                        {expandedCertificados.size > 0 ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                  </TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Observación</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(data.detalle) && data.detalle.map((movimiento) => (
                  <>
                    <TableRow key={movimiento.certificado.numero}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(movimiento.certificado.numero)}
                        >
                          {expandedCertificados.has(movimiento.certificado.numero) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{movimiento.certificado.numero}</TableCell>
                      <TableCell>{formatDate(movimiento.certificado.fecha)}</TableCell>
                    <TableCell>{movimiento.certificado.observacion}</TableCell>
                      <TableCell className="text-right">{formatCurrency(movimiento.certificado.neto)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(movimiento.certificado.iva)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(movimiento.saldo)}</TableCell>
                    </TableRow>
                    {expandedCertificados.has(movimiento.certificado.numero) && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha de Pago</TableHead>
                                <TableHead>Caja</TableHead>
                                <TableHead>Observación</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {movimiento.pagos.map((pago, index) => (
                                <TableRow key={index}>
                                  <TableCell>{formatDate(pago.fecha_reg)}</TableCell>
                                    <TableCell>{pago.caja}</TableCell>
                                    <TableCell>{pago.observacion}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(pago.monto_op_rec)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-right font-bold">
              Saldo Total: {formatCurrency(data.saldo)}
            </div>
          </CardContent>
        </Card>
      )
    }