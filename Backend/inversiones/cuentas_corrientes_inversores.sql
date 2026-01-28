CREATE OR REPLACE VIEW cuenta_corriente_inversores AS
WITH
-- Parte 1: Gastos directos de proyectos de inversión
gastos_directos AS (
    SELECT tr.id,
        tr.tipo_reg,
        tcaja.caja,
        tr.fecha_reg,
        tr."añomes_imputacion",
        iva_un.unidad_de_negocio,
        iva_cp.cliente_proyecto,

        -- Si ai.id no es null significa que es un asiento de inversor, asique usamos el inversor como tercero, sino tomamos la contrapartida
        CASE
            WHEN ai.id IS NOT NULL
            THEN ai_i.nombre
            ELSE COALESCE(iva_p.nombre_fantasia, iva_p.razon_social, '')
        END AS tercero,

        iva_imp.imputacion,
        tr.observacion AS descripcion,

        CASE
            WHEN tr.presupuesto_id IS NOT NULL THEN
                COALESCE(tp_cp.cliente_proyecto, ''::character varying) || ' - ' ||
                COALESCE(tp_prov.nombre_fantasia, tp_prov.razon_social, ''::character varying) || ' - ' ||
                COALESCE(tp.observacion, ''::character varying)
            ELSE NULL
        END AS presupuesto,

        tr.monto_gasto_ingreso_neto,
        tr.iva_gasto_ingreso,
        COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0) AS total_gasto_ingreso,
        tr.monto_op_rec,
        COALESCE(ai_i.nombre, i.nombre) AS inversor,
        mep.compra AS tipo_de_cambio_mep,

        -- Cuando el registro tiene tipo de cambio propio, lo usamos; si no, usamos el MEP
        CASE
            WHEN tr.tipo_de_cambio IS NOT NULL THEN
                CASE
                    WHEN tr.tipo_de_cambio <> 1 THEN
                        CASE
                            WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) IS NOT NULL THEN
                                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
                            ELSE NULL
                        END
                    WHEN tr.tipo_de_cambio = 1 AND tr.moneda_id = 2 THEN
                        COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)
                    ELSE
                        NULL
                END
            WHEN tr.tipo_de_cambio = 1 AND tr.moneda_id = 2 THEN
                COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)
            WHEN mep.compra IS NOT NULL THEN
                CASE
                    WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) IS NOT NULL THEN
                        (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
                    ELSE NULL
                END
            ELSE
                NULL
        END AS total_gasto_ingreso_dolar,

        COALESCE(pi.porcentaje, 100) AS porcentaje,

        -- Si es un asiento de inversor, dividimos el total por el porcentaje del inversor, sino usamos el total directamente
        CASE
            WHEN ai.id IS NOT NULL THEN
                COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)
            ELSE
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) * pi.porcentaje / 100
        END AS total_gasto_ingreso_inversor,
        ai.tipo_asiento AS tipo_asiento
    FROM tesoreria_registro tr
        LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
        LEFT JOIN tesoreria_registro_documento trd ON tr.id = trd.registro_id
        LEFT JOIN iva_documento iva_doc ON trd.documento_id = iva_doc.id
        LEFT JOIN iva_unidaddenegocio iva_un ON tr.unidad_de_negocio_id = iva_un.id
        LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
        LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
        LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
        LEFT JOIN tesoreria_presupuesto tp ON tr.presupuesto_id = tp.id
        LEFT JOIN iva_clienteproyecto tp_cp ON tp.cliente_proyecto_id = tp_cp.id
        LEFT JOIN iva_persona tp_prov ON tp.proveedor_id = tp_prov.id
        LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
        LEFT JOIN inversiones_asientoinversor ai ON tr.id = ai.registro_id
        LEFT JOIN inversiones_inversor ai_i ON ai.inversor_id = ai_i.id
        LEFT JOIN inversiones_porcentajeinversion pi ON tr.cliente_proyecto_id = pi.proyecto_id AND (ai.id IS NULL OR pi.inversor_id = ai.inversor_id)
        LEFT JOIN inversiones_inversor i ON pi.inversor_id = i.id
    WHERE tr.activo = true
        AND tr.tipo_reg NOT IN ('OP', 'MC', 'RETH', 'PERCS')
        AND iva_cp.unidad_de_negocio_id = 1 -- Unidad de negocio "Constructora"
        AND tr.cliente_proyecto_id IN (SELECT proyecto_id FROM inversiones_porcentajeinversion)
    GROUP BY tr.id, iva_un.unidad_de_negocio, tr.tipo_reg, tcaja.caja, tr.fecha_reg, tr."añomes_imputacion", iva_cp.cliente_proyecto, iva_p.nombre_fantasia, iva_p.razon_social, iva_imp.imputacion, tp_cp.cliente_proyecto, tp_prov.nombre_fantasia, tp_prov.razon_social, tp.observacion, tr.observacion, tr.monto_gasto_ingreso_neto, tr.iva_gasto_ingreso, tr.monto_op_rec, tr.moneda_id, tr.tipo_de_cambio, tr.realizado, ai_i.nombre, i.nombre, pi.porcentaje, mep.compra, ai.id
),

