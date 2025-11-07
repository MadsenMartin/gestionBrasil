CREATE OR REPLACE VIEW iva_facturas AS
SELECT
d.id,
CASE WHEN d.proveedor_id = 538 THEN 'Venta' ELSE 'Compra' END AS "Compra/Venta",
d.fecha_documento AS "Fecha",
TO_CHAR(d.fecha_documento, 'YYYYMM') AS "Añomes",
CAST(d.añomes_imputacion_gasto AS TEXT) AS "Añomes Imputación",
td.tipo_documento AS "Tipo",
d.punto_de_venta AS "PV",
d.numero AS "Número",
CASE 
WHEN d.proveedor_id = 538 THEN r.cnpj
ELSE p.cnpj
END AS "CNPJ",
CASE 
    WHEN d.proveedor_id = 538 THEN r.razon_social
    ELSE p.razon_social
END AS "Proveedor/Cliente",
d.neto AS "Neto",
d.iva AS "IVA",
d.percepcion_de_iibb AS "Percepción de IIBB",
d.percepcion_de_iva AS "Percepción de IVA",
d.no_gravado AS "No Gravado",
d.exento AS "Exento",
d.neto + d.iva + d.percepcion_de_iibb + d.percepcion_de_iva + d.no_gravado + d.exento AS "Monto Total",
d.moneda AS "Moneda",
d.tipo_de_cambio AS "TC",
i.imputacion AS "Imputación",
d.concepto AS "Concepto",
'true' AS "Cargada",
d.comentario AS "Comentario",
CASE 
    WHEN d.receptor_id = 358 THEN d.neto
    WHEN d.proveedor_id = 538 THEN d.neto * -1
    ELSE NULL
END AS "Compra-Venta",
CASE
    WHEN d.receptor_id = 358 THEN -- Documento recibido
        CASE WHEN d.iva > 0 THEN d.iva ELSE NULL END -- IVA positivo, es FC/ND recibida -> Es CF
    WHEN d.proveedor_id = 538 THEN -- Documento emitido
        CASE WHEN d.iva < 0 THEN d.iva * -1 ELSE NULL END -- IVA negativo, es NC emitida -> Es CF
    ELSE NULL
END AS "IVA CF",
CASE 
    WHEN d.receptor_id = 358 THEN -- Documento recibido
        CASE WHEN d.iva < 0 THEN d.iva ELSE NULL END -- IVA negativo, es NC recibida -> Es DF
    WHEN d.proveedor_id = 538 THEN -- Documento emitido
        CASE WHEN d.iva > 0 THEN d.iva * -1 ELSE NULL END -- IVA positivo, es FC/ND emitida -> Es DF
    ELSE NULL
END AS "IVA DF"
FROM iva_documento d
JOIN iva_imputacion i ON d.imputacion_id = i.id
JOIN iva_tiposdocumento td ON d.tipo_documento_id = td.id
JOIN iva_persona p ON d.proveedor_id = p.id
JOIN iva_persona r ON d.receptor_id = r.id
WHERE d.activo = true
AND (d.proveedor_id = 538 OR d.receptor_id = 358)
UNION
SELECT
df.id,
'Compra' AS "Compra/Venta",
df.fecha AS "Fecha",
TO_CHAR(df.fecha, 'YYYYMM') AS "Añomes",
TO_CHAR(df.fecha, 'YYYYMM') AS "Añomes Imputación",
td.tipo_documento AS "Tipo",
df.punto_de_venta AS "PV",
df.numero AS "Número",
df.cnpj AS "CNPJ",
df.proveedor AS "Proveedor/Cliente",
df.neto AS "Neto",
df.iva AS "IVA",
0 AS "Percepción de IIBB",
0 AS "Percepción de IVA",
0 AS "No Gravado",
0 AS "Exento",
df.total AS "Monto Total",
1 AS "Moneda",
1 AS "TC",
NULL AS "Imputación",
NULL AS "Concepto",
'false' AS "Cargada",
NULL AS "Comentario",
df.neto AS "Compra-Venta",
CASE
    WHEN td.tipo_documento IN ('Nota de crédito A', 'Nota de crédito B', 'Nota de crédito C') THEN NULL
    ELSE df.iva -- IVA positivo, es FC/ND recibida -> Es CF
END AS "IVA CF",
CASE
    WHEN td.tipo_documento IN ('Nota de débito A', 'Nota de débito B', 'Nota de débito C') THEN df.iva * -1 -- IVA negativo, es NC recibida -> Es DF
    ELSE NULL
END AS "IVA DF"
FROM iva_documentofaltante df
JOIN iva_tiposdocumento td ON df.tipo_id = td.id
ORDER BY 3 DESC;


-- Proveedores duplicados por CNPJ
SELECT 
    cnpj,
    COUNT(*) as cantidad_duplicados,
    STRING_AGG(id::text, ', ' ORDER BY id) as ids_duplicados,
    STRING_AGG(COALESCE(razon_social, 'SIN RAZÓN SOCIAL'), ', ' ORDER BY id) as razones_sociales,
    STRING_AGG(COALESCE(nombre_fantasia_pila, 'SIN NOMBRE'), ', ' ORDER BY id) as nombres
