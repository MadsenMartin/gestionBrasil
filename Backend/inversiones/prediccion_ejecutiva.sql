-- Predicción ejecutiva consolidada con explicación detallada
WITH base_datos AS (
    SELECT
        fecha_reg,
        date_trunc('week', fecha_reg)::date AS semana,
        ABS(total_gasto_ingreso) AS gasto_absoluto,
        imputacion,
        EXTRACT(dow FROM fecha_reg) AS dia_semana
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg >= CURRENT_DATE - INTERVAL '12 weeks'
    AND fecha_reg <= CURRENT_DATE
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND imputacion NOT IN ('Lotes para inversion', 'Otros gastos personales Juan', 'Comisiones', 'ACOPIO', 'Gesotría', 'Gasto escribanía')
    AND caja = 'Caja Fede'
),

-- Análisis de las últimas 4 semanas (base para predicción)
ultimas_4_semanas AS (
    SELECT
        semana,
        COUNT(*) AS transacciones,
        COUNT(*) FILTER (WHERE dia_semana = 4) AS transacciones_jueves,
        ROUND(SUM(gasto_absoluto)::numeric, 2) AS total_semana,
        ROUND(SUM(gasto_absoluto) FILTER (WHERE dia_semana = 4)::numeric, 2) AS total_jueves,
        ROUND(AVG(gasto_absoluto)::numeric, 2) AS promedio_por_transaccion
    FROM base_datos
    WHERE semana >= (SELECT MAX(date_trunc('week', fecha_reg)::date) - INTERVAL '3 weeks' FROM base_datos)
    GROUP BY semana
    ORDER BY semana DESC
),

-- Cálculos de predicción
calculos_prediccion AS (
    SELECT
        -- Predicción principal (promedio simple)
        ROUND(AVG(total_semana)::numeric, 2) AS prediccion_promedio,
        
        -- Predicción ajustada por tendencia
        ROUND((
            AVG(total_semana) + 
            (AVG(total_semana) * 0.1 * (
                SELECT 
                    CASE 
                        WHEN COUNT(*) >= 2 THEN
                            (MAX(total_semana) - MIN(total_semana)) / (MAX(total_semana) + MIN(total_semana)) * 2
                        ELSE 0 
                    END
                FROM ultimas_4_semanas
            ))
        )::numeric, 2) AS prediccion_con_tendencia,
        
        -- Rango de confianza
        ROUND((AVG(total_semana) - STDDEV(total_semana))::numeric, 2) AS limite_inferior,
        ROUND((AVG(total_semana) + STDDEV(total_semana))::numeric, 2) AS limite_superior,
        
        -- Componentes del análisis
        ROUND(AVG(total_jueves)::numeric, 2) AS promedio_jueves,
        ROUND(AVG(total_semana - total_jueves)::numeric, 2) AS promedio_otros_dias,
        ROUND(AVG(transacciones)::numeric, 1) AS promedio_transacciones,
        ROUND(AVG(transacciones_jueves)::numeric, 1) AS promedio_transacciones_jueves,
        
        -- Métricas de variabilidad
        ROUND(STDDEV(total_semana)::numeric, 2) AS desviacion_semanal,
        ROUND((STDDEV(total_semana) / AVG(total_semana) * 100)::numeric, 2) AS coeficiente_variacion
    FROM ultimas_4_semanas
),

-- Análisis de confiabilidad
confiabilidad AS (
    SELECT
        CASE
            WHEN cp.coeficiente_variacion <= 15 THEN 'ALTA'
            WHEN cp.coeficiente_variacion <= 30 THEN 'MEDIA'
            ELSE 'BAJA'
        END AS nivel_confianza,
        
        CASE
            WHEN cp.coeficiente_variacion <= 15 THEN 'Gastos muy consistentes, predicción confiable'
            WHEN cp.coeficiente_variacion <= 30 THEN 'Gastos moderadamente variables, predicción razonable'
            ELSE 'Gastos muy variables, predicción con alta incertidumbre'
        END AS explicacion_confianza
    FROM calculos_prediccion cp
)

