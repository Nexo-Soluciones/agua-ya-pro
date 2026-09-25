export interface ReportData {
  todayStr: string;
  deliveredOrders: any[];
  drivers: any[];
  totalBottles: number;
  totalCashCollected: number;
  totalTransferCollected: number;
  totalCreditCollected: number;
  grandTotal: number;
  driverBreakdown: Array<{
    driver: any;
    deliveredCount: number;
    bottles: number;
    cash: number;
    transfer: number;
    credit: number;
    total: number;
  }>;
}

/**
 * Genera un archivo Excel profesional enriquecido con estilos visuales, colores de marca,
 * KPIs ejecutivos y tablas detalladas con soporte 100% nativo para Excel en Mac y Windows.
 */
export function exportStyledExcel(data: ReportData) {
  const {
    todayStr,
    deliveredOrders,
    totalBottles,
    totalCashCollected,
    totalTransferCollected,
    totalCreditCollected,
    grandTotal,
    driverBreakdown,
  } = data;

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Cierre_Diario_AguaYA</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        .header-title { background-color: #0f172a; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; height: 38px; vertical-align: middle; }
        .header-subtitle { background-color: #1e293b; color: #38bdf8; font-size: 10pt; font-weight: bold; text-align: center; height: 24px; vertical-align: middle; }
        
        .kpi-title { font-size: 8.5pt; font-weight: bold; text-align: center; vertical-align: middle; }
        .kpi-value { font-size: 13pt; font-weight: bold; text-align: center; vertical-align: middle; }
        
        .kpi-cash-title { background-color: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .kpi-cash-val { background-color: #ecfdf5; color: #047857; border: 1px solid #10b981; }
        
        .kpi-transfer-title { background-color: #ede9fe; color: #5b21b6; border: 1px solid #8b5cf6; }
        .kpi-transfer-val { background-color: #f5f3ff; color: #6d28d9; border: 1px solid #8b5cf6; }
        
        .kpi-credit-title { background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .kpi-credit-val { background-color: #fffbeb; color: #b45309; border: 1px solid #f59e0b; }
        
        .kpi-bottles-title { background-color: #e0f2fe; color: #075985; border: 1px solid #0ea5e9; }
        .kpi-bottles-val { background-color: #f0f9ff; color: #0369a1; border: 1px solid #0ea5e9; }
        
        .section-header { background-color: #0284c7; color: #ffffff; font-size: 11pt; font-weight: bold; text-align: left; height: 28px; vertical-align: middle; padding-left: 8px; }
        
        .th-main { background-color: #334155; color: #ffffff; font-size: 9.5pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #64748b; height: 26px; }
        .td-cell { font-size: 9.5pt; vertical-align: middle; border: 1px solid #cbd5e1; padding: 4px 6px; }
        .td-center { text-align: center; }
        .td-right { text-align: right; }
        .td-bold { font-weight: bold; }
        
        .td-remision { background-color: #eff6ff; color: #1e40af; font-weight: bold; border: 1px solid #93c5fd; text-align: center; }
        .td-address { color: #0f172a; font-weight: bold; }
        .td-money { font-weight: bold; color: #047857; }
        
        .tr-zebra { background-color: #f8fafc; }
        .tfoot-total { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10.5pt; border: 1px solid #0f172a; }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- Encabezado Institucional -->
        <tr>
          <td colspan="12" class="header-title">💧 AGUA YA — INFORME EJECUTIVO DE CIERRE DE CAJA & LIQUIDACIÓN</td>
        </tr>
        <tr>
          <td colspan="12" class="header-subtitle">Fecha de Liquidación: ${todayStr} | Control Operativo y Financiero</td>
        </tr>
        <tr><td colspan="12" height="15"></td></tr>

        <!-- Tarjetas de Balance / KPIs -->
        <tr>
          <td colspan="3" class="kpi-title kpi-cash-title">💵 EFECTIVO EN MANO (ENTREGAR)</td>
          <td colspan="3" class="kpi-title kpi-transfer-title">📲 NEQUI / TRANSFERENCIAS</td>
          <td colspan="3" class="kpi-title kpi-credit-title">📝 A CRÉDITO (CARTERA)</td>
          <td colspan="3" class="kpi-title kpi-bottles-title">💧 BOTELLONES ENTREGADOS</td>
        </tr>
        <tr>
          <td colspan="3" class="kpi-value kpi-cash-val">$${totalCashCollected.toLocaleString('es-CO')} COP</td>
          <td colspan="3" class="kpi-value kpi-transfer-val">$${totalTransferCollected.toLocaleString('es-CO')} COP</td>
          <td colspan="3" class="kpi-value kpi-credit-val">$${totalCreditCollected.toLocaleString('es-CO')} COP</td>
          <td colspan="3" class="kpi-value kpi-bottles-val">${totalBottles} Unidades</td>
        </tr>
        <tr><td colspan="12" height="20"></td></tr>

        <!-- Tabla 1: Liquidación por Repartidor -->
        <tr>
          <td colspan="12" class="section-header">🚚 1. LIQUIDACIÓN INDIVIDUAL POR REPARTIDOR</td>
        </tr>
        <tr>
          <td colspan="3" class="th-main">Repartidor</td>
          <td class="th-main">Entregas</td>
          <td class="th-main">Botellones</td>
          <td colspan="2" class="th-main">Efectivo Físico</td>
          <td colspan="2" class="th-main">Nequi / Bancos</td>
          <td colspan="2" class="th-main">A Crédito</td>
          <td class="th-main">Total Facturado</td>
        </tr>
        ${driverBreakdown
          .map(
            (item, index) => `
          <tr class="${index % 2 === 1 ? 'tr-zebra' : ''}">
            <td colspan="3" class="td-cell td-bold">🚚 ${item.driver.nombre}</td>
            <td class="td-cell td-center td-bold">${item.deliveredCount}</td>
            <td class="td-cell td-center td-bold" style="color: #0284c7;">${item.bottles}</td>
            <td colspan="2" class="td-cell td-right td-bold" style="color: #059669;">$${item.cash.toLocaleString('es-CO')}</td>
            <td colspan="2" class="td-cell td-right td-bold" style="color: #7c3aed;">$${item.transfer.toLocaleString('es-CO')}</td>
            <td colspan="2" class="td-cell td-right td-bold" style="color: #d97706;">$${item.credit.toLocaleString('es-CO')}</td>
            <td class="td-cell td-right td-bold" style="color: #0f172a;">$${item.total.toLocaleString('es-CO')}</td>
          </tr>
        `
          )
          .join('')}
        <tr>
          <td colspan="3" class="td-cell tfoot-total">TOTALES GENERALES</td>
          <td class="td-cell tfoot-total td-center">${deliveredOrders.length}</td>
          <td class="td-cell tfoot-total td-center" style="color: #38bdf8;">${totalBottles}</td>
          <td colspan="2" class="td-cell tfoot-total td-right" style="color: #4ade80;">$${totalCashCollected.toLocaleString('es-CO')}</td>
          <td colspan="2" class="td-cell tfoot-total td-right" style="color: #c084fc;">$${totalTransferCollected.toLocaleString('es-CO')}</td>
          <td colspan="2" class="td-cell tfoot-total td-right" style="color: #fde047;">$${totalCreditCollected.toLocaleString('es-CO')}</td>
          <td class="td-cell tfoot-total td-right" style="color: #ffffff;">$${grandTotal.toLocaleString('es-CO')}</td>
        </tr>
        <tr><td colspan="12" height="25"></td></tr>

        <!-- Tabla 2: Detalle Cronológico de Entregas -->
        <tr>
          <td colspan="13" class="section-header">📍 2. DETALLE DE ENTREGAS (DIRECCIONES & CONTROL DE REMISIONES)</td>
        </tr>
        <tr>
          <td class="th-main">Pedido #</td>
          <td class="th-main">Nº Remisión</td>
          <td class="th-main">Registrado Por</td>
          <td colspan="2" class="th-main">Dirección Exacta (Prioridad)</td>
          <td class="th-main">Barrio</td>
          <td class="th-main">Cliente</td>
          <td class="th-main">Teléfono</td>
          <td class="th-main">Repartidor</td>
          <td class="th-main">Productos Entregados</td>
          <td class="th-main">Método Pago</td>
          <td class="th-main">Total ($)</td>
          <td class="th-main">Hora Entrega</td>
        </tr>
        ${deliveredOrders
          .map(
            (o, index) => `
          <tr class="${index % 2 === 1 ? 'tr-zebra' : ''}">
            <td class="td-cell td-center td-bold">#${o.numeroPedido || o.id}</td>
            <td class="td-cell td-remision">${o.numeroRemision ? 'REM: ' + o.numeroRemision : 'Sin Remisión'}</td>
            <td class="td-cell td-bold" style="color: #475569;">👤 ${o.creadoPor || 'Oficina'}</td>
            <td colspan="2" class="td-cell td-address">📍 ${o.cliente?.direccion || 'N/A'}</td>
            <td class="td-cell">${o.cliente?.barrioSector || '-'}</td>
            <td class="td-cell td-bold">${o.cliente?.nombre || 'Cliente General'}</td>
            <td class="td-cell">${o.cliente?.telefono || '-'}</td>
            <td class="td-cell">${o.repartidor?.nombre || 'Sin Asignar'}</td>
            <td class="td-cell td-bold" style="color: #0284c7; font-size: 8.5pt;">${o.resumenProductos || (o.items && o.items.length > 0 ? o.items.map((i: any) => `${i.cantidad}x ${i.nombreProducto}`).join(', ') : `${o.cantidadBotellones} Botellón(es)`)}</td>
            <td class="td-cell td-center td-bold" style="${
              o.metodoPago === 'EFECTIVO'
                ? 'background-color: #d1fae5; color: #065f46;'
                : o.metodoPago === 'CREDITO'
                ? 'background-color: #fef3c7; color: #92400e;'
                : 'background-color: #ede9fe; color: #5b21b6;'
            }">${o.metodoPago === 'CREDITO' ? 'A CRÉDITO' : o.metodoPago}</td>
            <td class="td-cell td-right td-money">$${o.montoTotal?.toLocaleString('es-CO')}</td>
            <td class="td-cell td-center">${o.fechaEntrega ? new Date(o.fechaEntrega).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          </tr>
        `
          )
          .join('')}
        
        <tr><td colspan="12" height="35"></td></tr>

        <!-- Firmas de Auditoría -->
        <tr>
          <td colspan="5" style="border-top: 2px solid #334155; text-align: center; font-weight: bold; font-size: 9.5pt; padding-top: 5px;">
            Firma Repartidor / Responsable Entrega
          </td>
          <td colspan="2"></td>
          <td colspan="5" style="border-top: 2px solid #334155; text-align: center; font-weight: bold; font-size: 9.5pt; padding-top: 5px;">
            Firma Administración / Cuadre de Caja
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Reporte_Liquidacion_Agua_YA_${new Date().toISOString().split('T')[0]}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