FROM iva_persona 
WHERE activo = true 
AND cnpj IS NOT NULL  -- Excluir registros sin CNPJ
GROUP BY cnpj
HAVING COUNT(*) > 1
ORDER BY cantidad_duplicados DESC, cnpj;




-- Nueva vista con campo añomes_imputacion_contable
CREATE VIEW iva_facturas AS
 SELECT d.id,
        CASE
            WHEN d.proveedor_id = 538 THEN 'Venta'::text
            ELSE 'Compra'::text
        END AS "Compra/Venta",
    d.fecha_documento AS "Fecha",
    to_char(d.fecha_documento::timestamp with time zone, 'YYYYMM'::text) AS "Añomes",
    d."añomes_imputacion_gasto"::text AS "Añomes imputación",
    d.añomes_imputacion_contable::text AS "Añomes imputación contable",
    td.tipo_documento AS "Tipo",
    d.punto_de_venta AS "PV",
    d.numero AS "Número",
        CASE
            WHEN d.proveedor_id = 538 THEN r.cnpj
            ELSE p.cnpj
        END AS "CNPJ",
        CASE
            WHEN d.proveedor_id = 538 THEN r.razon_social
            ELSE p.razon_social
        END AS "Proveedor/Cliente",
    d.neto AS "Neto",
    d.iva AS "IVA",
    d.percepcion_de_iibb AS "Percepción de IIBB",
    d.percepcion_de_iva AS "Percepción de IVA",
    d.no_gravado AS "No Gravado",
    d.exento AS "Exento",
    d.neto + d.iva + d.percepcion_de_iibb + d.percepcion_de_iva + d.no_gravado + d.exento AS "Monto Total",
    d.moneda AS "Moneda",
    d.tipo_de_cambio AS "TC",
    i.imputacion AS "Imputación",
    d.concepto AS "Concepto",
    'true'::text AS "Cargada",
    d.comentario AS "Comentario",
        CASE
            WHEN d.receptor_id = 358 THEN d.neto
            WHEN d.proveedor_id = 538 THEN d.neto * '-1'::integer::numeric
            ELSE NULL::numeric
        END AS "Compra-Venta",
        CASE
            WHEN d.receptor_id = 358 THEN
            CASE
                WHEN d.iva > 0::numeric THEN d.iva
                ELSE NULL::numeric
            END
            WHEN d.proveedor_id = 538 THEN
            CASE
                WHEN d.iva < 0::numeric THEN d.iva * '-1'::integer::numeric
                ELSE NULL::numeric
            END
            ELSE NULL::numeric
        END AS "IVA CF",
        CASE
            WHEN d.receptor_id = 358 THEN
            CASE
                WHEN d.iva < 0::numeric THEN d.iva
                ELSE NULL::numeric
            END
            WHEN d.proveedor_id = 538 THEN
            CASE
                WHEN d.iva > 0::numeric THEN d.iva * '-1'::integer::numeric
                ELSE NULL::numeric
            END
            ELSE NULL::numeric
        END AS "IVA DF"
   FROM iva_documento d
     JOIN iva_imputacion i ON d.imputacion_id = i.id
     JOIN iva_tiposdocumento td ON d.tipo_documento_id = td.id
     JOIN iva_persona p ON d.proveedor_id = p.id
     JOIN iva_persona r ON d.receptor_id = r.id
  WHERE d.activo = true AND (d.proveedor_id = 538 OR d.receptor_id = 358)
UNION
 SELECT df.id,
    'Compra'::text AS "Compra/Venta",
    df.fecha AS "Fecha",
    to_char(df.fecha::timestamp with time zone, 'YYYYMM'::text) AS "Añomes",
    to_char(df.fecha::timestamp with time zone, 'YYYYMM'::text) AS "Añomes Imputación",
    to_char(df.fecha::timestamp with time zone, 'YYYYMM'::text) AS "Añomes Imputación Contable",
    td.tipo_documento AS "Tipo",
    df.punto_de_venta AS "PV",
    df.numero AS "Número",
    df.cnpj AS "CNPJ",
    df.proveedor AS "Proveedor/Cliente",
    df.neto AS "Neto",
    df.iva AS "IVA",
    0 AS "Percepción de IIBB",
    0 AS "Percepción de IVA",
    0 AS "No Gravado",
    0 AS "Exento",
    df.total AS "Monto Total",
    1 AS "Moneda",
    1 AS "TC",
    NULL::character varying AS "Imputación",
    NULL::character varying AS "Concepto",
    'false'::text AS "Cargada",
    NULL::character varying AS "Comentario",
    df.neto AS "Compra-Venta",
        CASE
            WHEN td.tipo_documento::text = ANY (ARRAY['Nota de crédito A'::character varying, 'Nota de crédito B'::character varying, 'Nota de crédito C'::character varying]::text[]) THEN NULL::numeric
            ELSE df.iva
        END AS "IVA CF",
        CASE
            WHEN td.tipo_documento::text = ANY (ARRAY['Nota de débito A'::character varying, 'Nota de débito B'::character varying, 'Nota de débito C'::character varying]::text[]) THEN df.iva * '-1'::integer::numeric
            ELSE NULL::numeric
        END AS "IVA DF"
   FROM iva_documentofaltante df
     JOIN iva_tiposdocumento td ON df.tipo_id = td.id
  ORDER BY 3 DESC;
  