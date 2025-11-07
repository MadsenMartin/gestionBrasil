import axios from 'axios';
import { Documento } from '@/types/genericos'

type ResponseDocumentos = {
    next: string
    previous: string
    results: Documento[]
}

export const API_BASE_URL = import.meta.env.VITE_API_URL
export const LOGIN_URL = `${API_BASE_URL}/api/iva/token/`
const CLIENTES_PROYECTOS_URL = `${API_BASE_URL}/api/iva/clientes_proyectos/`
const PROVEEDORES_URL = `${API_BASE_URL}/api/iva/proveedores/`
const RECEPTORES_URL = `${API_BASE_URL}/api/iva/receptores/`
const TESORERIA_URL = `${API_BASE_URL}/api/tesoreria/`
const REGISTROS_URL = `${TESORERIA_URL}registros/`
const TIPOS_REG_URL = `${TESORERIA_URL}tipos_reg/`
const DOCUMENTOS_URL = `${API_BASE_URL}/api/iva/`
const DOCUMENTOS_ACTIVOS_URL = `${API_BASE_URL}/api/iva/activos/`
const IMPUTACIONES_URL = `${API_BASE_URL}/api/iva/imputaciones/`
const CAJAS_URL = `${API_BASE_URL}/api/tesoreria/cajas/`
const LOGOUT_URL = `${API_BASE_URL}/api/iva/logout/`
const REFRESH_URL = `${API_BASE_URL}/api/iva/token/refresh/`
const UNIDADES_DE_NEGOCIO_URL = `${API_BASE_URL}/api/iva/unidades_de_negocio/`
const TIPOS_DOCUMENTO_URL = `${API_BASE_URL}/api/iva/tipos_documento/`
const DOCUMENTOS_INACTIVOS_URL = `${API_BASE_URL}/api/iva/inactivos/`
const NUEVO_PAGO_URL = `${API_BASE_URL}/api/tesoreria/pagos/nuevo_pago/`
const DOCUMENTOS_IMPAGOS_URL = `${API_BASE_URL}/api/iva/impagos/`
const PAGOS_URL = `${API_BASE_URL}/api/tesoreria/pagos/`
const CC_V2_URL = `${API_BASE_URL}/api/reportes/cuentas_corrientes/`
const MOV_DE_CAJA_URL = `${API_BASE_URL}/api/reportes/movimientos_de_caja/`
const COBRANZAS_URL = `${TESORERIA_URL}cobranzas/`
const CERTIFICADOS_URL = `${COBRANZAS_URL}certificados/`
const PRESUPUESTOS_URL = `${API_BASE_URL}/api/tesoreria/presupuestos/`
const ESTADOS_PRESUPUESTO_URL = `${API_BASE_URL}/api/tesoreria/presupuestos/estados/`
const ESTADOS_PRESUPUESTO_CHOICES_URL = `${ESTADOS_PRESUPUESTO_URL}opciones/`
const COMENTARIOS_PRESUPUESTO_URL = `${PRESUPUESTOS_URL}comentarios/`
const ACTIVIDAD_PRESUPUESTO_URL = `${PRESUPUESTOS_URL}actividad/`
const CONSUMOS_PRESUPUESTO_URL = `${PRESUPUESTOS_URL}consumos/`
const CONSUMOS_FUERA_PRESUPUESTO_URL = `${PRESUPUESTOS_URL}consumos_fuera/`
const NOTIFICACIONES_URL = `${API_BASE_URL}/api/notificaciones/`
const DOLAR_MEP = `${API_BASE_URL}/api/tesoreria/mep/`
const RECIBO_URL = `${API_BASE_URL}/api/tesoreria/recibo/`
const PAGO_MDO = `${PAGOS_URL}mdo/`
const PERSONAS_URL = `${API_BASE_URL}/api/iva/personas/`
const IMPUTAR_DOCUMENTOS_URL = `${API_BASE_URL}/api/tesoreria/imputacion_facturas/`
const TAREAS_URL = `${API_BASE_URL}/api/tesoreria/tareas/`
const USER_URL = `${API_BASE_URL}/api/user/`
const PLANTILLAS_REGISTROS_URL = `${TESORERIA_URL}plantillas/`
const FCI_URL = `${API_BASE_URL}/api/tesoreria/fci/`
const MIS_COMPROBANTES_URL = `${API_BASE_URL}/api/iva/mis_comprobantes_recibidos/`
const ASIENTOS_INVERSOR_URL = `${API_BASE_URL}/api/inversiones/asientos_inversor/`
const INVERSORES_URL = `${API_BASE_URL}/api/inversiones/inversores/`
const ITEMS_PRESUPUESTO_CLIENTE_URL = `${API_BASE_URL}/api/presupuestos_cliente/presupuestos/`
const ITEMS_PRESUPUESTO_CLIENTES_PROYECTOS_URL = `${API_BASE_URL}/api/presupuestos_cliente/presupuestos/clientes-proyectos/`
const REGISTROS_PRESUPUESTO_CLIENTE_URL = `${API_BASE_URL}/api/presupuestos_cliente/presupuestos/registros-cliente/`
const CARGA_CAJA_URL = `${API_BASE_URL}/api/tesoreria/carga_caja/`
const MARCAR_COMO_RECUPERADO_URL = `${REGISTROS_URL}marcar_como_recuperado/`
const EXPORTAR_DOCUMENTOS_URLS = `${DOCUMENTOS_URL}exportar/`
const DESACOPIOS_URL = `${API_BASE_URL}/api/acopios/desacopios/`
const ACOPIOS_URL = `${API_BASE_URL}/api/acopios/`
const ARTICULOS_URL = `${API_BASE_URL}/api/acopios/articulos/`
const MUNICIPIO_URL = `${API_BASE_URL}/api/shared/municipios/`
const MONEDA_URL = `${API_BASE_URL}/api/shared/monedas/`
const PAGAR_DOCUMENTO_URL = `${DOCUMENTOS_URL}pagar_documento/`

