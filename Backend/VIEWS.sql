CREATE VIEW db_total AS 
SELECT tr.id AS "ID",
tr.tipo_reg AS "Tipo Reg",
tcaja.caja AS "Caja",
tcert.id AS "Certificado",
( SELECT string_agg((iva_doc.serie::character varying::text || '-') || iva_doc.numero::character varying::text, ', '::text) AS string_agg
        FROM tesoreria_registro_documento trd
            LEFT JOIN iva_documento iva_doc ON trd.documento_id = iva_doc.id
        WHERE trd.registro_id = tr.id) AS "N° Documento",
tr.fecha_reg AS "Fecha Reg",
tr."añomes_imputacion" AS "Mes imputación",
iva_und.unidad_de_negocio AS "Unidad de negocio",
iva_cp.cliente_proyecto AS "Cliente/Proyecto",
    CASE
        WHEN tr.proveedor_id IS NOT NULL THEN COALESCE(iva_p.nombre_fantasia, iva_p.razon_social)
        ELSE tcaja_contra.caja
    END AS "Contrapartida",
iva_imp.imputacion AS "Imputación",
    CASE
        WHEN tr.presupuesto_id IS NOT NULL THEN (((COALESCE(tp_cp.cliente_proyecto, ''::character varying)::text || ' - '::text) || COALESCE(tp_prov.nombre_fantasia, tp_prov.razon_social, ''::character varying)::text) || ' - '::text) || COALESCE(tp.observacion, ''::character varying::text)
        ELSE NULL::text
    END AS "Presupuesto",
tr.observacion AS "Observación",
tr.monto_gasto_ingreso_neto AS "Monto Gasto/Ingreso Neto",
tr.iva_gasto_ingreso AS "IVA Gasto/Ingreso",
COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric) AS "Total Gasto/Ingreso",
tr.monto_op_rec AS "Monto OP/REC",
m.nombre AS "Moneda",
tr.tipo_de_cambio AS "Tipo de cambio",
mep.compra AS "Tipo de cambio MEP",
round(
    CASE
        WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio > 0::numeric THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / tr.tipo_de_cambio
        WHEN mep.compra IS NOT NULL THEN (COALESCE(tr.monto_gasto_ingreso_neto, 0::numeric) + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / mep.compra
        ELSE NULL::numeric
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
    LEFT JOIN shared_moneda m ON tr.moneda_id = m.id
WHERE tr.activo = true
ORDER BY tr.id DESC;


CREATE VIEW db_presupuestos_ss AS
 WITH consumos_calculados AS (
         SELECT tr.presupuesto_id,
            sum(tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) AS total_consumos_ars,
            sum(
                CASE
                    WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio > 1.00 THEN (tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / tr.tipo_de_cambio
                    WHEN mep.compra IS NOT NULL THEN (tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) / mep.compra
                    ELSE 0::numeric
                END) AS total_consumos_usd
           FROM tesoreria_registro tr
             LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
          WHERE tr.activo IS TRUE
          GROUP BY tr.presupuesto_id
        )
 SELECT p.id AS "ID",
    p.fecha AS "Fecha",
    prov.id AS "Proveedor ID",
    COALESCE(prov.nombre_fantasia, prov.razon_social, ''::character varying) AS "Proveedor",
    cp.id AS "Cliente/Proyecto ID",
    cp.cliente_proyecto AS "Cliente/Proyecto",
    i.imputacion AS "Imputacion",
    p.observacion AS "Observacion",
    (((COALESCE(cp.cliente_proyecto, ''::character varying)::text || ' - '::text) || COALESCE(prov.nombre_fantasia, prov.razon_social, ''::character varying)::text) || ' - '::text) || COALESCE(p.observacion, ''::text) AS "Nombre",
    p.monto AS "Monto",
    p.monto + COALESCE(cc.total_consumos_ars, 0::numeric) AS "Saldo",
    COALESCE(cc.total_consumos_ars, 0::numeric) * '-1'::integer::numeric AS "Consumos ARS",
    COALESCE(cc.total_consumos_usd, 0::numeric) * '-1'::integer::numeric AS "Consumos USD",
    p.estado AS "Estado",
    p.aprobado AS "Aprobado"
   FROM tesoreria_presupuesto p
     LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
     LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
     LEFT JOIN iva_imputacion i ON p.imputacion_id = i.id
     LEFT JOIN consumos_calculados cc ON p.id = cc.presupuesto_id
  WHERE p.activo IS TRUE
  ORDER BY p.fecha DESC;


CREATE VIEW cuenta_corriente_inversores AS
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
          WHERE tr.activo = true AND (tr.tipo_reg::text <> ALL (ARRAY['OP'::character varying::text, 'MC'::character varying::text, 'RETH'::character varying::text, 'PERCS'::character varying::text])) AND (tr.cliente_proyecto_id IN ( SELECT inversiones_porcentajeinversion.proyecto_id
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