-- Parte 2: Gastos indirectos distribuidos según PorcentajeGastosInversion
gastos_indirectos AS (
    SELECT
        tr.id,
        tr.tipo_reg,
        tcaja.caja,
        tr.fecha_reg,
        tr."añomes_imputacion",
        iva_un.unidad_de_negocio,
        dest_cp.cliente_proyecto AS cliente_proyecto,
        -- Tercero: si es asiento de inversor usa el nombre del inversor, sino proveedor o caja_contrapartida
        CASE
            WHEN ai.id IS NOT NULL THEN ai_i.nombre
            ELSE COALESCE(iva_p.nombre_fantasia, iva_p.razon_social, caja_contra.caja, '')
        END AS tercero,
        iva_imp.imputacion,
        tr.observacion AS descripcion,
        CASE
            WHEN tr.presupuesto_id IS NOT NULL THEN
                COALESCE(tp_cp.cliente_proyecto, ''::character varying) || ' - ' ||
                COALESCE(tp_prov.nombre_fantasia, tp_prov.razon_social, ''::character varying) || ' - ' ||
                COALESCE(tp.observacion, ''::character varying)
            ELSE NULL
        END AS presupuesto,
        tr.monto_gasto_ingreso_neto AS monto_gasto_ingreso_neto,
        tr.iva_gasto_ingreso * pgi.porcentaje / 100 AS iva_gasto_ingreso,
        (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) AS total_gasto_ingreso,
        tr.monto_op_rec AS monto_op_rec,
        -- Inversor: si es asiento de inversor usa ai_i, sino usa i del porcentaje
        COALESCE(ai_i.nombre, i.nombre) AS inversor,
        mep.compra AS tipo_de_cambio_mep,
        CASE
            WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio != 1 THEN
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
            WHEN mep.compra IS NOT NULL THEN
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
            ELSE NULL
        END AS total_gasto_ingreso_dolar,
        COALESCE(pi.porcentaje, 100::numeric) AS porcentaje,
        -- Total para el inversor: si es asiento de inversor NO divide por porcentaje
        CASE
            WHEN ai.id IS NOT NULL THEN
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) * pgi.porcentaje / 100
            ELSE
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) * pgi.porcentaje / 100 * pi.porcentaje / 100
        END AS total_gasto_ingreso_inversor,
        ai.tipo_asiento
    FROM tesoreria_registro tr
        LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
        LEFT JOIN tesoreria_caja caja_contra ON tr.caja_contrapartida_id = caja_contra.id
        LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
        LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
        LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
        LEFT JOIN tesoreria_presupuesto tp ON tr.presupuesto_id = tp.id
        LEFT JOIN iva_clienteproyecto tp_cp ON tp.cliente_proyecto_id = tp_cp.id
        LEFT JOIN iva_persona tp_prov ON tp.proveedor_id = tp_prov.id
        LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
        LEFT JOIN iva_unidaddenegocio iva_un ON tr.unidad_de_negocio_id = iva_un.id
        -- JOIN para detectar asientos de inversor (aportes)
        LEFT JOIN inversiones_asientoinversor ai ON tr.id = ai.registro_id
        LEFT JOIN inversiones_inversor ai_i ON ai.inversor_id = ai_i.id
        -- JOIN con la tabla de porcentajes de gastos para obtener a qué proyectos se asignan los indirectos
        INNER JOIN inversiones_porcentajegastosinversion pgi ON tr."añomes_imputacion" = pgi.mes
        -- JOIN para obtener el nombre del proyecto destino
        INNER JOIN iva_clienteproyecto dest_cp ON pgi.proyecto_id = dest_cp.id
        -- JOIN para distribuir entre inversores: si es asiento solo para ese inversor, sino para todos
        LEFT JOIN inversiones_porcentajeinversion pi ON pgi.proyecto_id = pi.proyecto_id AND (ai.id IS NULL OR pi.inversor_id = ai.inversor_id)
        LEFT JOIN inversiones_inversor i ON pi.inversor_id = i.id
    WHERE tr.activo = true
        AND tr.tipo_reg NOT IN ('OP', 'MC', 'RETH', 'PERCS')
        AND iva_cp.cliente_proyecto = 'Indirectos'
        AND pgi.porcentaje > 0
        -- Filtrar: debe tener inversor (ya sea por asiento o por porcentaje)
        AND (ai.id IS NOT NULL OR pi.id IS NOT NULL)
),

