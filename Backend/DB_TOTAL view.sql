CREATE OR REPLACE VIEW db_total_v2 AS
SELECT 
    tr.id AS "ID",
    tr.tipo_reg AS "Tipo Reg",
    tcaja.caja AS "Caja",
    tcert.id AS "Certificado",
    -- Subconsulta para consolidar los documentos relacionados
    (
        SELECT string_agg((iva_doc.punto_de_venta::character varying || itd.letra::character varying || iva_doc.numero:: character varying), ', '::text)
        FROM tesoreria_registro_documento trd
        LEFT JOIN iva_documento iva_doc ON trd.documento_id = iva_doc.id
        LEFT JOIN iva_tiposdocumento itd ON iva_doc.tipo_documento_id = itd.id
        WHERE trd.registro_id = tr.id
    ) AS "N° Documento",
    tr.fecha_reg AS "Fecha Reg",
    tr."añomes_imputacion" AS "Mes imputación",
    iva_und.unidad_de_negocio AS "Unidad de negocio",
    iva_cp.cliente_proyecto AS "Cliente/Proyecto",
    CASE
        WHEN tr.proveedor_id IS NOT NULL THEN
            COALESCE(iva_p.nombre_fantasia_pila, iva_p.razon_social)
        ELSE
            tcaja_contra.caja
    END AS "Contrapartida",
    iva_imp.imputacion AS "Imputación",
    CASE
        WHEN tr.presupuesto_id IS NOT NULL THEN
            COALESCE(tp_cp.cliente_proyecto, ''::character varying) || ' - ' ||
            COALESCE(tp_prov.nombre_fantasia_pila, tp_prov.razon_social, ''::character varying) || ' - ' ||
            COALESCE(tp.observacion, ''::character varying)
        ELSE NULL
    END AS "Presupuesto",
    tr.observacion AS "Observación",
    tr.monto_gasto_ingreso_neto AS "Monto Gasto/Ingreso Neto",
    tr.iva_gasto_ingreso AS "IVA Gasto/Ingreso",
    COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0) AS "Total Gasto/Ingreso",
    tr.monto_op_rec AS "Monto OP/REC",
    tr.moneda AS "Moneda",
    tr.tipo_de_cambio AS "Tipo de cambio",
    mep.compra AS "Tipo de cambio MEP",
    ROUND(CASE
        WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio <> 1 THEN 
            (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
        WHEN mep.compra IS NOT NULL THEN 
            (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
        ELSE NULL
    END, 4) AS "Total Gasto/Ingreso USD",
    tr.realizado AS "Realizado"
FROM tesoreria_registro tr
LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
LEFT JOIN tesoreria_certificadoobra tcert ON tr.certificado_id = tcert.id
LEFT JOIN iva_unidaddenegocio iva_und ON tr.unidad_de_negocio_id = iva_und.id
LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
LEFT JOIN tesoreria_caja tcaja_contra ON tr.caja_contrapartida_id = tcaja_contra.id
LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
LEFT JOIN tesoreria_presupuesto tp ON tr.presupuesto_id = tp.id
LEFT JOIN iva_clienteproyecto tp_cp ON tp.cliente_proyecto_id = tp_cp.id
LEFT JOIN iva_persona tp_prov ON tp.proveedor_id = tp_prov.id
LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
WHERE tr.activo = true
ORDER BY tr.id DESC
LIMIT 50;

  UNION
  SELECT
   a.id,
   "ISF" AS tipo_reg,
   "Asientos inversores" AS caja,
    NULL::integer AS certificado,
    NULL::text AS documento,
    a.fecha AS fecha_reg,
    YEAR(a.fecha) * 100 + MONTH(a.fecha) AS "añomes_imputacion",
    "Inversiones" AS unidad_de_negocio,
    p.cliente_proyecto AS cliente_proyecto,
    NULL::text AS proveedor,
    NULL::text AS caja_contrapartida,
    "Ingreso a cuenta de acopio/gasto" AS imputacion,
    NULL::text AS presupuesto,
    a.observacion AS observacion,


SELECT
      "ID",
      "Fecha Reg",
      "Tipo Reg",
      "Unidad de negocio",
      "Cliente/Proyecto",
      "Contrapartida",
      "Observación",
      "Total Gasto/Ingreso",
      "Caja"
  FROM db_total_v2 dbt
  WHERE EXISTS (
      SELECT 1
      FROM tesoreria_registro tr
      INNER JOIN iva_clienteproyecto cp ON
  tr.cliente_proyecto_id = cp.id
      INNER JOIN iva_unidaddenegocio un_cp ON
  cp.unidad_de_negocio_id = un_cp.id
      INNER JOIN iva_unidaddenegocio un_tr ON
  tr.unidad_de_negocio_id = un_tr.id
      WHERE tr.id = dbt."ID"
        AND tr.activo = TRUE
        AND un_cp.unidad_de_negocio !=
  un_tr.unidad_de_negocio
        AND cp.cliente_proyecto NOT IN ('RETIRO',       
  'Indirectos')
        AND dbt."Unidad de negocio" != 'APORTE/RETIRO'
  )
      ORDER BY "Fecha Reg" DESC, "ID" DESC;

SELECT
      "ID",
      "Fecha Reg",
      "Tipo Reg",
      "Unidad de negocio",
      "Cliente/Proyecto",
      "Contrapartida",
      "Observación",
      "Total Gasto/Ingreso",
      "Caja"
  FROM db_total_v2 dbt
    WHERE dbt."Cliente/Proyecto" = 'Carpinchos 260'
      ORDER BY "Fecha Reg" DESC, "ID" DESC;
  

  UPDATE tesoreria_registro
  SET unidad_de_negocio_id = (
      SELECT cp.unidad_de_negocio_id
      FROM iva_clienteproyecto cp
      WHERE cp.id =
  tesoreria_registro.cliente_proyecto_id
  )
  WHERE id = 43025;

    UPDATE tesoreria_registro
  SET unidad_de_negocio_id = (
      SELECT cp.unidad_de_negocio_id
      FROM iva_clienteproyecto cp
      WHERE cp.id =
  tesoreria_registro.cliente_proyecto_id
  )
  WHERE cliente_proyecto_id = 98;

-- db_total sqlite3
SELECT 
	tr.id,
    tr.tipo_reg,
    tcaja.caja,
    tr.fecha_reg,
    tr."añomes_imputacion",
    iva_cp.cliente_proyecto,
    COALESCE(iva_p.nombre_fantasia_pila, iva_p.razon_social) AS tercero,
    iva_imp.imputacion,
    /*CASE -- Presupuesto
    WHEN tr.presupuesto_id IS NOT NULL THEN
        COALESCE(tp_cp.cliente_proyecto, '') || ' - ' ||
        COALESCE(tp_prov.nombre_fantasia_pila, tp_prov.razon_social, '') || ' - ' ||
        COALESCE(tp.observacion, '')
    ELSE NULL
    END AS presupuesto,*/
    tr.observacion AS descripcion,
    tr.monto_gasto_ingreso_neto,
    tr.iva_gasto_ingreso,
    COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0) AS total_gasto_ingreso,
    tr.monto_op_rec,
    --tr.moneda,
    --tr.tipo_de_cambio,
    --tr.realizado,
    mep.compra AS tipo_de_cambio_mep,
    CASE
    WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio IS NOT 1 THEN
        CASE
        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) IS NOT NULL THEN
            (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
        ELSE NULL
        END
    WHEN mep.compra IS NOT NULL THEN
        CASE
        WHEN (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) IS NOT NULL THEN
            (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
        ELSE NULL
        END
    ELSE NULL
    END AS total_gasto_ingreso_dolar,
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
    WHERE tr.activo = 1
  GROUP BY tr.id, tr.tipo_reg, tcaja.caja, tr.fecha_reg, tr."añomes_imputacion", iva_cp.cliente_proyecto, iva_p.nombre_fantasia_pila, iva_p.razon_social, iva_imp.imputacion, tp_cp.cliente_proyecto, tp_prov.nombre_fantasia_pila, tp_prov.razon_social, tp.observacion, tr.observacion, tr.monto_gasto_ingreso_neto, tr.iva_gasto_ingreso, tr.monto_op_rec, tr.moneda, tr.tipo_de_cambio, tr.realizado;


SELECT d.id, t.*, p.razon_social AS proveedor_slug
FROM iva_documento d
LEFT JOIN iva_persona p ON d.proveedor_id = p.id
JOIN (
    SELECT 
        d.tipo_documento_id, 
        d.punto_de_venta, 
        d.numero, 
        d.proveedor_id, 
        COUNT(*) AS qty
    FROM iva_documento d
    WHERE d.activo IS true
    GROUP BY d.tipo_documento_id, d.punto_de_venta, d.numero, d.proveedor_id
    HAVING COUNT(*) > 1
) t 
ON d.tipo_documento_id = t.tipo_documento_id 
   AND d.punto_de_venta = t.punto_de_venta 
   AND d.numero = t.numero 
   AND d.proveedor_id = t.proveedor_id
WHERE d.activo IS true;









-- Vista unificada optimizada para Juan Trivelloni (sin repetir subconsultas)
CREATE OR REPLACE VIEW db_total_jt AS
WITH base_data AS (
    SELECT 
        tr.id,
        tr.tipo_reg,
        tcaja.caja,
        tr.fecha_reg,
        tr."añomes_imputacion",
        iva_und.unidad_de_negocio,
        iva_cp.cliente_proyecto,
        CASE
            WHEN tr.proveedor_id IS NOT NULL THEN
                COALESCE(iva_p.nombre_fantasia_pila, iva_p.razon_social)
            ELSE
                tcaja_contra.caja
        END AS contrapartida,
        iva_imp.imputacion,
        tr.observacion,
        tr.monto_gasto_ingreso_neto,
        tr.iva_gasto_ingreso,
        COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0) AS total_gasto_ingreso,
        tr.monto_op_rec,
        tr.moneda,
        tr.tipo_de_cambio,
        mep.compra AS tipo_cambio_mep,
        tr.realizado,
        iva_cp.id AS proyecto_id,
        -- Calculamos USD una sola vez
        ROUND(CASE
            WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio <> 1 THEN 
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
            WHEN mep.compra IS NOT NULL THEN 
                (COALESCE(tr.monto_gasto_ingreso_neto, 0) + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
            ELSE NULL
        END, 4) AS total_gasto_ingreso_usd
    FROM tesoreria_registro tr
    LEFT JOIN tesoreria_caja tcaja ON tr.caja_id = tcaja.id
    LEFT JOIN iva_unidaddenegocio iva_und ON tr.unidad_de_negocio_id = iva_und.id
    LEFT JOIN iva_clienteproyecto iva_cp ON tr.cliente_proyecto_id = iva_cp.id
    LEFT JOIN iva_persona iva_p ON tr.proveedor_id = iva_p.id
    LEFT JOIN tesoreria_caja tcaja_contra ON tr.caja_contrapartida_id = tcaja_contra.id
    LEFT JOIN iva_imputacion iva_imp ON tr.imputacion_id = iva_imp.id
    LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
    WHERE tr.activo = true
),
porcentajes_jt AS (
    -- Obtenemos los porcentajes de JT una sola vez
    SELECT DISTINCT 
        ip.proyecto_id,
        ip.porcentaje
    FROM inversiones_porcentajeinversion ip
    INNER JOIN inversiones_inversor i ON ip.inversor_id = i.id
    WHERE i.nombre = 'Juan Trivelloni'
)
SELECT 
    bd.id AS "ID",
    bd.tipo_reg AS "Tipo Reg",
    bd.caja AS "Caja",
    bd.fecha_reg AS "Fecha Reg",
    bd."añomes_imputacion" AS "Mes imputación",
    bd.unidad_de_negocio AS "Unidad de negocio",
    bd.cliente_proyecto AS "Cliente/Proyecto",
    bd.contrapartida AS "Contrapartida",
    bd.imputacion AS "Imputación",
    bd.observacion AS "Observación",
    bd.monto_gasto_ingreso_neto AS "Monto Gasto/Ingreso Neto",
    bd.iva_gasto_ingreso AS "IVA Gasto/Ingreso",
    bd.total_gasto_ingreso AS "Total Gasto/Ingreso",
    bd.monto_op_rec AS "Monto OP/REC",
    bd.moneda AS "Moneda",
    bd.tipo_de_cambio AS "Tipo de cambio",
    bd.tipo_cambio_mep AS "Tipo de cambio MEP",
    bd.total_gasto_ingreso_usd AS "Total Gasto/Ingreso USD",
    bd.realizado AS "Realizado",
    -- Campos específicos para Juan Trivelloni
    pjt.porcentaje AS "porcentaje_inversor",
    ROUND(bd.total_gasto_ingreso_usd * COALESCE(pjt.porcentaje, 100) / 100, 4) AS "Total Gasto/Ingreso USD JT"
FROM base_data bd
LEFT JOIN porcentajes_jt pjt ON bd.proyecto_id = pjt.proyecto_id
ORDER BY bd.fecha_reg DESC, bd.id DESC;