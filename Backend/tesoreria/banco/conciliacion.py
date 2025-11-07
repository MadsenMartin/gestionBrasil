# La API debe recibir un archivo CSV con los movimientos del banco y analizar cuales ya están cargados en el sistema.
# Caso Echeq debitado: Cod de Concepto = 9, Nro de cheque != ""
# Caso Echeq acreditado: Cod de Concepto = 232, Nro de cheque != ""
# Caso transferencia a 3ros: Cod de Concepto = 990, Debito en $ != "", Nro doc != "" (CNPJ)
# Caso transferencia de 3ros: Credito en $ != "", Nro doc != "" (CNPJ)
# En un caso ideal todos estos casos deberían estar cargados en el sistema.
# Resto de casos son los que generalmente no van a estar cargados en el sistema.

# Para analizar si un pago/cobro ya está cargado en el sistema, se debe analizar el monto, fecha y CNPJ para identificar a la persona.
# Ej. transferencia de 3ros con monto 1000, fecha 2021-01-01 y CNPJ 1234567890, se busca en la db si hay un registro con fecha_reg = 2021-01-01, monto_op_rec=1000 y proveedor__cnpj=1234567890

# Para todo este proceso se debe crear un endpoint que reciba un archivo CSV con los movimientos del banco y devuelva un JSON con los movimientos que ya están cargados en el sistema y los que no.
# Distribuidos en 4 listas: transferencias, echeqs, pagos y gastos_bancarios.
# Esta clasificación está dada por el criterio indicado arriba, y para el caso de los gastos se identifican por Cod de Concepto o Concepto.
# Estos criterios no deberían estar hardcodeados en el código, sino que deberían ser configurables desde el admin. Ya que hoy en día usamos el criterio del banco ICBC, pero podría cambiar en un futuro.
# Para esto se debe crear un modelo que permita configurar estos criterios y un endpoint que permita modificarlos.

# Para el endpoint de conciliación se debe crear un serializer que permita subir un archivo CSV y un endpoint que permita subirlo.
# Para el endpoint de configuración se debe crear un serializer que permita modificar los criterios y un endpoint que permita modificarlos.

# En un principio lo voy a hardcodear por una cuestión de tiempo, pero luego se debería hacer configurable.

import csv
from datetime import datetime
from io import TextIOWrapper
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from tesoreria.serializers import ConciliacionCSVSerializer, GastoBancarioSerializer, OPDesdeConciliacionSerializer
from tesoreria.models import Registro, Caja
from iva.models import UnidadDeNegocio, ClienteProyecto, Imputacion, Persona
from decimal import Decimal

ECHEQ_DEBITADO = "009"
ECHEQ_ACREDITADO = "232"
TRANSFERENCIA_A_3ROS = "990"
COMISION_TRANSFERENCIA = "020"
PERCEPCION_IVA = "208"
PERCEPCION_IIBB = "212"
IMPTO_DEBITO = "259"
IMPTO_CREDITO = "260"
PERCEPCION_IIBB_SIRCREB = "276"
COMISION_MANTENIMIENTO = "515"
RESCATE_FCI = "947"
SUSCRIPCION_FCI = "948"
IVA = "206"

gastos_sub_types_map = {
    COMISION_TRANSFERENCIA: 'Comisión de transferencia interbancaria',
    PERCEPCION_IVA: 'Percepción de IVA RG2408',
    PERCEPCION_IIBB: 'Percepción de IIBB BSAS',
    PERCEPCION_IIBB_SIRCREB: 'Percepcion IIBB SIRCREB',
    COMISION_MANTENIMIENTO: 'Comisión por mantenimiento de cuenta'
}

gastos_bancarios_map = {
    COMISION_TRANSFERENCIA: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "Comisiones",
        "proveedor": "Banco ICBC",
        "observacion": "Comisión de transferencia interbancaria",
    },
    COMISION_MANTENIMIENTO: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "Gastos bancarios",
        "proveedor": "Banco ICBC",
        "observacion": "Comisión por mantenimiento de cuenta"
    },
    PERCEPCION_IIBB_SIRCREB: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "IIBB ret/perc",
        "proveedor": "ARBA",
        "observacion": "Percepcion IIBB SIRCREB"
    },
    IMPTO_DEBITO: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "Impuesto al débito y crédito",
        "proveedor": "AFIP",
        "observacion": "Impuesto al débito y crédito"
    },
    PERCEPCION_IVA: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "IVA ret/perc",
        "proveedor": "AFIP",
        "observacion": "Percepción de IVA"
    },
    PERCEPCION_IIBB: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "IIBB ret/perc",
        "proveedor": "ARBA",
        "observacion": "Percepción de IIBB"
    },
    IMPTO_CREDITO: {
        "tipo_reg": "PSF",
        "unidad_de_negocio": "Indirectos",
        "cliente_proyecto": "Indirectos",
        "imputacion": "Impuesto al débito y crédito",
        "proveedor": "AFIP",
        "observacion": "Impuesto al débito y crédito"
    }
}