-- Unión de gastos directos e indirectos
cuenta_corriente AS (
    SELECT * FROM gastos_directos
    UNION ALL
    SELECT * FROM gastos_indirectos
)

SELECT
    id AS "ID",
    unidad_de_negocio AS "Unidad de Negocio",
    cliente_proyecto AS "Filtro proyecto",
    inversor AS "Filtro inversor",
    fecha_reg AS "Fecha",
    tercero AS "Tercero",
    imputacion AS "Imputación",
    descripcion AS "Descripción",
    presupuesto AS "Presupuesto",
    total_gasto_ingreso AS "TOTAL Devengado (AR$)",
    total_gasto_ingreso_dolar AS "TOTAL Devengado (US$)",
    CASE
        WHEN tipo_asiento IS NOT NULL THEN NULL
        ELSE total_gasto_ingreso_inversor
    END AS "Devengado 25% x socio (AR$/Cab.)",
    CASE
        WHEN tipo_asiento IS NOT NULL THEN total_gasto_ingreso
        ELSE NULL
    END AS "Pagado ARS",
    CASE
        WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100
        ELSE total_gasto_ingreso_dolar
    END AS "Mov. US$",
    -- Saldo acumulado por inversor y proyecto
    SUM(CASE
        WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100
        ELSE total_gasto_ingreso_dolar
    END) OVER (
        PARTITION BY inversor, cliente_proyecto
        ORDER BY fecha_reg, id
        ROWS UNBOUNDED PRECEDING
    ) AS "Saldo US$"
FROM cuenta_corriente
ORDER BY fecha_reg, id;

