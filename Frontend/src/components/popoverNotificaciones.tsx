import { Bell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Notificacion } from '@/types/genericos'
import { get_generico, post_generico } from '@/endpoints/api'
import { useQuery } from '@tanstack/react-query'

export function NotificationesPopover() {
    const data = useQuery({
        queryKey:['notificaciones'],
        queryFn: async  () => get_generico('notificaciones'),
        staleTime: 1000*2,
        gcTime: 1000*5,
        refetchInterval: 1000*15,
    })


    const setNotificacionesLeidas = async () => {
        if (unreadCount > 0) {
            await post_generico({model:'notificaciones'})
        }
    }

    const unreadCount = data.data?.filter((n: Notificacion) => !n.leido).length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" onClick={(setNotificacionesLeidas)}>
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <span className="sr-only">Ver notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <h3 className="mb-2 text-lg font-semibold">Notificaciones</h3>
                <ScrollArea className="h-[300px]">
                    {data.data?.length > 0 ? (
                        <ul className="space-y-2">
                            {data.data?.map((notification) => (
                                <li key={notification.id} className={`p-2 rounded ${notification.leido ? 'bg-gray-100 dark:bg-gray-900 dark:text-white' : 'bg-blue-50 dark:bg-blue-900 dark:text-white'}`}>
                                    <p className="text-sm">{notification.mensaje}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {format(parseISO(notification.fecha), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500">No hay notificaciones</p>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}