-- Análisis detallado de patrones de contratistas para predicción
WITH datos_contratistas AS (
    SELECT
        fecha_reg,
        date_trunc('week', fecha_reg)::date AS semana,
        EXTRACT(dow FROM fecha_reg) AS dia_semana,
        ABS(total_gasto_ingreso) AS gasto_absoluto,
        imputacion,
        observacion,
        -- Intento mejorado de extracción de nombres de contratistas
        CASE
            -- Patrones comunes de nomenclatura
            WHEN imputacion ILIKE '%juan%' THEN 'Juan'
            WHEN imputacion ILIKE '%carlos%' THEN 'Carlos'  
            WHEN imputacion ILIKE '%miguel%' THEN 'Miguel'
            WHEN imputacion ILIKE '%antonio%' THEN 'Antonio'
            WHEN imputacion ILIKE '%jose%' THEN 'José'
            -- Extraer primer nombre antes de espacio o guión
            WHEN imputacion ~ '^[A-Za-z]+(\s|-)' THEN 
                INITCAP(TRIM(REGEXP_REPLACE(SPLIT_PART(imputacion, ' ', 1), '[^A-Za-z]', '', 'g')))
            -- Buscar patrones en observaciones
            WHEN observaciones ILIKE '%contratista%' THEN
                COALESCE(
                    NULLIF(TRIM(REGEXP_REPLACE(SPLIT_PART(observaciones, 'contratista', 2), '[^A-Za-z\s]', '', 'g')), ''),
                    'Contratista no especificado'
                )
            ELSE 
                CASE 
                    WHEN LENGTH(TRIM(imputacion)) > 0 THEN TRIM(imputacion)
                    ELSE 'Sin especificar'
                END
        END AS contratista,
        -- Clasificación por tipo de trabajo
        CASE
            WHEN imputacion ILIKE any(array['%albañil%', '%construccion%', '%obra%', '%edificacion%']) THEN 'Albañilería'
            WHEN imputacion ILIKE any(array['%electr%', '%instalacion%']) THEN 'Electricidad'
            WHEN imputacion ILIKE any(array['%plomer%', '%plumb%', '%cañeria%']) THEN 'Plomería'
            WHEN imputacion ILIKE any(array['%pintura%', '%pintor%']) THEN 'Pintura'
            WHEN imputacion ILIKE any(array['%carpint%', '%madera%']) THEN 'Carpintería'
            WHEN imputacion ILIKE any(array['%limpieza%', '%limpi%']) THEN 'Limpieza'
            WHEN imputacion ILIKE any(array['%jardin%', '%parque%', '%verde%']) THEN 'Jardinería'
            ELSE 'Trabajo General'
        END AS tipo_trabajo
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '12 weeks'
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
),

-- Análisis de frecuencia de contratistas
frecuencia_contratistas AS (
    SELECT
        contratista,
        tipo_trabajo,
        COUNT(*) AS total_trabajos,
        COUNT(DISTINCT semana) AS semanas_activo,
        COUNT(DISTINCT dia_semana) AS dias_diferentes,
        -- Concentración en jueves
        ROUND(
            (COUNT(*) FILTER (WHERE dia_semana = 4)::decimal / COUNT(*) * 100), 2
        ) AS porcentaje_jueves,
        -- Estadísticas de pago
        ROUND(MIN(gasto_absoluto)::numeric, 2) AS pago_minimo,
        ROUND(MAX(gasto_absoluto)::numeric, 2) AS pago_maximo,
        ROUND(AVG(gasto_absoluto)::numeric, 2) AS pago_promedio,
        ROUND(STDDEV(gasto_absoluto)::numeric, 2) AS desviacion_pagos,
        -- Última actividad
        MAX(fecha_reg) AS ultima_actividad,
        MIN(fecha_reg) AS primera_actividad
    FROM datos_contratistas
    WHERE contratista != 'Sin especificar'
    GROUP BY contratista, tipo_trabajo
),