# agregar c





 WITH cuenta_corriente AS (
         SELECT tr.id,
            tr.tipo_reg,
            tcaja.caja,
            tr.fecha_reg,
            tr."añomes_imputacion",
            iva_cp.cliente_proyecto,
                CASE
                    WHEN ai.id IS NOT NULL THEN ai_i.nombre
                    ELSE COALESCE(iva_p.nombre_fantasia, iva_p.razon_social, ''::character varying)
                END AS tercero,
            iva_imp.imputacion,
            tr.observacion AS descripcion,
                CASE
                    WHEN tr.presupuesto_id IS NOT NULL THEN (((COALESCE(tp_cp.cliente_proyecto, ''::character varying)::text || ' - '::text) || COALESCE(tp_prov.nombre_fantasia, tp_prov.razon_social, ''::character varying)::text) || ' - '::text) || COALESCE(tp.observacion, ''::character varying::text)
                    ELSE NULL::text
                END AS presupuesto,
            tr.monto_gasto_ingreso_neto,
            tr.iva_gasto_ingreso,
            COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric) AS total_gasto_ingreso,
            tr.monto_op_rec,
            COALESCE(ai_i.nombre, i.nombre) AS inversor,
            mep.compra AS tipo_de_cambio_mep,
                CASE
                    WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio <> 1::numeric THEN
                    CASE
                        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) IS NOT NULL THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / tr.tipo_de_cambio
                        ELSE NULL::numeric
                    END
                    WHEN mep.compra IS NOT NULL THEN
                    CASE
                        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) IS NOT NULL THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / mep.compra
                        ELSE NULL::numeric
                    END
                    ELSE NULL::numeric
                END AS total_gasto_ingreso_dolar,
            COALESCE(pi.porcentaje, 100::numeric) AS porcentaje,
                CASE
                    WHEN ai.id IS NOT NULL THEN COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)
                    ELSE (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) * pi.porcentaje / 100::numeric
                END AS total_gasto_ingreso_inversor,
            ai.tipo_asiento
           FROM tesoreria_registro tr
             LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
             LEFT JOIN tesoreria_registro_documento trd ON tr.id = trd.registro_id
             LEFT JOIN iva_documento iva_doc ON trd.documento_id = iva_doc.id
             LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
             LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
             LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
             LEFT JOIN tesoreria_presupuesto tp ON tr.presupuesto_id = tp.id
             LEFT JOIN iva_clienteproyecto tp_cp ON tp.cliente_proyecto_id = tp_cp.id
             LEFT JOIN iva_persona tp_prov ON tp.proveedor_id = tp_prov.id
             LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
             LEFT JOIN inversiones_asientoinversor ai ON tr.id = ai.registro_id
             LEFT JOIN inversiones_inversor ai_i ON ai.inversor_id = ai_i.id
             LEFT JOIN inversiones_porcentajeinversion pi ON tr.cliente_proyecto_id = pi.proyecto_id AND (ai.id IS NULL OR pi.inversor_id = ai.inversor_id)
             LEFT JOIN inversiones_inversor i ON pi.inversor_id = i.id
          WHERE tr.activo = true AND (tr.tipo_reg::text <> ALL (ARRAY['OP'::character varying::text, 'MC'::character varying::text, 'RETH'::character varying::text, 'PERCS'::character varying::text])) AND iva_cp.unidad_de_negocio_id = 7 AND (tr.cliente_proyecto_id IN ( SELECT inversiones_porcentajeinversion.proyecto_id
                   FROM inversiones_porcentajeinversion)) AND tr.fecha_reg <= CURRENT_DATE
          GROUP BY tr.id, tr.tipo_reg, tcaja.caja, tr.fecha_reg, tr."añomes_imputacion", iva_cp.cliente_proyecto, iva_p.nombre_fantasia, iva_p.razon_social, iva_imp.imputacion, tp_cp.cliente_proyecto, tp_prov.nombre_fantasia, tp_prov.razon_social, tp.observacion, tr.observacion, tr.monto_gasto_ingreso_neto, tr.iva_gasto_ingreso, tr.monto_op_rec, tr.moneda_id, tr.tipo_de_cambio, tr.realizado, ai_i.nombre, i.nombre, pi.porcentaje, mep.compra, ai.id
        )
 SELECT id AS "ID",
    cliente_proyecto AS "Filtro proyecto",
    inversor AS "Filtro inversor",
    fecha_reg AS "Fecha",
    tercero AS "Tercero",
    imputacion AS "Imputación",
    descripcion AS "Descripción",
    presupuesto AS "Presupuesto",
    total_gasto_ingreso AS "TOTAL Devengado (AR$)",
    total_gasto_ingreso_dolar AS "TOTAL Devengado (US$)",
        CASE
            WHEN tipo_asiento IS NOT NULL THEN NULL::numeric
            ELSE total_gasto_ingreso_inversor
        END AS "Devengado 25% x socio (AR$/Cab.)",
        CASE
            WHEN tipo_asiento IS NOT NULL THEN total_gasto_ingreso
            ELSE NULL::numeric
        END AS "Pagado ARS",
        CASE
            WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100::numeric
            ELSE total_gasto_ingreso_dolar
        END AS "Mov. US$",
    sum(
        CASE
            WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100::numeric
            ELSE total_gasto_ingreso_dolar
        END) OVER (PARTITION BY inversor, cliente_proyecto ORDER BY fecha_reg, id ROWS UNBOUNDED PRECEDING) AS "Saldo US$"
   FROM cuenta_corriente
  ORDER BY fecha_reg, id;

































