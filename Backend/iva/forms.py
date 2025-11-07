from django import forms
from .models import Documento

class DocumentoForm(forms.ModelForm):
    class Meta:
        model = Documento
        fields = ['tipo_documento','fecha_documento','proveedor','receptor','serie','numero', 'añomes_imputacion_gasto',
                  'unidad_de_negocio', 'cliente_proyecto', 'imputacion', 'concepto', 'comentario', 'neto', 'iva', 'percepcion_de_iva',
                  'percepcion_de_iibb','no_gravado','exento','moneda','tipo_de_cambio','archivo']