export const URL_MAP: { [key: string]: string } = {
    registros: REGISTROS_URL,
    tipos_reg: TIPOS_REG_URL,
    documentos_activos: DOCUMENTOS_ACTIVOS_URL,
    documentos: DOCUMENTOS_URL,
    documentos_impagos: DOCUMENTOS_IMPAGOS_URL,
    proveedores: PROVEEDORES_URL,
    receptores: RECEPTORES_URL,
    cajas: CAJAS_URL,
    imputaciones: IMPUTACIONES_URL,
    tipos_documento: TIPOS_DOCUMENTO_URL,
    unidades_de_negocio: UNIDADES_DE_NEGOCIO_URL,
    clientes_proyectos: CLIENTES_PROYECTOS_URL,
    pagos: PAGOS_URL,
    certificados: CERTIFICADOS_URL,
    cobranzas: COBRANZAS_URL,
    presupuestos: PRESUPUESTOS_URL,
    estados_presupuesto: ESTADOS_PRESUPUESTO_URL,
    estados_presupuesto_choices: ESTADOS_PRESUPUESTO_CHOICES_URL,
    comentarios_presupuesto: COMENTARIOS_PRESUPUESTO_URL,
    actividad_presupuesto: ACTIVIDAD_PRESUPUESTO_URL,
    notificaciones: NOTIFICACIONES_URL,
    dolar_mep: DOLAR_MEP,
    recibo: RECIBO_URL,
    pago_mdo: PAGO_MDO,
    personas: PERSONAS_URL,
    tareas: TAREAS_URL,
    usuario: USER_URL,
    plantillas_registros: PLANTILLAS_REGISTROS_URL,
    fci: FCI_URL,
    mis_comprobantes: MIS_COMPROBANTES_URL,
    asientos_inversor: ASIENTOS_INVERSOR_URL,
    inversores: INVERSORES_URL,
    items_presupuesto_cliente: ITEMS_PRESUPUESTO_CLIENTE_URL,
    items_presupuesto_clientes_proyectos: ITEMS_PRESUPUESTO_CLIENTES_PROYECTOS_URL,
    registros_presupuesto_cliente: REGISTROS_PRESUPUESTO_CLIENTE_URL,
    carga_caja: CARGA_CAJA_URL,
    marcar_como_recuperado: MARCAR_COMO_RECUPERADO_URL,
    exportar_documentos: EXPORTAR_DOCUMENTOS_URLS,
    consumos_presupuesto: CONSUMOS_PRESUPUESTO_URL,
    consumos_fuera_presupuesto: CONSUMOS_FUERA_PRESUPUESTO_URL,
    desacopios: DESACOPIOS_URL,
    acopios: ACOPIOS_URL,
    articulos: ARTICULOS_URL,
    municipio: MUNICIPIO_URL,
    moneda: MONEDA_URL,
    pagar_documento: PAGAR_DOCUMENTO_URL,
};

axios.defaults.withCredentials = true;

// Configura la instancia de Axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Función para actualizar el token en el encabezado de Axios
const setAuthorizationHeader = (token: string) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Token actualizado en el encabezado:", token);
};

