import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DocumentosView } from './pages/shared/ListaDocumentos';
import { ProveedoresView } from './pages/shared/ListaProveedores';
import { ReceptoresView } from './pages/shared/ListaReceptores';
import { PagosView } from './pages/tesoreria/ListaPagos';
import { ClientesProyectosView } from './pages/shared/ListaClientesProyectos';
import { ConsultaCuentasCorrientes } from './pages/Reportes/CuentasCorrientes';
import { LoginForm } from './pages/login';
import Layout from './layout';
import { RegistrosView } from './pages/tesoreria/ListaRegistros'
import { CobranzasView } from './pages/tesoreria/ListaCobranzas';
import { VistaPresupuestos } from './pages/tesoreria/presupuestos';
import ReportingHub from './pages/reportes';
import { CustomerDataPage } from './pages/Reportes/gastosPorObra';
import InventarioPlaceholder from './pages/inventario/inventarioPlaceHolder';
import Inventario from './pages/inventario/pruebaInventario';
import { GastosPorUnidad } from './pages/Reportes/gastosPorUnidad';
import Dashboard from './pages';
import PanelUsuario from './pages/usuario';
import { MEP } from './pages/tesoreria/mep';
import { PresupuestosPorClienteProyecto } from './pages/Reportes/presupuestosPorClienteProyecto';
import { MDOVSPPTOXProveedor } from './pages/Reportes/MDOVSPPTOXProveedor';
import { MDOVSPPTOXObra } from './pages/Reportes/MDOVSPPTOXObra';
import { PresupuestosPorProveedor } from './pages/Reportes/presupuestosPorProveedor';
import { Ramon } from './pages/Reportes/ramon';
import { GastosPorCasa } from './pages/Reportes/gastosPorCasa';
import { MovimientosDeCaja } from './pages/Reportes/movimientosDeCaja';
import { PlantillasView } from './pages/tesoreria/ListaPlantillas';
import { AuthProvider } from './auth/authContext';
import ItemsPresupuestoCliente from './components/presupuestos_cliente/listaPresupuestosCliente';
import { GastosARecuperarPage } from './pages/tesoreria/gastosARecuperar';
import { DesacopiosView } from './pages/ListaDesacopios';
import { AcopiosView } from './pages/AcopiosView';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { LoadingOrError } from './components/onError';
import { Suspense } from 'react';

function renderError({ error }: FallbackProps) {
  return <LoadingOrError error={error} />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary fallbackRender={renderError}>
          <Suspense fallback={<LoadingOrError />}>
            <Routes>
              <Route path="" element={<Dashboard />} />
              <Route path="/" element={<Layout />}>
                <Route path="iva" element={<DocumentosView />} />
                <Route path="proveedores" element={<ProveedoresView />} />
                <Route path="receptores" element={<ReceptoresView />} />
                <Route path="cobranzas" element={<CobranzasView />} />
                <Route path="clientes_proyectos" element={<ClientesProyectosView />} />
                <Route path="reportes/cuentas_corrientes" element={<ConsultaCuentasCorrientes />} />
                <Route path="*" element={<h1>Not Found</h1>} />
                <Route path="presupuestos" element={<VistaPresupuestos />} />
                <Route path="pagos" element={<PagosView />} />
                <Route path="tesoreria" element={<RegistrosView />} />
                <Route path="tesoreria/gastos-a-recuperar" element={<GastosARecuperarPage />} />
                <Route path="reportes" element={<ReportingHub />} />
                <Route path="reportes/movimientos-de-caja" element={<MovimientosDeCaja />} />
                <Route path="reportes/gastos-por-obra" element={<CustomerDataPage />} />
                <Route path="reportes/gastos-por-unidad" element={<GastosPorUnidad />} />
                <Route path="reportes/presupuestos-por-cliente_proyecto" element={<PresupuestosPorClienteProyecto />} />
                <Route path="reportes/presupuestos-por-proveedor" element={<PresupuestosPorProveedor />} />
                <Route path="reportes/mdo-vs-ppto-x-proveedor" element={<MDOVSPPTOXProveedor />} />
                <Route path="reportes/mdo-vs-ppto-x-obra" element={<MDOVSPPTOXObra />} />
                <Route path="reportes/gastos-por-casa" element={<GastosPorCasa />} />
                <Route path="presupuestos_cliente" element={<ItemsPresupuestoCliente />} />
                <Route path="reportes/ramon" element={<Ramon />} />
                <Route path="inventario" element={<InventarioPlaceholder />} />
                <Route path="inventario_prueba" element={<Inventario />} />
                <Route path="tareas" element={<PanelUsuario />} />
                <Route path="mep" element={<MEP />} />
                <Route path="tesoreria/plantillas" element={<PlantillasView />} />
                <Route path="desacopios" element={<DesacopiosView />} />
                <Route path="acopios" element={<AcopiosView />} />
              </Route>
              <Route path="/login" element={<LoginForm />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}