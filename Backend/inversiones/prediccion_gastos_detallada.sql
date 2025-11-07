-- Predicción detallada de gastos con análisis por contratista y categoría
WITH datos_base AS (
    SELECT
        fecha_reg,
        date_trunc('week', fecha_reg)::date AS semana,
        EXTRACT(dow FROM fecha_reg) AS dia_semana, -- 0=domingo, 4=jueves
        ABS(total_gasto_ingreso) AS gasto_absoluto,
        imputacion,
        observacion,
        'Mano de Obra' AS categoria,
        -- Extraer posible nombre de contratista de imputacion u observaciones
        COALESCE(
            NULLIF(TRIM(SPLIT_PART(imputacion, '-', 1)), ''),
            NULLIF(TRIM(SPLIT_PART(observacion, '-', 1)), ''),
            'Sin especificar'
        ) AS contratista_estimado
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '8 weeks' -- Ampliamos el rango para mejor análisis
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
),

-- Análisis de patrones por día de la semana (especialmente jueves)
patrones_dias AS (
    SELECT
        dia_semana,
        COUNT(*) AS cantidad_pagos,
        ROUND(AVG(gasto_absoluto)::numeric, 2) AS promedio_por_pago,
        ROUND(SUM(gasto_absoluto)::numeric, 2) AS total_por_dia,
        ARRAY_AGG(DISTINCT contratista_estimado) AS contratistas_activos
    FROM datos_base
    WHERE dia_semana = 4 -- Jueves
    GROUP BY dia_semana
),

-- Análisis por semana con desglose
analisis_semanal AS (
    SELECT
        semana,
        ROUND(SUM(gasto_absoluto)::numeric, 2) AS gasto_total_semana,
        COUNT(*) AS cantidad_transacciones,
        COUNT(DISTINCT contratista_estimado) AS contratistas_unicos,
        -- Todo es mano de obra desde Caja Fede
        ROUND(SUM(gasto_absoluto)::numeric, 2) AS mano_obra,
        -- Lista de contratistas únicos por semana
        ARRAY_AGG(DISTINCT contratista_estimado) AS contratistas_semana,
        ROW_NUMBER() OVER (ORDER BY semana DESC) AS rn
    FROM datos_base
    GROUP BY semana
),

-- Top contratistas recurrentes
contratistas_recurrentes AS (
    SELECT
        contratista_estimado,
        COUNT(DISTINCT semana) AS semanas_activo,
        COUNT(*) AS total_pagos,
        ROUND(AVG(gasto_absoluto)::numeric, 2) AS promedio_por_pago,
        ROUND(SUM(gasto_absoluto)::numeric, 2) AS total_historico,
        -- Variabilidad del contratista
        ROUND(STDDEV(gasto_absoluto)::numeric, 2) AS desviacion_estandar
    FROM datos_base
    WHERE contratista_estimado != 'Sin especificar'
    GROUP BY contratista_estimado
    HAVING COUNT(DISTINCT semana) >= 2 -- Solo contratistas con al menos 2 semanas de actividad
    ORDER BY semanas_activo DESC, total_historico DESC
    LIMIT 10
),

-- Cálculo de tendencias y estacionalidad
tendencias AS (
    SELECT
        semana,
        gasto_total_semana,
        -- Promedio móvil de 3 semanas
        ROUND(AVG(gasto_total_semana) OVER (ORDER BY semana ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)::numeric, 2) AS promedio_movil_3sem,
        -- Variación semanal
        LAG(gasto_total_semana, 1) OVER (ORDER BY semana) AS semana_anterior,
        CASE 
            WHEN LAG(gasto_total_semana, 1) OVER (ORDER BY semana) IS NOT NULL 
            THEN ROUND(((gasto_total_semana - LAG(gasto_total_semana, 1) OVER (ORDER BY semana)) / LAG(gasto_total_semana, 1) OVER (ORDER BY semana) * 100)::numeric, 2)
            ELSE 0
        END AS variacion_porcentual
    FROM analisis_semanal
    WHERE rn <= 8 -- Últimas 8 semanas para tendencia
)

-- Resultado final con predicción detallada
SELECT
    '=== PREDICCIÓN DETALLADA DE GASTOS ===' AS seccion,
    NULL::numeric AS valor,
    NULL::text AS detalle

UNION ALL

SELECT
    'Predicción Próxima Semana' AS seccion,
    ROUND(AVG(gasto_total_semana)::numeric, 2) AS valor,
    'Promedio de últimas 4 semanas' AS detalle
FROM analisis_semanal
WHERE rn <= 4

UNION ALL

SELECT
    'Rango Estimado (Min-Max)' AS seccion,
    ROUND((AVG(gasto_total_semana) - STDDEV(gasto_total_semana))::numeric, 2) AS valor,
    'Mínimo estimado: Promedio - 1 desviación estándar' AS detalle
FROM analisis_semanal
WHERE rn <= 4

UNION ALL

SELECT
    'Rango Estimado (Max)' AS seccion,
    ROUND((AVG(gasto_total_semana) + STDDEV(gasto_total_semana))::numeric, 2) AS valor,
    'Máximo estimado: Promedio + 1 desviación estándar' AS detalle
FROM analisis_semanal
WHERE rn <= 4

UNION ALL

SELECT
    '--- ANÁLISIS POR COMPONENTES ---' AS seccion,
    NULL::numeric AS valor,
    NULL::text AS detalle

UNION ALL

SELECT
    'Mano de Obra (Promedio)' AS seccion,
    ROUND(AVG(mano_obra)::numeric, 2) AS valor,
    'Estimación basada en últimas 4 semanas' AS detalle
FROM analisis_semanal
WHERE rn <= 4

UNION ALL


SELECT
    'Contratistas Esperados' AS seccion,
    ROUND(AVG(contratistas_unicos)::numeric, 0) AS valor,
    'Número promedio de contratistas por semana' AS detalle
FROM analisis_semanal
WHERE rn <= 4

UNION ALL

SELECT
    '--- TENDENCIAS Y VARIABILIDAD ---' AS seccion,
    NULL::numeric AS valor,
    NULL::text AS detalle

UNION ALL

SELECT
    'Tendencia Últimas 4 Semanas' AS seccion,
    ROUND(AVG(variacion_porcentual)::numeric, 2) AS valor,
    'Variación porcentual promedio semanal' AS detalle
FROM tendencias
WHERE semana >= (SELECT MAX(semana) - INTERVAL '3 weeks' FROM tendencias)

UNION ALL

SELECT
    'Variabilidad (Desv. Est.)' AS seccion,
    ROUND(STDDEV(gasto_total_semana)::numeric, 2) AS valor,
    'Desviación estándar de gastos semanales' AS detalle
FROM analisis_semanal
WHERE rn <= 4

ORDER BY seccion;