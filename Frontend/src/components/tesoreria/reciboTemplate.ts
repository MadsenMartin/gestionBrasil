import { Registro } from "@/types/genericos"

interface DatosRecibo {
    numero_recibo: string
    fecha: string
    concepto: string
    pagador: string
    monto: number
    proveedor: string
    tipo_registro: string
    caja: string
    moneda: string
}

export const generarReciboHTML = (registro: Registro): string => {
    // Generar número de recibo basado en ID
    const numeroRecibo = registro.id.toString()
    
    // Formatear fecha al estilo argentino (día de mes de año)
    const fecha = new Date(registro.fecha_reg).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
    
    // Determinar el monto a mostrar
        let monto = registro.monto_op_rec || registro.monto_gasto_ingreso_neto || 0;
        // Siempre positivo para el recibo
        monto = Math.abs(monto);
    
    // Formatear moneda
    const monedaTexto = registro.moneda === 2 ? 'dólares' : 'pesos'
    const simboloMoneda = registro.moneda === 2 ? 'U$S' : '$'
    
    // Convertir número a texto para el monto
        const numeroATexto = (num: number): string => {
            const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
            const especiales = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
            const decenas = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
            const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
            if (num === 0) return 'cero';
            if (num === 100) return 'cien';
            if (num < 10) return unidades[num];
            if (num < 20) return especiales[num-10];
            if (num < 100) {
                if (num < 30) return 'veinti' + unidades[num-20];
                return decenas[Math.floor(num/10)] + (num%10 ? ' y ' + unidades[num%10] : '');
            }
            if (num < 1000) {
                return centenas[Math.floor(num/100)] + (num%100 ? ' ' + numeroATexto(num%100) : '');
            }
            if (num < 1000000) {
                const miles = Math.floor(num/1000);
                const resto = num%1000;
                let milesTexto = '';
                if (miles === 1) milesTexto = 'mil';
                else milesTexto = numeroATexto(miles) + ' mil';
                return milesTexto + (resto ? ' ' + numeroATexto(resto) : '');
            }
            return num.toLocaleString('es-AR');
        };
    
        const montoEnTexto = Number.isFinite(monto) && monto > 0 ? numeroATexto(Math.floor(monto)) : 'cero';
    
    const datos: DatosRecibo = {
        numero_recibo: numeroRecibo,
        fecha: fecha,
        concepto: registro.observacion || '',
        pagador: 'Juan Trivelloni',
        monto: monto,
        proveedor: registro.proveedor || '',
        tipo_registro: registro.tipo_reg,
        caja: registro.caja || '',
        moneda: monedaTexto
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recibo - ${datos.numero_recibo}</title>
            <style>
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                body {
                    font-family: 'Times New Roman', serif;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 8mm 12mm 4mm 12mm;
                    background: white;
                    color: #000;
                    line-height: 1.4;
                    font-size: 17px;
                }
                .encabezado {
                    text-align: right;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 6px;
                }
                .fecha-lugar {
                    font-size: 15px;
                    margin-bottom: 2px;
                }
                .numero {
                    font-size: 16px;
                    font-weight: bold;
                }
                .titulo-recibo {
                    font-size: 18px;
                    font-weight: bold;
                    text-align: left;
                    margin: 16px 0 10px 0;
                    text-transform: uppercase;
                }
                .linea-contenido {
                    margin: 10px 0;
                    font-size: 15px;
                    display: flex;
                    align-items: baseline;
                }
                .etiqueta {
                    font-weight: normal;
                    margin-right: 8px;
                }
                .campo-valor {
                    border-bottom: 1px solid #000;
                    flex: 1;
                    min-height: 18px;
                    padding: 0 8px 2px 8px;
                    display: inline-block;
                }
                .monto-numero {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                }
                .monto-texto {
                    font-style: italic;
                    margin-top: 4px;
                    font-size: 13px;
                }
                .concepto-seccion {
                    margin: 12px 0;
                }
                .concepto-valor {
                    border-bottom: 1px solid #000;
                    min-height: 24px;
                    padding: 6px;
                    margin-top: 4px;
                }
                .firma-seccion {
                    margin-top: 80px;
                    text-align: center;
                }
                .linea-firma {
                    border-bottom: 2.5px solid #000;
                    width: 320px;
                    margin: 44px auto 10px auto;
                }
                .texto-firma {
                    font-size: 16px;
                    margin-top: 8px;
                }

                .no-print {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    z-index: 1000;
                }
                .btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .btn:hover {
                    background: #0056b3;
                }
                @media print {
                    body {
                        padding: 10mm;
                        font-size: 12px;
                    }
                    .titulo-recibo {
                        font-size: 18px;
                    }
                    .linea-contenido {
                        font-size: 14px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="encabezado">
                <div class="fecha-lugar">${datos.fecha}</div>
                <div class="numero">N° ${datos.numero_recibo}</div>
            </div>
            
            <div class="titulo-recibo">Recibí</div>
            
            <div class="linea-contenido">
                <span class="etiqueta">de</span>
                <span class="campo-valor">${datos.pagador}</span>
            </div>
            
            <div class="linea-contenido">
                <span class="etiqueta">la cantidad de</span>
                <span class="campo-valor monto-numero">${datos.moneda} ${montoEnTexto}</span>
            </div>
            
            <div class="concepto-seccion">
                <div class="linea-contenido">
                    <span class="etiqueta">en concepto de</span>
                    <span class="campo-valor">${datos.concepto}</span>
                </div>
            </div>
            
            <div class="linea-contenido">
                <span class="etiqueta">Son</span>
                <span class="campo-valor monto-numero">${simboloMoneda} ${datos.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <div class="firma-seccion">
                <div class="linea-firma"></div>
                <div class="texto-firma">
                    <strong>${datos.proveedor}</strong>
                </div>
            </div>
            
            <div class="no-print">
                <button class="btn" onclick="window.print()">🖨️ Imprimir</button>
                <button class="btn" onclick="window.close()">❌ Cerrar</button>
            </div>
        </body>
        </html>
    `;
};

export const generarRecibo = (registro: Registro): void => {
    const html = generarReciboHTML(registro);
    
    // Crear una nueva ventana para mostrar el recibo
    const ventanaRecibo = window.open('', '_blank', 'width=700,height=900,scrollbars=yes,resizable=yes');
    
    if (ventanaRecibo) {
        ventanaRecibo.document.write(html);
        ventanaRecibo.document.close();
        
        // Enfocar la nueva ventana
        ventanaRecibo.focus();
    } else {
        // Si no se puede abrir la ventana (bloqueador de popups), mostrar en la misma página
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_${registro.id}_${new Date().getTime()}.html`;
        link.click();
        URL.revokeObjectURL(url);
    }
};