export const login = async ({ username, password }: { username: string, password: string }) => {
    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        })

        return response
    } catch (error) {
        console.error('Error:', error)
    }
}

// Interceptor de respuesta para manejar errores 401
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Verificar si estamos en la página de login para evitar bucles infinitos
        const isLoginPage = window.location.pathname === '/login';

        if (error.response?.status === 401 && !originalRequest._retry && !isLoginPage) {
            originalRequest._retry = true;
            console.log("Token expirado, intentando refrescar el token...");
            const newToken = await refresh_token();
            if (newToken) {
                setAuthorizationHeader(newToken);
                console.log("Reintentando la solicitud original con el nuevo token");
                return apiClient(originalRequest);
            } else {
                console.log("No se pudo refrescar el token");
                // Redirigir al usuario a la página de inicio de sesión solo si no estamos ya allí
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const get_movimientos_de_caja = async (id, fecha_min, fecha_max) => {
    try {
        const response = await apiClient.get(`${MOV_DE_CAJA_URL}?caja=${id}&fecha_min=${fecha_min}&fecha_max=${fecha_max}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los movimientos de caja:', error);
        throw error;
    }
}

export const get_nueva_cuenta_corriente = async (id, entidad) => {
    try {
        if (entidad === "proveedores") {
            const response = await apiClient.get(`${CC_V2_URL}?proveedor=${id}`, { withCredentials: true });
            return response.data;
        } else if (entidad === "clientes") {
            const response = await apiClient.get(`${CC_V2_URL}?cliente=${id}`, { withCredentials: true });
            return response.data;
        }

    } catch (error) {
        console.error('Error al obtener las cuentas corrientes:', error);
        throw error;
    }
}

export const mov_entre_cuentas = async (data: FormData) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}mov_entre_cuentas/`, data, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al realizar el mov. entre cuentas:', error);
        throw error;
    }
}

export const get_mdo_vs_ppto_por_proveedor = async (proveedor: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/mdo_vs_ppto_x_entidad/?proveedor_id=${proveedor}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'mdo_vs_ppto_por_proveedor.xlsx'); // Cambia el nombre del archivo si es necesario
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return response.status;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/mdo_vs_ppto_x_entidad/?proveedor_id=${proveedor}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener mdo vs ppto por proveedor:', error);
        throw error;
    }
}

export const get_mdo_vs_ppto_por_obra = async (cliente_proyecto: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/mdo_vs_ppto_x_entidad/?cliente_proyecto_id=${cliente_proyecto}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'mdo_vs_ppto_por_obra.xlsx'); // Cambia el nombre del archivo si es necesario
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return response.status;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/mdo_vs_ppto_x_entidad/?cliente_proyecto_id=${cliente_proyecto}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener mdo vs ppto por obra:', error);
        throw error;
    }
}

export const get_presupuestos_por_proveedor = async (proveedor: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/presupuestos_por_proveedor/?proveedor=${proveedor}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'presupuestos_por_proveedor.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return response.status;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/presupuestos_por_proveedor/?proveedor=${proveedor}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los presupuestos por proveedor:', error);
        throw error;
    }
}

export const get_presupuestos_por_cliente_proyecto = async (cliente_proyecto: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/presupuestos_por_cliente_proyecto/?cliente_proyecto=${cliente_proyecto}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'presupuestos_por_cliente_proyecto.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/presupuestos_por_cliente_proyecto/?cliente_proyecto=${cliente_proyecto}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los presupuestos por cliente/proyecto:', error);
        throw error;
    }
}

export const get_gastos_por_casa = async (cliente_proyecto: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_casa/?cliente_proyecto_id=${cliente_proyecto}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'gastos_por_casa.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_casa/?cliente_proyecto_id=${cliente_proyecto}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los gastos por casa:', error);
        throw error;
    }
}

export const get_gastos_por_obra = async (cliente_proyecto: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_obra/?cliente_proyecto=${cliente_proyecto}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'gastos_por_obra.xlsx'); // Cambia el nombre del archivo si es necesario
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_obra/?cliente_proyecto=${cliente_proyecto}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los gastos por obra:', error);
        throw error;
    }
}

export const get_gastos_por_proveedor = async (proveedor: string, excel = false) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_proveedor/?proveedor=${proveedor}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'gastos_por_proveedor.xlsx'); // Cambia el nombre del archivo si es necesario
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_proveedor/?proveedor=${proveedor}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los gastos por proveedor:', error);
        throw error;
    }
}

