-- Datos estructurados para gráficos y visualizaciones
-- Ejecutar estas consultas por separado para obtener diferentes datasets

-- === DATASET 1: TENDENCIA SEMANAL PARA GRÁFICO DE LÍNEAS ===
SELECT
    'TENDENCIA_SEMANAL' AS dataset,
    TO_CHAR(date_trunc('week', fecha_reg)::date, 'YYYY-MM-DD') AS fecha,
    ROUND(SUM(ABS(total_gasto_ingreso))::numeric, 2) AS valor,
    COUNT(*) AS cantidad_transacciones,
    COUNT(DISTINCT CASE 
        WHEN imputacion ILIKE any(array['%juan%', '%carlos%', '%miguel%', '%antonio%', '%jose%']) 
        THEN imputacion 
    END) AS contratistas_estimados
FROM db_total_4
WHERE unidad_de_negocio = 'Inversiones'
AND fecha_reg >= CURRENT_DATE - INTERVAL '12 weeks'
AND fecha_reg <= CURRENT_DATE
AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
AND caja = 'Caja Fede'
GROUP BY date_trunc('week', fecha_reg)::date
ORDER BY fecha;

-- === DATASET 2: DISTRIBUCIÓN POR DÍA DE LA SEMANA ===
SELECT
    'DISTRIBUCION_DIAS' AS dataset,
    CASE 
        WHEN EXTRACT(dow FROM fecha_reg) = 0 THEN 'Domingo'
        WHEN EXTRACT(dow FROM fecha_reg) = 1 THEN 'Lunes'
        WHEN EXTRACT(dow FROM fecha_reg) = 2 THEN 'Martes'
        WHEN EXTRACT(dow FROM fecha_reg) = 3 THEN 'Miércoles'
        WHEN EXTRACT(dow FROM fecha_reg) = 4 THEN 'Jueves'
        WHEN EXTRACT(dow FROM fecha_reg) = 5 THEN 'Viernes'
        WHEN EXTRACT(dow FROM fecha_reg) = 6 THEN 'Sábado'
    END AS categoria,
    ROUND(SUM(ABS(total_gasto_ingreso))::numeric, 2) AS valor,
    COUNT(*) AS cantidad,
    EXTRACT(dow FROM fecha_reg) AS orden_dia
FROM db_total_4
WHERE unidad_de_negocio = 'Inversiones'
AND fecha_reg >= CURRENT_DATE - INTERVAL '8 weeks'
AND fecha_reg <= CURRENT_DATE
AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
AND caja = 'Caja Fede'
GROUP BY EXTRACT(dow FROM fecha_reg)
ORDER BY orden_dia;

-- === DATASET 3: TOP CONTRATISTAS (PARA GRÁFICO DE BARRAS) ===
WITH contratistas_extraidos AS (
    SELECT
        ABS(total_gasto_ingreso) AS gasto_absoluto,
        CASE
            WHEN imputacion ILIKE '%juan%' THEN 'Juan'
            WHEN imputacion ILIKE '%carlos%' THEN 'Carlos'  
            WHEN imputacion ILIKE '%miguel%' THEN 'Miguel'
            WHEN imputacion ILIKE '%antonio%' THEN 'Antonio'
            WHEN imputacion ILIKE '%jose%' THEN 'José'
            WHEN imputacion ILIKE '%martin%' THEN 'Martín'
            WHEN imputacion ILIKE '%pablo%' THEN 'Pablo'
            WHEN imputacion ILIKE '%luis%' THEN 'Luis'
            ELSE 'Otros'
        END AS contratista
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '8 weeks'
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
)
SELECT
    'TOP_CONTRATISTAS' AS dataset,
    contratista AS categoria,
    ROUND(SUM(ABS(total_gasto_ingreso))::numeric, 2) AS valor,
    COUNT(*) AS cantidad,
    ROUND(AVG(gasto_absoluto)::numeric, 2) AS promedio_por_trabajo
FROM contratistas_extraidos
WHERE contratista != 'Otros'
GROUP BY contratista
HAVING SUM(gasto_absoluto) > 0
ORDER BY valor DESC
LIMIT 10;

-- === DATASET 4: PREDICCIÓN VS HISTÓRICO (PARA COMPARACIÓN) ===
WITH historico AS (
    SELECT
        date_trunc('week', fecha_reg)::date AS semana,
        SUM(ABS(total_gasto_ingreso)) AS gasto_real
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '8 weeks'
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
    GROUP BY date_trunc('week', fecha_reg)::date
),
prediccion AS (
    SELECT
        (MAX(semana) + INTERVAL '1 week')::date AS semana_prediccion,
        ROUND(AVG(gasto_real)::numeric, 2) AS prediccion_simple,
        ROUND((AVG(gasto_real) - STDDEV(gasto_real))::numeric, 2) AS limite_inferior,
        ROUND((AVG(gasto_real) + STDDEV(gasto_real))::numeric, 2) AS limite_superior
    FROM historico
    WHERE semana >= (SELECT MAX(semana) - INTERVAL '3 weeks' FROM historico)
)
SELECT 
    'PREDICCION_VS_HISTORICO' AS dataset,
    TO_CHAR(h.semana, 'YYYY-MM-DD') AS fecha,
    ROUND(h.gasto_real::numeric, 2) AS valor_real,
    NULL::numeric AS valor_prediccion,
    NULL::numeric AS limite_inf,
    NULL::numeric AS limite_sup,
    'histórico' AS tipo
FROM historico h

UNION ALL

SELECT
    'PREDICCION_VS_HISTORICO' AS dataset,
    TO_CHAR(p.semana_prediccion, 'YYYY-MM-DD') AS fecha,
    NULL AS valor_real,
    p.prediccion_simple AS valor_prediccion,
    p.limite_inferior AS limite_inf,
    p.limite_superior AS limite_sup,
    'predicción' AS tipo
FROM prediccion p

ORDER BY fecha;

-- === DATASET 5: VARIABILIDAD Y RIESGO ===
WITH estadisticas_semanales AS (
    SELECT
        date_trunc('week', fecha_reg)::date AS semana,
        SUM(ABS(total_gasto_ingreso)) AS gasto_semanal,
        COUNT(*) AS transacciones,
        STDDEV(ABS(total_gasto_ingreso)) AS variabilidad_interna
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '8 weeks'
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
    GROUP BY date_trunc('week', fecha_reg)::date
)
SELECT
    'ANALISIS_VARIABILIDAD' AS dataset,
    TO_CHAR(semana, 'YYYY-MM-DD') AS fecha,
    ROUND(gasto_semanal::numeric, 2) AS gasto,
    transacciones,
    ROUND(variabilidad_interna::numeric, 2) AS variabilidad,
    ROUND((gasto_semanal / AVG(gasto_semanal) OVER () * 100)::numeric, 2) AS porcentaje_vs_promedio,
    CASE
        WHEN gasto_semanal > AVG(gasto_semanal) OVER () + STDDEV(gasto_semanal) OVER () THEN 'Alto'
        WHEN gasto_semanal < AVG(gasto_semanal) OVER () - STDDEV(gasto_semanal) OVER () THEN 'Bajo'
        ELSE 'Normal'
    END AS categoria_gasto
FROM estadisticas_semanales
ORDER BY semana;