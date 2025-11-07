SELECT
r.cnpj AS receptor_cnpj,
r.razon_social AS receptor_razon_social,
r.activo AS receptor_activo,
p.cnpj AS proveedor_cnpj,
p.razon_social AS proveedor_razon_social,
p.empleado AS proveedor_empleado,
p.activo AS proveedor_activo,
pg.contrapartida AS proveedor_nombre_fantasia_pila,
td.tipo_documento AS tipo_documento,
punto_de_venta AS punto_de_venta,
numero AS numero,
fecha_documento AS fecha_documento,
aniomes_imputacion_contable AS añomes_imputacion_gasto,
neto AS neto,
iva AS iva,
perc_de_iibb AS percepcion_de_iibb,
perc_de_iva AS percepcion_de_iva,
no_gravado AS no_gravado,
exento AS exento,
o.obra as cliente_proyecto,
i.imputacion AS imputacion,
moneda AS moneda,
tipo_de_cambio AS tipo_de_cambio,
concepto AS concepto,
comentario AS comentario,
documento_path AS archivo
FROM
documentos d
LEFT JOIN
receptores r ON d.receptor = r.id
LEFT JOIN
proveedores p ON d.proveedor = p.id
LEFT JOIN
tipos_documento td ON d.tipo_documento = td.id
LEFT JOIN
obras o ON d.obra = o.id
LEFT JOIN
proveedores_gestion pg ON d.proveedor = pg.proveedor
LEFT JOIN
imputaciones i ON pg.imputacion = i.id