class ConciliacionCSVUploadView(APIView):
    """
    Endpoint que recibe un archivo CSV con los movimientos del banco,
    analiza cada registro y devuelve un JSON con los movimientos clasificados.
    """

    def formatear_monto_fecha(self,fecha: str, debito: str, credito: str, iva: str|None) -> tuple:
        '''
        Formatea los montos y la fecha de un movimiento bancario.
        '''
        monto_value = float(debito) if debito else float(credito)
        fecha_parsed = datetime.strptime(fecha, '%d/%m/%Y').strftime('%Y-%m-%d')
        iva = float(iva.replace(",",".")) if iva else 0.0

        return fecha_parsed, monto_value, iva

    def aplicar_criterio(self, fecha_parsed: str, cod_concepto: str, nro_cheque: str, debito: str, credito: str, iva: str, nro_doc: str, concepto: str) -> tuple:
        '''
        Aplica el criterio de clasificación a un movimiento bancario y devuelve sus características.

        @param fecha_parsed: Fecha del movimiento en formato 'D/M/YYYY'.
        @param cod_concepto: Código de concepto del movimiento.
        @param nro_cheque: Número de cheque asociado al movimiento, si aplica.
        @param debito: Monto debitado en el movimiento.
        @param credito: Monto acreditado en el movimiento.
        @param nro_doc: Número de documento (CNPJ) asociado al movimiento.
        @param concepto: Concepto del movimiento.

        @returns:
            transaction_type: Tipo de transacción.
            sub_type: Subtipo de transacción.
            ya_cargado: Booleano que indica si el movimiento ya está cargado en la caja del banco.
        '''
        # Formateamos el monto y la fecha
        fecha_parsed, monto_value, iva = self.formatear_monto_fecha(fecha_parsed, debito, credito, iva)

        transaction_type = None
        sub_type = None
        ya_cargado = False

        # 1. E-cheqs
        if cod_concepto == ECHEQ_DEBITADO and nro_cheque:
            transaction_type, sub_type = 'echeq', 'Echeq debitado'
        elif cod_concepto == ECHEQ_ACREDITADO and nro_cheque:
            transaction_type, sub_type = 'echeq', 'Echeq acreditado'

        # 2. Transferencias
        elif cod_concepto == TRANSFERENCIA_A_3ROS and debito and nro_doc:
            transaction_type, sub_type = 'transferencia', 'Transferencia a 3ros'
        elif credito and nro_doc:
            transaction_type, sub_type = 'transferencia', 'Transferencia de 3ros'

        # 3. Gastos bancarios (comisiones, percepciones, impuestos)
        elif cod_concepto in {COMISION_TRANSFERENCIA, PERCEPCION_IVA, PERCEPCION_IIBB,
                            IMPTO_CREDITO, IMPTO_DEBITO, PERCEPCION_IIBB_SIRCREB, COMISION_MANTENIMIENTO}:
            transaction_type = 'gasto_bancario'
            if cod_concepto in (IMPTO_CREDITO, IMPTO_DEBITO):
                sub_type = 'Impto. sobre el débito y crédito'
            else:
                sub_type = gastos_sub_types_map.get(cod_concepto)
            # Verificamos si ya existe un registro con estos datos en la caja del banco
            if fecha_parsed:
                ya_cargado = Registro.objects.filter(
                    fecha_reg=fecha_parsed,
                    monto_op_rec=monto_value+iva,
                    caja__caja="Banco ICBC",
                    activo=True,
                    imputacion__imputacion=gastos_bancarios_map[cod_concepto]['imputacion']
                ).exists()

        # 4. FCI
        elif cod_concepto == RESCATE_FCI:
            transaction_type, sub_type = 'fci', 'Rescate FCI'
            if fecha_parsed:
                ya_cargado = Registro.objects.filter(
                    fecha_reg=fecha_parsed,
                    monto_op_rec=monto_value,
                    caja_contrapartida__caja="Fondo inversión",
                    activo=True
                ).exists()
        elif cod_concepto == SUSCRIPCION_FCI:
            transaction_type, sub_type = 'fci', 'Suscripción FCI'
            if fecha_parsed:
                ya_cargado = Registro.objects.filter(
                    fecha_reg=fecha_parsed,
                    monto_op_rec=monto_value,
                    caja_contrapartida__caja="Fondo inversión",
                    activo=True
                ).exists()

        # 5. Resto: se clasifica como 'pago' y se usa el concepto recibido
        else:
            transaction_type, sub_type = 'pago', concepto

        # Verificación final: si se proporciona nro_doc (por ejemplo, el CNPJ) se busca si el registro ya existe
        if nro_doc and fecha_parsed:
            monto_value = round(Decimal(monto_value),4)
            if monto_value < 0:
                ya_cargado = Registro.objects.filter(
                    fecha_reg=fecha_parsed,
                    monto_op_rec=monto_value,
                    proveedor__cnpj=nro_doc,
                    activo=True
                ).exists()
            else:
                # TODO: acá debería tambien buscar por CNPJ del cliente, pero la estructura actual de la db no almacena ese dato en el registro
                ya_cargado = Registro.objects.filter(
                    fecha_reg=fecha_parsed,
                    monto_op_rec=monto_value,
                    tipo_reg__in=['REC', 'ISF'],
                    activo=True
                ).exists()

        return transaction_type, sub_type, ya_cargado

    def transformar_datos(self, reader):
        '''
        Método que recibe un archivo CSV con los movimientos del banco y devuelve un JSON con los movimientos clasificados.
        '''
        # Listas para acumular los movimientos clasificados
        transferencias = []
        echeqs = []
        pagos = []
        gastos_bancarios = []
        fci = []

        for i, row in enumerate(reader):
            # Campos del CSV
            concepto = row.get('Concepto', '').strip()
            cod_concepto = row.get('Cod de Concepto', '').strip()
            nro_cheque = row.get('Nro de cheque', '').strip()
            debito_value = row.get('Debito en $', '')
            debito = debito_value.strip().replace(",", ".") if debito_value else None
            credito_value = row.get('Credito en $', '')
            credito = credito_value.strip().replace(",", ".") if credito_value else None
            nombre_value = row.get('Nombre', '')
            nombre = nombre_value.strip() if nombre_value else None
            nro_doc_value = row.get('Nro doc', '')
            nro_doc = (nro_doc_value[2:] if nro_doc_value.startswith("00") else nro_doc_value) if nro_doc_value else None
            fecha = row.get('Fecha contable', '').strip()  # Se espera formato 'YYYY-MM-DD'
            concepto = row.get('Concepto', '').strip()

            # Obtenemos el IVA a partir del movimiento anterior
            iva = reader[i-1].get('Debito en $', '').strip() if i > 0 and reader[i-1].get('Cod de Concepto') == IVA else None

            # Como los IVA están incluidos en los movimientos que le siguen, los omitimos
            if cod_concepto == IVA:
                continue

            # Aplicamos el criterio de clasificación
            transaction_type, sub_type, ya_cargado = self.aplicar_criterio(fecha,cod_concepto, nro_cheque, debito, credito, iva, nro_doc, concepto)

            # Armamos el diccionario con los datos del movimiento
            movimiento = {
                "iva": iva,
                "id": i,
                "concepto": concepto,
                "cod_concepto": cod_concepto,
                "nro_cheque": nro_cheque,
                "debito": debito,
                "credito": credito,
                "nombre": nombre,
                "nro_doc": nro_doc,
                "fecha": fecha,
                "tipo": transaction_type,
                "sub_tipo": sub_type,
                "ya_cargado": ya_cargado,
            }

            # Distribuimos el movimiento según su clasificación
            if transaction_type == 'transferencia':
                transferencias.append(movimiento)
            elif transaction_type == 'echeq':
                echeqs.append(movimiento)
            elif transaction_type == 'pago':
                pagos.append(movimiento)
            elif transaction_type == 'gasto_bancario':
                gastos_bancarios.append(movimiento)
            elif transaction_type == 'fci':
                fci.append(movimiento)

        # Definimos el resultado final que será devuelto al frontend
        resultado = {
            "transferencias": transferencias,
            "echeqs": echeqs,
            "pagos": pagos,
            "gastos_bancarios": gastos_bancarios,
            "fci": fci
        }
        return resultado

    def post(self, request, *args, **kwargs):
        try:
            serializer = ConciliacionCSVSerializer(data=request.data)
            if serializer.is_valid():
                csv_file = serializer.validated_data['archivo']

                try:
                    decoded_file = TextIOWrapper(csv_file, encoding='utf-8', newline='')
                except Exception as e:
                    return Response({"error": f"Error al decodificar el archivo: {str(e)}"},
                                    status=status.HTTP_400_BAD_REQUEST)

                next(decoded_file) # Omito la primera fila
                reader = list(csv.DictReader(decoded_file, delimiter=';'))
                
                return Response(self.transformar_datos(reader), status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error al procesar el archivo: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class CrearGastoBancario(APIView):
    """
    Endpoint que recibe un gasto bancario a partir de la información obtenida desde el endpoint de ConciliacionCSVUploadView y crea un registro asociado
    """
    def post(self, request, *args, **kwargs):
        serializer = GastoBancarioSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            fecha = data['fecha']
            monto = float(data['debito'].replace(",", ".")) if data['debito'] else float(data['credito'].replace(",", "."))
            iva = float(data['iva'].replace(",",".")) if data['iva'] else 0.0
            registro = Registro(
                fecha_reg=fecha,
                monto_gasto_ingreso_neto=monto,
                iva_gasto_ingreso = iva,
                monto_op_rec=monto+iva,
                realizado=True,
                tipo_reg=gastos_bancarios_map[data['cod_concepto']]['tipo_reg'],
                unidad_de_negocio=UnidadDeNegocio.objects.get(unidad_de_negocio=gastos_bancarios_map[data['cod_concepto']]['unidad_de_negocio']),
                cliente_proyecto=ClienteProyecto.objects.get(cliente_proyecto=gastos_bancarios_map[data['cod_concepto']]['cliente_proyecto']),
                imputacion=Imputacion.objects.get(imputacion=gastos_bancarios_map[data['cod_concepto']]['imputacion']),
                proveedor=Persona.objects.get(nombre_fantasia=gastos_bancarios_map[data['cod_concepto']]['proveedor']),
                observacion=gastos_bancarios_map[data['cod_concepto']]['observacion'],
                añomes_imputacion = str(fecha).split("-")[0] + str(fecha).split("-")[1],
                moneda = 1,
                tipo_de_cambio=1,
                caja = Caja.objects.get(caja="Banco ICBC"),
            )
            registro.save()
            return Response({"message": "Gasto bancario creado exitosamente"}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CrearPagoDesdePlantilla(APIView):
    """
    Endpoint que recibe un movimiento de pago y una plantilla, y crea un registro de caja basado en la plantilla
    """
    def post(self, request, *args, **kwargs):
        from tesoreria.models import PlantillaRegistro
        from datetime import datetime
        
        movimiento_data = request.data.get('movimiento')
        plantilla_id = request.data.get('plantilla_id')
        monto = request.data.get('monto')
        
        if not movimiento_data or not plantilla_id or not monto:
            return Response({"error": "Faltan datos requeridos"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plantilla = PlantillaRegistro.objects.get(id=plantilla_id)
            
            # Convertir fecha del formato DD/MM/YYYY a objeto date
            fecha_str = movimiento_data.get('fecha')
            fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y').date()
            
            # Convertir monto a negativo (es un gasto/pago)
            monto_negativo = -abs(float(str(monto).replace(",", ".")))
            
            # Determinar si monto_gasto_ingreso_neto debe ser 0 según validaciones
            # Si [tipo_reg, 'monto_gasto_ingreso_neto'] está en combinacionesDisabled, entonces debe ser 0
            combinaciones_disabled = [
                ['OP', 'monto_gasto_ingreso_neto'],
                ['REC', 'monto_gasto_ingreso_neto'],
                ['MC', 'monto_gasto_ingreso_neto'],
                ['RETH', 'monto_gasto_ingreso_neto'],
                ['RETS', 'monto_gasto_ingreso_neto'],
            ]
            
            tipo_reg = plantilla.tipo_reg
            monto_gasto_ingreso_neto = 0 if [tipo_reg, 'monto_gasto_ingreso_neto'] in combinaciones_disabled else monto_negativo
            
            # Crear el registro basado en la plantilla
            registro = Registro(
                fecha_reg=fecha_obj,
                monto_gasto_ingreso_neto=monto_gasto_ingreso_neto,
                iva_gasto_ingreso=0,  # No se usa en conciliación
                monto_op_rec=monto_negativo,  # Siempre lleva el monto negativo
                realizado=True,
                tipo_reg=plantilla.tipo_reg,
                unidad_de_negocio=plantilla.unidad_de_negocio,
                cliente_proyecto=plantilla.cliente_proyecto,
                imputacion=plantilla.imputacion,
                proveedor=plantilla.proveedor,
                observacion=f"{plantilla.observacion} - {movimiento_data.get('concepto', '')}",
                añomes_imputacion=int(fecha_obj.strftime("%Y%m")),
                moneda=1,
                tipo_de_cambio=1,
                caja=Caja.objects.get(caja="Banco ICBC"),
            )
            registro.save()
            
            return Response({"message": "Pago creado exitosamente desde plantilla"}, status=status.HTTP_201_CREATED)
            
        except PlantillaRegistro.DoesNotExist:
            return Response({"error": "Plantilla no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error al crear el pago: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class CrearPagosMultiplesDesdePlantilla(APIView):
    """
    Endpoint que recibe múltiples movimientos de pago y una plantilla, y crea registros de caja basados en la plantilla
    """
    def post(self, request, *args, **kwargs):
        from tesoreria.models import PlantillaRegistro
        from datetime import datetime
        
        movimientos_data = request.data.get('movimientos', [])
        plantilla_id = request.data.get('plantilla_id')
        
        if not movimientos_data or not plantilla_id:
            return Response({"error": "Faltan datos requeridos"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plantilla = PlantillaRegistro.objects.get(id=plantilla_id)
            
            registros_creados = []
            errores = []
            
            # Determinar si monto_gasto_ingreso_neto debe ser 0 según validaciones
            combinaciones_disabled = [
                ['OP', 'monto_gasto_ingreso_neto'],
                ['REC', 'monto_gasto_ingreso_neto'],
                ['MC', 'monto_gasto_ingreso_neto'],
                ['RETH', 'monto_gasto_ingreso_neto'],
                ['RETS', 'monto_gasto_ingreso_neto'],
            ]
            
            tipo_reg = plantilla.tipo_reg
            usar_monto_gasto_ingreso_neto = [tipo_reg, 'monto_gasto_ingreso_neto'] not in combinaciones_disabled
            
            for movimiento_data in movimientos_data:
                try:
                    # Convertir fecha del formato DD/MM/YYYY a objeto date
                    fecha_str = movimiento_data.get('fecha')
                    fecha_obj = datetime.strptime(fecha_str, '%d/%m/%Y').date()
                    
                    # Obtener monto del movimiento
                    monto = movimiento_data.get('monto')
                    if monto is None:
                        # Si no viene monto, calcularlo desde credito/debito
                        if movimiento_data.get('credito'):
                            monto = abs(float(movimiento_data['credito'].replace(",", ".")))
                        elif movimiento_data.get('debito'):
                            monto = abs(float(movimiento_data['debito'].replace(",", ".")))
                        else:
                            errores.append(f"No se pudo determinar el monto para movimiento {movimiento_data.get('id')}")
                            continue
                    else:
                        monto = abs(float(str(monto).replace(",", ".")))
                    
                    # Convertir monto a negativo (es un gasto/pago)
                    monto_negativo = -monto
                    monto_gasto_ingreso_neto = monto_negativo if usar_monto_gasto_ingreso_neto else 0
                    
                    # Crear el registro basado en la plantilla
                    registro = Registro(
                        fecha_reg=fecha_obj,
                        monto_gasto_ingreso_neto=monto_gasto_ingreso_neto,
                        iva_gasto_ingreso=0,  # No se usa en conciliación
                        monto_op_rec=monto_negativo,  # Siempre lleva el monto negativo
                        realizado=True,
                        tipo_reg=plantilla.tipo_reg,
                        unidad_de_negocio=plantilla.unidad_de_negocio,
                        cliente_proyecto=plantilla.cliente_proyecto,
                        imputacion=plantilla.imputacion,
                        proveedor=plantilla.proveedor,
                        observacion=f"{plantilla.observacion} - {movimiento_data.get('concepto', '')}",
                        añomes_imputacion=int(fecha_obj.strftime("%Y%m")),
                        moneda=1,
                        tipo_de_cambio=1,
                        caja=Caja.objects.get(caja="Banco ICBC"),
                    )
                    registro.save()
                    registros_creados.append(registro.id)
                    
                except Exception as e:
                    errores.append(f"Error procesando movimiento {movimiento_data.get('id')}: {str(e)}")
            
            if registros_creados and not errores:
                return Response({
                    "message": f"{len(registros_creados)} pagos creados exitosamente desde plantilla",
                    "registros_creados": registros_creados
                }, status=status.HTTP_201_CREATED)
            elif registros_creados and errores:
                return Response({
                    "message": f"{len(registros_creados)} pagos creados, {len(errores)} errores",
                    "registros_creados": registros_creados,
                    "errores": errores
                }, status=status.HTTP_207_MULTI_STATUS)
            else:
                return Response({
                    "error": "No se pudo crear ningún pago",
                    "errores": errores
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except PlantillaRegistro.DoesNotExist:
            return Response({"error": "Plantilla no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error general: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

                
