from django.urls import path
from ..views import pagos

urlpatterns = [
    path("nuevo_pago/",pagos.ProcessPaymentView.as_view(), name="pagos"),
    path("",pagos.PagosList.as_view(), name="pagos_index"),
    path("<int:pk>/",pagos.PagoDetail.as_view(), name="pago_detail"),
    path("transferencia_masiva/",pagos.TransferenciaMasivaPorArchivo.as_view(), name="transferencia_masiva"),
    path("mdo/",pagos.NuevoPagoMDO.as_view(), name="pagos_mdo"),
]