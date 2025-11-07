WITH semana AS (
    SELECT
        date_trunc('week', fecha_reg)::date AS semana,
        SUM(total_gasto_ingreso) AS gasto_semanal
    FROM db_total_4
    WHERE unidad_de_negocio = 'Inversiones'
    AND fecha_reg <= '2025-02-09'::date
    AND (tipo_reg = 'PSF' OR tipo_reg = 'FC')
    AND (imputacion != 'Lotes para inversion')
    AND imputacion != 'Otros gastos personales Juan'
    AND imputacion != 'Comisiones'
    AND imputacion != 'ACOPIO'
    AND imputacion != 'Gesotría'
    AND imputacion != 'Gasto escribanía'
    GROUP BY 1
),
ranked AS (
    SELECT
        semana,
        gasto_semanal,
        ROW_NUMBER() OVER (ORDER BY semana DESC) AS rn
    FROM semana
)
SELECT
    ROUND(AVG(gasto_semanal)::numeric, 2) AS gasto_estimado_proxima_semana
FROM ranked
WHERE rn <= 4;