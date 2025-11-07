CREATE OR REPLACE VIEW db_presupuestos AS
SELECT
p.id AS "ID",
p.fecha AS "Fecha",
COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) AS "Proveedor",
cp.cliente_proyecto AS "Cliente/Proyecto",
p.observacion AS "Observacion",
p.monto AS "Monto",
p.saldo AS "Saldo"
FROM tesoreria_presupuesto p
LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
WHERE p.activo IS true
ORDER BY p.fecha DESC;


--db_presupuestos_v2
--esta incluye el cálculo del saldo on demand
CREATE OR REPLACE VIEW db_presupuestos_v2 AS
SELECT
    p.id AS "ID",
    p.fecha AS "Fecha",
    prov.id AS "Proveedor ID",
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) AS "Proveedor",
    cp.id AS "Cliente/Proyecto ID",
    cp.cliente_proyecto AS "Cliente/Proyecto",
    i.imputacion AS "Imputacion",
    p.observacion AS "Observacion",
    COALESCE(cp.cliente_proyecto, '') || ' - ' || 
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, '') || ' - ' || 
    COALESCE(p.observacion, '') AS "Nombre",
    p.monto AS "Monto",
    (p.monto + COALESCE(
        (SELECT SUM(tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0)) 
         FROM tesoreria_registro tr 
         WHERE tr.presupuesto_id = p.id 
         AND tr.activo IS TRUE), 
        0
    )) AS "Saldo",
    p.estado AS "Estado",
    p.aprobado AS "Aprobado"
FROM tesoreria_presupuesto p
LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
LEFT JOIN iva_imputacion i ON p.imputacion_id = i.id
WHERE p.activo IS TRUE
ORDER BY p.fecha DESC;


--Backup definición 2025-08-08
 SELECT p.id AS "ID",
    p.fecha AS "Fecha",
    prov.id AS "Proveedor ID",
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) AS "Proveedor",
    cp.id AS "Cliente/Proyecto ID",
    cp.cliente_proyecto AS "Cliente/Proyecto",
    p.observacion AS "Observacion",
    (((COALESCE(cp.cliente_proyecto, ''::character varying)::text || ' - '::text) || COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying)::text) || ' - '::text) || COALESCE(p.observacion, ''::text) AS "Nombre",
    p.monto AS "Monto",
    p.monto + COALESCE(( SELECT sum(tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0::numeric)) AS sum
           FROM tesoreria_registro tr
          WHERE tr.presupuesto_id = p.id AND tr.activo IS TRUE), 0::numeric) AS "Saldo",
    p.estado AS "Estado",
    p.aprobado AS "Aprobado"
   FROM tesoreria_presupuesto p
     LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
     LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
  WHERE p.activo IS TRUE
  ORDER BY p.fecha DESC;



--db_presupuestos_ss
--Es db_presupuestos_v2 con los consumos en ARS y USD (optimizado con CTE)
CREATE OR REPLACE VIEW db_presupuestos_ss AS
WITH consumos_calculados AS (
    SELECT 
        tr.presupuesto_id,
        SUM(tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0)) AS total_consumos_ars,
        SUM(
            CASE
                WHEN tr.tipo_de_cambio IS NOT NULL AND tr.tipo_de_cambio > 1.00 THEN 
                    (tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0)) / tr.tipo_de_cambio
                WHEN mep.compra IS NOT NULL THEN 
                    (tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0)) / mep.compra
                ELSE 0
            END
        ) AS total_consumos_usd
    FROM tesoreria_registro tr 
    LEFT JOIN tesoreria_dolarmep mep ON tr.fecha_reg = mep.fecha
    WHERE tr.activo IS TRUE
    GROUP BY tr.presupuesto_id
)
SELECT
    p.id AS "ID",
    p.fecha AS "Fecha",
    prov.id AS "Proveedor ID",
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) AS "Proveedor",
    cp.id AS "Cliente/Proyecto ID",
    cp.cliente_proyecto AS "Cliente/Proyecto",
    i.imputacion AS "Imputacion",
    p.observacion AS "Observacion",
    COALESCE(cp.cliente_proyecto, '') || ' - ' || 
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, '') || ' - ' || 
    COALESCE(p.observacion, '') AS "Nombre",
    p.monto AS "Monto",
    (p.monto + COALESCE(cc.total_consumos_ars, 0)) AS "Saldo",
    COALESCE(cc.total_consumos_ars, 0) * -1 AS "Consumos ARS",
    COALESCE(cc.total_consumos_usd, 0) * -1 AS "Consumos USD",
    p.estado AS "Estado",
    p.aprobado AS "Aprobado"