-- Resultado ejecutivo final
SELECT 
    'PREDICCIÓN PRÓXIMA SEMANA' AS concepto,
    cp.prediccion_promedio AS valor_principal,
    CONCAT('$', cp.limite_inferior, ' - $', cp.limite_superior) AS rango_estimado,
    CONCAT('Confianza: ', c.nivel_confianza, ' (±', cp.coeficiente_variacion, '%)') AS nivel_certeza

FROM calculos_prediccion cp
CROSS JOIN confiabilidad c

UNION ALL

SELECT
    'DESGLOSE DE LA PREDICCIÓN' AS concepto,
    NULL AS valor_principal,
    NULL AS rango_estimado,
    '--- Componentes principales ---' AS nivel_certeza

UNION ALL

SELECT
    '• Gastos de Jueves (estimado)' AS concepto,
    cp.promedio_jueves AS valor_principal,
    CONCAT(ROUND((cp.promedio_jueves/cp.prediccion_promedio*100)::numeric,1), '% del total') AS rango_estimado,
    CONCAT('~', cp.promedio_transacciones_jueves, ' transacciones esperadas') AS nivel_certeza
FROM calculos_prediccion cp

UNION ALL

SELECT
    '• Gastos Otros Días (estimado)' AS concepto,
    cp.promedio_otros_dias AS valor_principal,
    CONCAT(ROUND((cp.promedio_otros_dias/cp.prediccion_promedio*100)::numeric,1), '% del total') AS rango_estimado,
    CONCAT('~', ROUND(cp.promedio_transacciones - cp.promedio_transacciones_jueves, 1), ' transacciones esperadas') AS nivel_certeza
FROM calculos_prediccion cp

UNION ALL

SELECT
    'HISTÓRICO DE REFERENCIA' AS concepto,
    NULL AS valor_principal,
    NULL AS rango_estimado,
    '--- Últimas 4 semanas ---' AS nivel_certeza

UNION ALL

SELECT
    CONCAT('Semana del ', TO_CHAR(semana, 'DD/MM')) AS concepto,
    total_semana AS valor_principal,
    CONCAT('$', total_jueves, ' en jueves') AS rango_estimado,
    CONCAT(transacciones, ' transacciones total') AS nivel_certeza
FROM ultimas_4_semanas

UNION ALL

SELECT
    'FACTORES DE RIESGO' AS concepto,
    NULL AS valor_principal,
    NULL AS rango_estimado,
    '--- Consideraciones importantes ---' AS nivel_certeza

UNION ALL

SELECT
    CASE 
        WHEN cp.coeficiente_variacion > 30 THEN '⚠ Alta variabilidad en gastos'
        WHEN cp.coeficiente_variacion > 15 THEN '⚡ Variabilidad moderada'
        ELSE '✓ Gastos estables'
    END AS concepto,
    cp.coeficiente_variacion AS valor_principal,
    'Coeficiente de variación' AS rango_estimado,
    c.explicacion_confianza AS nivel_certeza
FROM calculos_prediccion cp
CROSS JOIN confiabilidad c

UNION ALL

SELECT
    'Concentración en Jueves' AS concepto,
    ROUND((AVG(transacciones_jueves::decimal / transacciones) * 100)::numeric, 1) AS valor_principal,
    '% de transacciones' AS rango_estimado,
    'Patrón típico de pagos de mano de obra' AS nivel_certeza
FROM ultimas_4_semanas

ORDER BY 
    CASE 
        WHEN concepto = 'PREDICCIÓN PRÓXIMA SEMANA' THEN 1
        WHEN concepto = 'DESGLOSE DE LA PREDICCIÓN' THEN 2
        WHEN concepto LIKE '•%' THEN 3
        WHEN concepto = 'HISTÓRICO DE REFERENCIA' THEN 4
        WHEN concepto LIKE 'Semana del%' THEN 5
        WHEN concepto = 'FACTORES DE RIESGO' THEN 6
        ELSE 7
    END,
    concepto;