export const get_gastos_por_unidad = async (unidad_de_negocio: string, excel = false, anomes_max: string, anomes_min: string) => {
    try {
        if (excel) {
            const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_unidad/?unidad_de_negocio=${unidad_de_negocio}&anomes_max=${anomes_max}&anomes_min=${anomes_min}&export=true`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'gastos_por_unidad.xlsx'); // Cambia el nombre del archivo si es necesario
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/gastos_por_unidad/?unidad_de_negocio=${unidad_de_negocio}&anomes_max=${anomes_max}&anomes_min=${anomes_min}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los gastos por unidad:', error);
        throw error;
    }
}

export const get_db_total = async () => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/api/reportes/db_total/?export=true`, {
            withCredentials: true,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'db_total.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    } catch (error) {
        console.error('Error al obtener el total de la base de datos:', error);
        throw error;
    }
}

export const nuevo_cobro_certificado = async (data: FormData) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}cobranzas/nuevo_cobro/`, data, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
        return response;
    } catch (error) {
        console.error('Error al cargar el cobro:', error);
        throw error;
    }
}

/**
 * Función CRUD genérica para interactuar con la API.
 * 
        if (!url) {
            console.error(`Modelo ${model} no soportado`);
            return { error: `Modelo ${model} no soportado` };
        }
 * @returns {Promise<object>} - La respuesta de la API.
 * @throws {Error} - Lanza un error si la solicitud falla.
 */

export const get_generico = async (model: keyof typeof URL_MAP, returning: boolean = false) => {
    try {
        const url = URL_MAP[model];
        if (!url) {
            throw new Error(`Modelo ${model} no soportado`);
        }
        const response = await apiClient.get(url, { withCredentials: true });
        return returning ? response.data.results : response.data;
    } catch (error) {
        console.error('Error al obtener respuesta de la API:', error);
        throw error;
    }
}

export const get_generico_params = async ({ model, params }: { model: string, params: string | {} }) => {
    try {
        const url = URL_MAP[model];
        if (!url) {
            throw new Error(`Modelo ${model} no soportado`);
        }
        const queryString = new URLSearchParams(params).toString();
        const response = await apiClient.get(`${url}?${queryString}`, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al obtener respuesta de la API:', error);
        throw error;
    }
}

export const get_recibo_registro = async ({ registro, caja, pagador }: { registro: number, caja: number, pagador: string }) => {
    try {
        const response = await apiClient.get(`${RECIBO_URL}?registro=${registro}&caja=${caja}&pagador=${pagador}`, {
            withCredentials: true,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'recibo.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    } catch (error) {
        console.error('Error al obtener el recibo:', error);
        throw error;
    }
}

export const get_generico_pk = async ({ model, id }: { model: string, id: number }) => {
    try {
        const url = URL_MAP[model];
        if (!url) {
            throw new Error(`Modelo ${model} no soportado`);
        }
        const response = await apiClient.get(`${url}${id}/`, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al obtener respuesta de la API:', error);
        throw error;
    }
}

export const get_historial_documento = async (documento_id) => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/api/iva/${documento_id}/historial/`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener el historial del documento:', error);
        throw error;
    }
}

