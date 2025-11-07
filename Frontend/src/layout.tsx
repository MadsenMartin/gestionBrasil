import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import React, { useRef } from "react";
import { NotificationesPopover } from './components/popoverNotificaciones';
import { ScrollArea } from './components/ui/scroll-area';
import { cn } from './lib/utils';

export const ScrollContainerContext = React.createContext(null);

export default function Layout() {
  const scrollContainerRef = useRef(null);

  return (
    <SidebarProvider>
      <div className="flex w-screen h-screen overflow-hidden">
        <AppSidebar />
        <SidebarInset ref={scrollContainerRef} className="flex-1 overflow-auto">
          <main className="h-full">
            <header className={cn("flex justify-between items-center mb-4 border-b px-4 fixed w-screen bg-white dark:bg-black bg-opacity-95 z-10",import.meta.env.VITE_APP_HEADER_COLOR)}>
                <SidebarTrigger />
                <a href="/">
                  <h1 className="text-xl font-bold text-center">{import.meta.env.VITE_APP_TITLE}</h1>
                </a>
                <div className='flex justify-between'>
                <NotificationesPopover />
                <div>aaaa</div>
                </div>
            </header>
            <div className="pt-14">
              {/* Proporcionamos el contexto aquí */}
              <ScrollContainerContext.Provider value={scrollContainerRef}>
              <ScrollArea className="h-[calc(100vh-100px)] w-full">
                <Outlet /> {/* Aquí se renderizarán los componentes hijos */}
              </ScrollArea>
              </ScrollContainerContext.Provider>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}