WITH gastos_semanales AS (
    -- Extraer gastos semanales históricos (solo gastos, no aportes)
    SELECT 
        "Filtro inversor" AS inversor,
        "Filtro proyecto" AS proyecto,
        DATE_TRUNC('week', "Fecha") AS semana,
        SUM(CASE 
            WHEN "Pagado ARS" IS NULL -- Solo gastos reales, no aportes
            THEN ABS("Mov. US$") 
            ELSE 0 
        END) AS gastos_semana_usd
    FROM cuenta_corriente_inversores_v2
    WHERE "Fecha" >= CURRENT_DATE - INTERVAL '12 months' -- Últimos 12 meses
    AND "Mov. US$" < 0 -- Solo gastos (negativos)
    AND "Filtro inversor" IS NOT NULL -- Asegurarse de que el inversor esté definido
    AND "Filtro proyecto" IS NOT NULL -- Asegurarse de que el proyecto esté definido
    AND "Filtro inversor" != 'Juan Trivelloni'
    GROUP BY "Filtro inversor", "Filtro proyecto", DATE_TRUNC('week', "Fecha")
    HAVING SUM(CASE 
        WHEN "Pagado ARS" IS NULL 
        THEN ABS("Mov. US$") 
        ELSE 0 
    END) > 0 -- Solo semanas con gastos reales
),
estadisticas_por_inversor AS (
    -- Calcular estadísticas por inversor y proyecto
    SELECT 
        inversor,
        proyecto,
        COUNT(*) AS semanas_con_gastos,
        AVG(gastos_semana_usd) AS promedio_semanal,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gastos_semana_usd) AS mediana_semanal,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gastos_semana_usd) AS percentil_75_semanal,
        STDDEV(gastos_semana_usd) AS desviacion_std,
        MIN(gastos_semana_usd) AS minimo_semanal,
        MAX(gastos_semana_usd) AS maximo_semanal
    FROM gastos_semanales
    GROUP BY inversor, proyecto
    HAVING COUNT(*) >= 2 -- Al menos 2 semanas de datos
),
saldo_actual AS (
    -- Obtener el saldo actual de cada inversor por proyecto
    SELECT DISTINCT
        "Filtro inversor" AS inversor,
        "Filtro proyecto" AS proyecto,
        LAST_VALUE("Saldo US$") OVER (
            PARTITION BY "Filtro inversor", "Filtro proyecto" 
            ORDER BY "Fecha", "ID" 
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS saldo_actual_usd
    FROM cuenta_corriente_inversores_v2
)
SELECT 
    e.inversor AS "Inversor",
    e.proyecto AS "Proyecto",
    e.semanas_con_gastos AS "Semanas con Datos",
    CAST(ROUND(e.promedio_semanal::numeric, 2) AS numeric) AS "Promedio Semanal (USD)",
    CAST(ROUND(e.mediana_semanal::numeric, 2) AS numeric) AS "Mediana Semanal (USD)",
    CAST(ROUND(e.percentil_75_semanal::numeric, 2) AS numeric) AS "Percentil 75 Semanal (USD)",
    CAST(ROUND(COALESCE(e.desviacion_std, 0)::numeric, 2) AS numeric) AS "Desviación Estándar (USD)",
    CAST(ROUND(e.minimo_semanal::numeric, 2) AS numeric) AS "Mínimo Semanal (USD)",
    CAST(ROUND(e.maximo_semanal::numeric, 2) AS numeric) AS "Máximo Semanal (USD)",
    
    -- Estimación conservadora: usar el mayor entre percentil 75 y promedio + 1 desv std
    CAST(ROUND(
        GREATEST(
            e.percentil_75_semanal,
            e.promedio_semanal + COALESCE(e.desviacion_std, 0)
        )::numeric, 2
    ) AS numeric) AS "Adelanto Sugerido/Semana (USD)",
    
    -- Estimación para 2 semanas (más práctica)
    CAST(ROUND(
        GREATEST(
            e.percentil_75_semanal,
            e.promedio_semanal + COALESCE(e.desviacion_std, 0)
        )::numeric * 2, 2
    ) AS numeric) AS "Adelanto Sugerido/2 Semanas (USD)",
    
    CAST(ROUND(COALESCE(s.saldo_actual_usd, 0)::numeric, 2) AS numeric) AS "Saldo Actual (USD)",
    
    -- Indicador si necesita adelanto
    CASE 
        WHEN COALESCE(s.saldo_actual_usd, 0) < 
             GREATEST(e.percentil_75_semanal, e.promedio_semanal + COALESCE(e.desviacion_std, 0))
        THEN 'SÍ - NECESITA ADELANTO'
        ELSE 'NO - SALDO SUFICIENTE'
    END AS "Necesita Adelanto",
    
    -- Confiabilidad de la estimación
    CASE 
        WHEN e.semanas_con_gastos >= 8 THEN 'ALTA'
        WHEN e.semanas_con_gastos >= 4 THEN 'MEDIA'
        ELSE 'BAJA'
    END AS "Confiabilidad Estimación"

FROM estadisticas_por_inversor e
LEFT JOIN saldo_actual s ON e.inversor = s.inversor AND e.proyecto = s.proyecto
ORDER BY e.inversor, e.proyecto;
























































































-- Copio definicion desde postgres a modo backup antes de agregar campos imputacion y presupuesto
 WITH cuenta_corriente AS (
         SELECT tr.id,
            tr.tipo_reg,
            tcaja.caja,
            tr.fecha_reg,
            tr."añomes_imputacion",
            iva_cp.cliente_proyecto,
                CASE
                    WHEN ai.id IS NOT NULL THEN ai_i.nombre
                    ELSE COALESCE(iva_p.nombre_fantasia, iva_p.razon_social, ''::character varying)
                END AS tercero,
            iva_imp.imputacion,
            tr.observacion AS descripcion,
            tr.monto_gasto_ingreso_neto,
            tr.iva_gasto_ingreso,
            COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric) AS total_gasto_ingreso,
            tr.monto_op_rec,
            COALESCE(ai_i.nombre, i.nombre) AS inversor,
            mep.compra AS tipo_de_cambio_mep,
                CASE
                    WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio <> 1::numeric THEN
                    CASE
                        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) IS NOT NULL THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / tr.tipo_de_cambio
                        ELSE NULL::numeric
                    END
                    WHEN mep.compra IS NOT NULL THEN
                    CASE
                        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) IS NOT NULL THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / mep.compra
                        ELSE NULL::numeric
                    END
                    ELSE NULL::numeric
                END AS total_gasto_ingreso_dolar,
            COALESCE(pi.porcentaje, 100::numeric) AS porcentaje,
                CASE
                    WHEN ai.id IS NOT NULL THEN COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)
                    ELSE (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) * pi.porcentaje / 100::numeric
                END AS total_gasto_ingreso_inversor,
            ai.tipo_asiento
           FROM tesoreria_registro tr
             LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
             LEFT JOIN tesoreria_registro_documento trd ON tr.id = trd.registro_id
             LEFT JOIN iva_documento iva_doc ON trd.documento_id = iva_doc.id
             LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
             LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
             LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
             LEFT JOIN tesoreria_presupuesto tp ON tr.presupuesto_id = tp.id
             LEFT JOIN iva_clienteproyecto tp_cp ON tp.cliente_proyecto_id = tp_cp.id
             LEFT JOIN iva_persona tp_prov ON tp.proveedor_id = tp_prov.id
             LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
             LEFT JOIN inversiones_asientoinversor ai ON tr.id = ai.registro_id
             LEFT JOIN inversiones_inversor ai_i ON ai.inversor_id = ai_i.id
             LEFT JOIN inversiones_porcentajeinversion pi ON tr.cliente_proyecto_id = pi.proyecto_id AND (ai.id IS NULL OR pi.inversor_id = ai.inversor_id)
             LEFT JOIN inversiones_inversor i ON pi.inversor_id = i.id
          WHERE tr.activo = true AND (tr.tipo_reg::text <> ALL (ARRAY['OP'::character varying, 'MC'::character varying, 'RETH'::character varying, 'PERCS'::character varying]::text[])) AND iva_cp.unidad_de_negocio_id = 7
          GROUP BY tr.id, tr.tipo_reg, tcaja.caja, tr.fecha_reg, tr."añomes_imputacion", iva_cp.cliente_proyecto, iva_p.nombre_fantasia, iva_p.razon_social, iva_imp.imputacion, tp_cp.cliente_proyecto, tp_prov.nombre_fantasia, tp_prov.razon_social, tp.observacion, tr.observacion, tr.monto_gasto_ingreso_neto, tr.iva_gasto_ingreso, tr.monto_op_rec, tr.moneda_id, tr.tipo_de_cambio, tr.realizado, ai_i.nombre, i.nombre, pi.porcentaje, mep.compra, ai.id
        )
 SELECT id AS "ID",
    cliente_proyecto AS "Filtro proyecto",
    inversor AS "Filtro inversor",
    fecha_reg AS "Fecha",
    tercero AS "Tercero",
    descripcion AS "Descripción",
    total_gasto_ingreso AS "TOTAL Devengado (AR$)",
    total_gasto_ingreso_dolar AS "TOTAL Devengado (US$)",
        CASE
            WHEN tipo_asiento IS NOT NULL THEN NULL::numeric
            ELSE total_gasto_ingreso_inversor
        END AS "Devengado 25% x socio (AR$/Cab.)",
        CASE
            WHEN tipo_asiento IS NOT NULL THEN total_gasto_ingreso
            ELSE NULL::numeric
        END AS "Pagado ARS",
        CASE
            WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100::numeric
            ELSE total_gasto_ingreso_dolar
        END AS "Mov. US$",
    sum(
        CASE
            WHEN tipo_asiento IS NULL THEN total_gasto_ingreso_dolar * porcentaje / 100::numeric
            ELSE total_gasto_ingreso_dolar
        END) OVER (PARTITION BY inversor, cliente_proyecto ORDER BY fecha_reg, id ROWS UNBOUNDED PRECEDING) AS "Saldo US$"
   FROM cuenta_corriente
  ORDER BY fecha_reg, id;