export const get_historial_registro = async (registro_id: number) => {
    try {
        const response = await apiClient.get(`${REGISTROS_URL}${registro_id}/historial/`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener el historial del registro:', error);
        throw error;
    }
}

export const logout = async () => {
    const response = await axios.post(LOGOUT_URL, { withCredentials: true });
    return response.data;
};

export const nuevo_pago = async (data) => {
    try {
        const response = await apiClient.post(NUEVO_PAGO_URL, data, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al cargar el pago:', error);
        throw error;
    }
};

export const get_documentos_impagos = async (): Promise<ResponseDocumentos> => {
    try {
        const response = await apiClient.get(DOCUMENTOS_IMPAGOS_URL, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los documentos impagos:', error);
        throw error;
    }
};

export const get_documentos_inactivos = async () => {
    try {
        const response = await apiClient.get(DOCUMENTOS_INACTIVOS_URL, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los documentos inactivos:', error);
        throw error;
    }
};

export const get_lista_pagos_documentos = async () => {
    try {
        const response = await apiClient.get(PAGOS_URL, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener los pagos:', error);
        throw error;
    }
};

export const get_data = async (url: string) => {
    try {
        const response = await apiClient.get(url, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener respuesta de la API:', error);
        throw error;
    }
};

// Función para refrescar el token
export const refresh_token = async () => {
    try {
        const response = await apiClient.post(REFRESH_URL, { withCredentials: true });
        const newToken = response.data.access_token;
        return newToken;
    } catch (error) {
        console.error('Error al actualizar el token:', error);
        return null;
    }
};

export const post_generico = async ({ model, data }: { model: string, data?: any }) => {
    try {
        const url = get_model_url(model);
        if (data) {
            const response = await apiClient.post(url, data, { withCredentials: true });
            return response;
        } else {
            const response = await apiClient.post(url, { withCredentials: true });
            return response;
        }
    } catch (error) {
        console.error('Error al realizar la solicitud POST:', error);
        throw error;
    }
}

export const patch_generico = async ({ model, id, dif }: { model: string, id: number, dif: any }) => {
    try {
        const response = await apiClient.patch(`${get_model_url(model)}${id}/`, dif, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al realizar la solicitud PATCH:', error);
        throw error;
    }
}

const get_model_url = (model: string) => {
    try {
        const url = URL_MAP[model];
        if (!url) {
            throw new Error(`Modelo ${model} no soportado`);
        }
        return url;
    } catch (error) {
        console.error('Error al obtener la URL:', error);
        throw error;
    }
}

export const delete_generico = async ({ model, id }: { model: string, id: number }) => {
    try {
        const response = await apiClient.delete(`${get_model_url(model)}${id}/`, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al realizar la solicitud DELETE:', error);
        throw error;
    }
}

export const delete_generico_data = async ({ model, data }: { model: string, data: any }) => {
    try {
        const url = get_model_url(model);
        const response = await apiClient.delete(url, { data, withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al realizar la solicitud DELETE con data:', error);
        throw error;
    }
}

export const realizar_registro = async (pk: number, fecha: string) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}${pk}/realizar/`, { fecha }, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al realizar el registro:', error);
        throw error;
    }
}

export const get_registro_data = async (pk: number) => {
    try {
        const response = await apiClient.get(`${REGISTROS_URL}${pk}/`, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al buscar el registro:', error);
        throw error;
    }
}

export const registos_asociados = async (pk: number) => {
    try {
        const response = await apiClient.get(`${TESORERIA_URL}${pk}/asociados/`, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al obtener los registros asociados:', error);
        throw error;
    }
}

export const imputar_documentos = async (data) => {
    try {
        const response = await apiClient.post(IMPUTAR_DOCUMENTOS_URL, data, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al imputar los documentos:', error);
        throw error;
    }
}

interface Movimiento {
    cod_concepto: string
    nro_cheque: string
    debito: string
    credito: string
    nombre: string
    nro_doc: string
    fecha: string
    tipo: string
    sub_tipo: string
    ya_cargado: boolean
}

export const conciliacion_banco = async (data: FormData) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}conciliacion_bancaria/`, data, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al realizar la conciliación bancaria:', error);
        throw error;
    }
}

export const cargar_gasto_bancario = async (mov: Movimiento) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}conciliacion_bancaria/gasto_bancario/`, mov, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al cargar el gasto bancario:', error);
        throw error;
    }
}

export const crear_pago_desde_plantilla = async (movimiento: any, plantilla_id: number, monto: number) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}conciliacion_bancaria/pago_plantilla/`, {
            movimiento,
            plantilla_id,
            monto
        }, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al crear pago desde plantilla:', error);
        throw error;
    }
}

export const carga_archivo_registro = async (data: FormData) => {
    try {
        const response = await apiClient.post(`${TESORERIA_URL}subir_archivo/`, data, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        throw error;
    }
}

export const carga_archivo_presupuesto = async (data: FormData) => {
    try {
        const response = await apiClient.post(`${PRESUPUESTOS_URL}carga_archivo/`, data, { withCredentials: true });
        return response;
    } catch (error) {
        console.error('Error al cargar el archivo:', error);
        throw error;
    }
}

export const get_user_data = async () => {
    try {
        const response = await apiClient.get(USER_URL, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error('Error al obtener la información del usuario:', error);
        throw error;
    }
}

export const generar_transferencia_masiva = async (ids: number[]) => {
    try {
        const response = await apiClient.get(`${PAGOS_URL}transferencia_masiva/?op=${ids.join(',')}`, {
            withCredentials: true,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transferencia_masiva.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    } catch (error) {
        console.error('Error al generar el archivo:', error);
        throw error;
    }
}

export const exportar_documentos = async (data) => {
    try {
        const response = await apiClient.post(EXPORTAR_DOCUMENTOS_URLS, data, {
            withCredentials: true,
            responseType: 'blob'
        });
        
        if (response.status === 200) {
            // Ya no necesitas crear un nuevo Blob, response.data ya ES un blob
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `comprobantes_${data.añomes}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url); // Limpiar la memoria
        }
        
        return response;
    } catch (error) {
        console.error('Error al exportar los documentos:', error);
        throw error;
    }
}