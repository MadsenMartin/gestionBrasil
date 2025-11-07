from tesoreria.models import Registro, Caja
from iva.models import Imputacion
from .models import Documento

def registro_desde_documento_temporal(documento: Documento, documento_temporal: Documento, presupuesto = None):
    registro = registro_desde_documento(documento_temporal, presupuesto)
    registro.documento.set([documento])
    registro.save()
    documento.imputado = True
    documento.save()
    return registro

def registro_desde_documento_real(documento: Documento, presupuesto = None):
    registro = registro_desde_documento(documento, presupuesto)
    registro.documento.set([documento])
    registro.save()
    documento.imputado = True
    documento.save()
    percs = registros_percepciones(documento)
    return (registro, percs)

def registro_desde_documento(documento: Documento, presupuesto = None):
    try:
        # Pruebo primero si no existe ya un registro para ese documento, filtro también por cliente_proyecto porque un mismo documento puede tener más de un registro para distintas obras
        registro = Registro.objects.filter(documento__in=[documento], cliente_proyecto=documento.cliente_proyecto, activo=True).first()
        if registro:
            documento.imputado = True
            documento.save()
            return registro
        caja_facturas = Caja.objects.get(caja="Facturas")
        registro = Registro.objects.create(
            caja=caja_facturas,
            tipo_reg="FC",
            añomes_imputacion=documento.añomes_imputacion_gasto,
            fecha_reg=documento.fecha_documento,
            unidad_de_negocio=documento.unidad_de_negocio or None, # Si no se especifica, se asigna None, para asignar luego
            cliente_proyecto=documento.cliente_proyecto or None, # ""
            imputacion=documento.imputacion or None, # ""
            observacion=documento.concepto,
            proveedor=documento.proveedor,
            presupuesto = presupuesto,
            monto_gasto_ingreso_neto=-documento.neto,
            iva_gasto_ingreso=-documento.iva,
            monto_op_rec=0,
            moneda=documento.moneda,
            tipo_de_cambio=documento.tipo_de_cambio,
            realizado=True
        )
        return registro
    except Exception as e:
        raise e
    
def registros_percepciones(documento: Documento):
    try:
        # Variables para controlar si los registros existen
        iva_exists = False
        iibb_exists = False
        iibb = documento.percepcion_de_iibb
        iva = documento.percepcion_de_iva
        percs = []
        caja_facturas = Caja.objects.get(caja="Facturas")
        if not iva and not iibb:
            return
        
        # Verificar registros existentes
        registros = Registro.objects.filter(documento__in=[documento], tipo_reg="PERCS", activo=True)
        
        for registro in registros:
            if registro.imputacion == Imputacion.objects.get(imputacion="IVA ret/perc") and registro.monto_gasto_ingreso_neto == documento.percepcion_de_iva:
                iva_exists = True
            if registro.imputacion == Imputacion.objects.get(imputacion="IIBB ret/perc") and registro.monto_gasto_ingreso_neto == documento.percepcion_de_iibb:
                iibb_exists = True
        
        # Crear registros solo si no existen
        if iibb and iibb != 0 and not iibb_exists:
            registro = Registro.objects.create(
                caja=caja_facturas,
                tipo_reg="PERCS",
                añomes_imputacion=documento.añomes_imputacion_gasto,
                fecha_reg=documento.fecha_documento,
                imputacion=Imputacion.objects.get(imputacion="IIBB ret/perc"),
                observacion="Perc. IIBB",
                proveedor=documento.proveedor,
                monto_gasto_ingreso_neto=-iibb,
                iva_gasto_ingreso=0,
                monto_op_rec=0,
                moneda=documento.moneda,
                tipo_de_cambio=documento.tipo_de_cambio,
                realizado=True
            )
            registro.documento.set([documento])
            registro.save()
            percs.append(registro)
        
        if iva and iva != 0 and not iva_exists:
            registro = Registro.objects.create(
                caja=caja_facturas,
                tipo_reg="PERCS",
                añomes_imputacion=documento.añomes_imputacion_gasto,
                fecha_reg=documento.fecha_documento,
                imputacion=Imputacion.objects.get(imputacion="IVA ret/perc"),
                observacion="Perc. IVA",
                proveedor=documento.proveedor,
                monto_gasto_ingreso_neto=-iva,
                iva_gasto_ingreso=0,
                monto_op_rec=0,
                moneda=documento.moneda,
                tipo_de_cambio=documento.tipo_de_cambio,
                realizado=True
            )
            registro.documento.set([documento])
            registro.save()
            percs.append(registro)
        return percs
    except Exception as e:
        raise e
            