-- Patrones de regularidad
patrones_regularidad AS (
    SELECT
        contratista,
        -- Intervalos entre pagos
        ROUND(AVG(dias_entre_pagos)::numeric, 1) AS promedio_dias_entre_pagos,
        ROUND(STDDEV(dias_entre_pagos)::numeric, 1) AS variabilidad_intervalos
    FROM (
        SELECT
            contratista,
            fecha_reg - LAG(fecha_reg) OVER (PARTITION BY contratista ORDER BY fecha_reg) AS dias_entre_pagos
        FROM datos_contratistas
        WHERE contratista != 'Sin especificar'
    ) intervalos
    WHERE dias_entre_pagos IS NOT NULL
    GROUP BY contratista
    HAVING COUNT(*) >= 2
),

-- Predicción por contratista
prediccion_individual AS (
    SELECT
        f.contratista,
        f.tipo_trabajo,
        f.total_trabajos,
        f.semanas_activo,
        f.pago_promedio,
        f.porcentaje_jueves,
        p.promedio_dias_entre_pagos,
        -- Probabilidad de aparecer la próxima semana
        CASE
            WHEN f.semanas_activo >= 3 AND f.ultima_actividad >= CURRENT_DATE - INTERVAL '2 weeks' THEN 'ALTA'
            WHEN f.semanas_activo >= 2 AND f.ultima_actividad >= CURRENT_DATE - INTERVAL '4 weeks' THEN 'MEDIA'
            WHEN f.ultima_actividad >= CURRENT_DATE - INTERVAL '6 weeks' THEN 'BAJA'
            ELSE 'MUY BAJA'
        END AS probabilidad_proxima_semana,
        -- Estimación de pago esperado
        CASE
            WHEN f.ultima_actividad >= CURRENT_DATE - INTERVAL '2 weeks' THEN f.pago_promedio
            WHEN f.ultima_actividad >= CURRENT_DATE - INTERVAL '4 weeks' THEN f.pago_promedio * 0.8
            ELSE f.pago_promedio * 0.5
        END AS pago_estimado_ponderado
    FROM frecuencia_contratistas f
    LEFT JOIN patrones_regularidad p ON f.contratista = p.contratista
    WHERE f.total_trabajos >= 2 -- Solo contratistas con al menos 2 trabajos
    ORDER BY 
        CASE 
            WHEN f.ultima_actividad >= CURRENT_DATE - INTERVAL '2 weeks' THEN 1
            WHEN f.ultima_actividad >= CURRENT_DATE - INTERVAL '4 weeks' THEN 2
            ELSE 3
        END,
        f.pago_promedio DESC
)

-- Resultado final para contratistas
SELECT 
    '=== ANÁLISIS DE CONTRATISTAS ===' AS categoria,
    NULL::text AS contratista,
    NULL::numeric AS valor,
    NULL::text AS detalle

UNION ALL

SELECT
    'CONTRATISTAS ACTIVOS' AS categoria,
    contratista,
    pago_estimado_ponderado AS valor,
    CONCAT(
        'Prob: ', probabilidad_proxima_semana, 
        ' | Prom: $', pago_promedio,
        ' | Jueves: ', porcentaje_jueves, '%',
        ' | Trabajos: ', total_trabajos
    ) AS detalle
FROM prediccion_individual
WHERE probabilidad_proxima_semana IN ('ALTA', 'MEDIA')

UNION ALL

SELECT
    'RESUMEN PREDICCIÓN' AS categoria,
    'Total Esperado' AS contratista,
    ROUND(SUM(pago_estimado_ponderado)::numeric, 2) AS valor,
    CONCAT('Basado en ', COUNT(*), ' contratistas activos') AS detalle
FROM prediccion_individual
WHERE probabilidad_proxima_semana IN ('ALTA', 'MEDIA')

UNION ALL

SELECT
    'DISTRIBUCIÓN POR TIPO' AS categoria,
    tipo_trabajo AS contratista,
    ROUND(SUM(pago_estimado_ponderado)::numeric, 2) AS valor,
    CONCAT(COUNT(*), ' contratistas activos') AS detalle
FROM prediccion_individual
WHERE probabilidad_proxima_semana IN ('ALTA', 'MEDIA')
GROUP BY tipo_trabajo

ORDER BY categoria, valor DESC NULLS LAST;