FROM tesoreria_presupuesto p
LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
LEFT JOIN iva_imputacion i ON p.imputacion_id = i.id
LEFT JOIN consumos_calculados cc ON p.id = cc.presupuesto_id
WHERE p.activo IS TRUE
ORDER BY p.fecha DESC;



--MDO vs PPTO x Contratista (2)
CREATE OR REPLACE VIEW mdo_vs_ppto_x_contratista AS
SELECT * FROM db_total_v2
WHERE "Presupuesto" IS NOT NULL
UNION
SELECT
 p.id AS "ID",
 'PPTO' AS "Tipo Reg",
 'Presupuestos' AS "Caja",
 NULL AS "Certificado",
 NULL AS "N° Documento",
 p.fecha AS "Fecha Reg",
 NULL AS "Mes imputación",
 u.unidad_de_negocio AS "Unidad de negocio",
 cp.cliente_proyecto AS "Cliente/Proyecto",
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) AS "Contrapartida",
    NULL AS "Imputación",
    COALESCE(cp.cliente_proyecto, ''::character varying) || ' - ' ||
    COALESCE(prov.nombre_fantasia_pila, prov.razon_social, ''::character varying) || ' - ' ||
    COALESCE(p.observacion, ''::character varying) AS "Presupuesto",
    p.observacion AS "Observación",
    p.monto AS "Monto Gasto/Ingreso Neto",
    NULL AS "IVA Gasto/Ingreso",
    p.monto AS "Total Gasto/Ingreso",
    p.monto AS "Monto OP/REC",
    1 AS "Moneda",
    1 AS "Tipo de cambio",
    NULL AS "Tipo de cambio MEP",
    NULL AS "Total Gasto/Ingreso USD",
    NULL AS "Realizado"
FROM tesoreria_presupuesto p
LEFT JOIN iva_clienteproyecto cp ON p.cliente_proyecto_id = cp.id
LEFT JOIN iva_persona prov ON p.proveedor_id = prov.id
LEFT JOIN iva_unidaddenegocio u ON cp.unidad_de_negocio_id = u.id
WHERE p.activo IS true
ORDER BY "Fecha Reg" DESC;






CREATE OR REPLACE VIEW db_presupuestos_cliente AS
WITH presupuesto_cliente AS (
SELECT
    p_i.id AS "ID",
    p_i.numero AS "N°",
	p_i.nombre AS "Nombre",
    p_i.monto AS "Monto",
    p_i.iva_considerado AS "IVA Considerado",
    cp.cliente_proyecto AS "Cliente/Proyecto",
    (p_i.monto + COALESCE(
        (SELECT SUM(tr.monto_gasto_ingreso_neto + COALESCE(tr.iva_gasto_ingreso, 0)) 
         FROM tesoreria_registro tr 
         WHERE tr.presupuesto_cliente_item_id = p_i.id 
         AND tr.activo IS TRUE), 
        0
    )) AS "Saldo"

FROM presupuestos_cliente_itempresupuestocliente p_i
LEFT JOIN presupuestos_cliente_presupuestocliente pc ON p_i.presupuesto_cliente_id = pc.id
LEFT JOIN iva_clienteproyecto cp ON pc.cliente_proyecto_id = cp.id)
SELECT
    pc."ID",
	pc."N°",
	pc."Nombre",
	FORMAT("$%,.2f", pc."Monto") AS "Monto",
	pc."IVA Considerado",
	pc."Cliente/Proyecto",
	FORMAT("$%,.2f", pc."Saldo") AS "Saldo",
    FORMAT("$%,.2f", pc.monto - pc.saldo) AS "Gastado"
FROM presupuesto_cliente pc;