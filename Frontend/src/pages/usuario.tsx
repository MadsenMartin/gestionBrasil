'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { get_generico, patch_generico } from '@/endpoints/api'

interface Tarea {
  id: number
  presupuesto: string
  asignado_a: string
  descripcion: string
  estado: number
  estado_display: string
  link_to: string
}

export default function PanelUsuario() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTareas = async () => {
      try {
        const response = await get_generico('tareas')
        setTareas(response)
      } catch (err) {
        setError('Error fetching tareas. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTareas()
  }, [])

  const getEstadoBadgeColor = (estado: number) => {
    switch (estado) {
      case 1:
        return 'bg-yellow-500'
      case 2:
        return 'bg-blue-500'
      case 3:
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  const marcar_como_leida = async (id: number) => {
    const response = await patch_generico({model: 'tareas', id: id, dif:{estado: 2}})
    if (response.status === 200) {
      const new_tareas = tareas.map(tarea => {
        if (tarea.id === id) {
          tarea.estado = 2
          tarea.estado_display = 'Leida'
        }
        return tarea
      })
      setTareas(new_tareas)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lista de Tareas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tareas.length > 0 
            ?tareas?.map((tarea) => (
              <TableRow key={tarea.id}  onMouseOver={() => tarea.estado===1 && marcar_como_leida(tarea.id)} className={`${tarea.estado===1 ? 'bg-green-100' : ''}`}>
                <TableCell><a href={tarea.link_to}>{tarea.descripcion}</a></TableCell>
                <TableCell>
                  <Badge className={getEstadoBadgeColor(tarea.estado)}>
                    {tarea.estado_display}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          : <TableRow>
              <TableCell colSpan={2} className='font-bold text-center'>No tenés tareas</TableCell>
            </TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
