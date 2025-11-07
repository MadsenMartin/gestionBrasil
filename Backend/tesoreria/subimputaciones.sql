SELECT 
	tr.id,
    tr.tipo_reg,
    tcaja.caja,
    tr.fecha_reg,
    tr."añomes_imputacion",
    iva_cp.cliente_proyecto,
	tr.proveedor_id,
    COALESCE(iva_p.nombre_fantasia_pila, iva_p.razon_social) AS proveedor,
	tr.imputacion_id,
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
	COALESCE(sub_imp.nombre ,sub_imp_d.nombre) AS sub_imputacion
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
	 LEFT JOIN tesoreria_subimputacionmapping sim ON tr.proveedor_id = sim.proveedor_id AND tr.imputacion_id = sim.imputacion_id
	 LEFT JOIN tesoreria_subimputacion sub_imp_d ON sim.sub_imputacion_id = sub_imp_d.id
	 LEFT JOIN tesoreria_subimputacion sub_imp ON tr.sub_imputacion_id = sub_imp.id
    WHERE tr.activo = 1
	AND iva_p.id = 177 
  GROUP BY tr.id, tr.tipo_reg, tcaja.caja, tr.fecha_reg, tr."añomes_imputacion", iva_cp.cliente_proyecto, iva_p.nombre_fantasia_pila, iva_p.razon_social, iva_imp.imputacion, tp_cp.cliente_proyecto, tp_prov.nombre_fantasia_pila, tp_prov.razon_social, tp.observacion, tr.observacion, tr.monto_gasto_ingreso_neto, tr.iva_gasto_ingreso, tr.monto_op_rec, tr.moneda, tr.tipo_de_cambio, tr.realizado;