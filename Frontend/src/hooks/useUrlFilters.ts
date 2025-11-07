import { useSearchParams } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { Filter, Operator } from "@/components/presupuestos/types/filters";

interface UseUrlFiltersOptions {
  /** Campos que se sincronizarán con la URL */
  urlFields?: string[];
  /** Operadores por defecto para cada campo */
  defaultOperators?: Record<string, Operator>;
  /** Si debe actualizar la URL cuando cambien los filtros */
  syncToUrl?: boolean;
}

/**
 * Hook genérico para sincronizar filtros con URL parameters
 * 
 * @param filters - Filtros actuales del TableBuilder
 * @param setFilters - Función para actualizar filtros del TableBuilder
 * @param options - Opciones de configuración
 * @returns Funciones para manejar filtros con sincronización URL
 */
export const useUrlFilters = (
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  options: UseUrlFiltersOptions = {}
) => {
  const {
    urlFields = ['estado', 'proveedor', 'cliente_proyecto'],
    defaultOperators = {
      estado: 'equals' as Operator,
      proveedor: 'contains' as Operator,
      cliente_proyecto: 'contains' as Operator
    },
    syncToUrl = true
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializar filtros desde URL params
  useEffect(() => {
    const urlFilters: Filter[] = [];
    
    urlFields.forEach((field, index) => {
      const value = searchParams.get(field);
      if (value) {
        urlFilters.push({
          id: `url-filter-${index}`,
          field,
          operator: defaultOperators[field] || 'equals',
          value
        });
      }
    });

    // Manejo especial para el parámetro 'detalle' - mapear a 'id'
    const detalleValue = searchParams.get('detalle');
    if (detalleValue && !urlFilters.find(f => f.field === 'id')) {
      urlFilters.push({
        id: 'url-filter-detalle',
        field: 'id',
        operator: 'equals',
        value: detalleValue
      });
    }

    // Solo aplicar filtros si hay parámetros en la URL y no hay filtros ya aplicados
    if (urlFilters.length > 0 && filters.length === 0) {
      setFilters(urlFilters);
    }
  }, [searchParams, setFilters, filters.length, urlFields, defaultOperators]);

  // Función para actualizar filtros y URL
  const updateFiltersWithUrl = useCallback((newFilters: Filter[]) => {
    setFilters(newFilters);
    
    if (!syncToUrl) return;
    
    // Actualizar URL params
    const newParams = new URLSearchParams(searchParams);
    
    // Limpiar parámetros existentes (incluir 'detalle')
    urlFields.forEach(field => {
      newParams.delete(field);
    });
    newParams.delete('detalle');
    
    // Agregar nuevos filtros a la URL
    newFilters.forEach(filter => {
      if (urlFields.includes(filter.field)) {
        newParams.set(filter.field, filter.value);
      }
      // Si es un filtro por 'id', también agregarlo como 'detalle' para compatibilidad
      if (filter.field === 'id') {
        newParams.set('detalle', filter.value);
      }
    });
    
    setSearchParams(newParams);
  }, [setFilters, searchParams, setSearchParams, urlFields, syncToUrl]);

  // Función para crear filtros rápidos por campo
  const createQuickFilter = useCallback((field: string, value: string) => {
    const newParams = new URLSearchParams();
    newParams.set(field, value);
    setSearchParams(newParams);
  }, [setSearchParams]);

  // Función para limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    updateFiltersWithUrl([]);
  }, [updateFiltersWithUrl]);

  // Función para generar URL compartible
  const generateShareableUrl = useCallback((customFilters?: Record<string, string>) => {
    const params = new URLSearchParams();
    
    if (customFilters) {
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value && urlFields.includes(key)) {
          params.set(key, value);
        }
      });
    } else {
      // Usar filtros actuales
      filters.forEach(filter => {
        if (urlFields.includes(filter.field)) {
          params.set(filter.field, filter.value);
        }
      });
    }
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [filters, urlFields]);

  return {
    updateFiltersWithUrl,
    createQuickFilter,
    clearAllFilters,
    generateShareableUrl,
    searchParams,
    // Funciones para parámetros especiales
    getSpecialParam: (param: string) => searchParams.get(param),
    setSpecialParam: (param: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(param, value);
      setSearchParams(newParams);
    },
    removeSpecialParam: (param: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(param);
      setSearchParams(newParams);
    }
  };
};
