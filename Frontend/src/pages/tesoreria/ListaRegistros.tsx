import { useState, useEffect } from "react"
import { Toaster, toast } from 'sonner';
import { get_generico, get_generico_params } from "@/endpoints/api"
import { TablaRegistros } from "@/components/tesoreria/tablaRegistros"
import { Caja } from "@/types/genericos"
import { useAuth } from "@/auth/authContext"

export function RegistrosView() {
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [cajaInicial, setCajaInicial] = useState<string | null>(null);
  const { loading, isRecepcion } = useAuth()

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        let cajasData = await get_generico('cajas');
        let allCajas = cajasData.results; // Initialize with the first page
        while (cajasData.next) {
          const nextData = await get_generico_params({ model: 'cajas', params: `?page=${new URL(cajasData.next).searchParams.get('page')}` });
          allCajas = [...allCajas, ...nextData.data.results]; // Accumulate results
          cajasData = nextData.data;
        }
        setCajas(allCajas); // Set the state once with all the data
        return allCajas;
      } catch (error) {
        console.error('Error fetching cajas:', error);
        toast.error("Error al cargar las cajas");
      }
    };
    const fetchUserData = async () => {
      try {
        await fetchCajas()
        const userData = await get_generico('usuario');
        const caja = cajas.find(caja => caja.dueño === userData.id)?.caja || null
        setCajaInicial(caja);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast("Error al cargar las cajas");
      }
    }
    fetchUserData();
  }, []);

  return (
    <div className="mx-auto w-full p-3">
      <div className="flex justify-between items-center mb-0 w-full">
        <h1 className="text-2xl font-bold mb-4">Cajas</h1>
      </div>
      {!loading && (!isRecepcion() ?
        <TablaRegistros
          cajas={cajas}
          toast={toast}
          cajaInicial={cajaInicial}
        />
        :
        <div className="flex justify-center items-center py-32 h-full w-full">
          <h1 className="text-2xl font-bold mb-4">No tienes permisos para ver esta sección</h1>
        </div>)}
      <Toaster />
    </div>
  );
}