import React, { useState } from 'react';
import { X, Printer, DollarSign, Truck, FileSpreadsheet, Lock, CheckCircle2, AlertTriangle, RefreshCw, Package, Moon } from 'lucide-react';
import { exportStyledExcel } from '@/lib/excelExport';

interface DailyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  drivers: any[];
  onRefreshOrders?: () => void;
}

export function DailyClosureModal({
  isOpen,
  onClose,
  orders,
  drivers,
  onRefreshOrders,
}: DailyClosureModalProps) {
  const [isClosingDaily, setIsClosingDaily] = useState(false);
  const [closureMessage, setClosureMessage] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveredOrders = orders.filter((o) => o.estadoEntrega === 'ENTREGADO');
  const scheduledTomorrowOrders = orders.filter((o) => o.estadoEntrega === 'PROGRAMADO_MANANA');
  const scheduledTomorrowCount = scheduledTomorrowOrders.length;
  const scheduledTomorrowBottles = scheduledTomorrowOrders.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0);

  // Overall totals (Strictly based on delivered orders)
  const totalBottles = deliveredOrders.reduce((sum, o) => sum + o.cantidadBotellones, 0);
  const totalCashCollected = deliveredOrders
    .filter((o) => o.metodoPago === 'EFECTIVO')
    .reduce((sum, o) => sum + o.montoTotal, 0);
  const totalTransferCollected = deliveredOrders
    .filter((o) => o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA' || o.metodoPago === 'PAGOMOVIL')
    .reduce((sum, o) => sum + o.montoTotal, 0);
  const totalCreditCollected = deliveredOrders
    .filter((o) => o.metodoPago === 'CREDITO')
    .reduce((sum, o) => sum + o.montoTotal, 0);
  const grandTotal = totalCashCollected + totalTransferCollected + totalCreditCollected;

  // Product itemization aggregation for physical inventory count
  const productAggregation: Record<
    string,
    { nombre: string; categoria: string; cantidad: number; total: number }
  > = {};

  deliveredOrders.forEach((order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const key = item.nombreProducto || 'BOTELLON (20L)';
        if (!productAggregation[key]) {
          productAggregation[key] = {
            nombre: key,
            categoria: item.producto?.categoria || 'GENERAL',
            cantidad: 0,
            total: 0,
          };
        }
        productAggregation[key].cantidad += item.cantidad;
        productAggregation[key].total += item.subtotal || item.cantidad * item.precioUnitario;
      });
    } else {
      const key = 'BOTELLON (20L)';
      if (!productAggregation[key]) {
        productAggregation[key] = {
          nombre: key,
          categoria: 'BOTELLONES',
          cantidad: 0,
          total: 0,
        };
      }
      productAggregation[key].cantidad += order.cantidadBotellones || 1;
      productAggregation[key].total += order.montoTotal || 0;
    }
  });

  const productList = Object.values(productAggregation).sort((a, b) => b.cantidad - a.cantidad);
  const totalItemsCount = productList.reduce((sum, p) => sum + p.cantidad, 0);

  // Breakdown per driver
  const driverBreakdown = drivers.map((driver) => {
    const driverDelivered = deliveredOrders.filter((o) => o.repartidorId === driver.id);
    const bottles = driverDelivered.reduce((sum, o) => sum + o.cantidadBotellones, 0);
    const cash = driverDelivered
      .filter((o) => o.metodoPago === 'EFECTIVO')
      .reduce((sum, o) => sum + o.montoTotal, 0);
    const transfer = driverDelivered
      .filter((o) => o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA' || o.metodoPago === 'PAGOMOVIL')
      .reduce((sum, o) => sum + o.montoTotal, 0);
    const credit = driverDelivered
      .filter((o) => o.metodoPago === 'CREDITO')
      .reduce((sum, o) => sum + o.montoTotal, 0);

    return {
      driver,
      deliveredCount: driverDelivered.length,
      bottles,
      cash,
      transfer,
      credit,
      total: cash + transfer + credit,
    };
  });

  // Export Professional Styled Excel function
  const handleExportExcel = () => {
    if (!deliveredOrders || deliveredOrders.length === 0) {
      alert('No hay pedidos entregados para exportar en este momento.');
      return;
    }

    exportStyledExcel({
      todayStr,
      deliveredOrders,
      drivers,
      totalBottles,
      totalCashCollected,
      totalTransferCollected,
      totalCreditCollected,
      grandTotal,
      driverBreakdown,
      scheduledTomorrowOrders,
      scheduledTomorrowCount,
      scheduledTomorrowBottles,
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Ejecutar Cierre Definitivo de Caja (Archiva los pedidos entregados)
  const handleExecuteDailyClose = async () => {
    setIsClosingDaily(true);
    try {
      const res = await fetch('/api/orders/daily-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Error al ejecutar el cierre');
      }

      const data = await res.json();
      setClosureMessage(`✅ ${data.message}`);
      setShowConfirmClose(false);

      if (onRefreshOrders) {
        onRefreshOrders();
      }

      setTimeout(() => {
        setClosureMessage(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      alert(`Error al ejecutar cierre: ${err.message}`);
    } finally {
      setIsClosingDaily(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans print-report-modal">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-8 print-report-card">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between print:bg-white print:text-black print:p-0 print:border-b-2 print:border-slate-800 print:pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30 text-emerald-400 print:hidden">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white print:text-sky-800">💧 AGUA YA</span>
                <span className="text-xs bg-sky-500/20 text-sky-300 print:text-sky-900 px-2 py-0.5 rounded font-bold">INFORME DE CAJA</span>
              </div>
              <h2 className="font-black text-lg tracking-tight print:text-xl print:text-slate-900">Cierre de Caja & Liquidación Diaria</h2>
              <p className="text-xs text-slate-300 print:text-slate-600 font-semibold capitalize">{todayStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span> (.XLSX)
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
              title="Archivar entregas del día y limpiar despacho para mañana"
            >
              <Lock className="w-4 h-4" />
              <span>Cierre Definitivo</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal de Confirmación de Cierre Definitivo */}
        {showConfirmClose && (
          <div className="bg-amber-50 border-b border-amber-200 p-5 animate-in fade-in print:hidden">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-200 text-amber-900 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 text-sm">¿Deseas ejecutar el Cierre Definitivo de Caja?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Esta acción archivará los <strong>{deliveredOrders.length} pedidos entregados</strong> del día. La pantalla de despacho quedará completamente limpia con 0 pedidos para iniciar las operaciones de la siguiente jornada.
                </p>
                <div className="flex items-center gap-2.5 mt-3">
                  <button
                    onClick={handleExecuteDailyClose}
                    disabled={isClosingDaily}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isClosingDaily ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Archivando y Limpiando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sí, Confirmar Cierre Diario</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirmClose(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner de Éxito al Cerrar */}
        {closureMessage && (
          <div className="bg-emerald-600 text-white p-4 font-black text-center text-xs animate-in fade-in print:hidden">
            {closureMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Informative Banner: Pedidos Programados para Mañana */}
          {scheduledTomorrowCount > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 p-4 rounded-2xl flex items-center justify-between avoid-page-break print:border-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl shrink-0 print:hidden">
                  <Moon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-indigo-950">
                    🌙 {scheduledTomorrowCount} Pedido(s) en Cola para Mañana (8:00 AM)
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5 font-medium">
                    Total de <strong>{scheduledTomorrowBottles} botellones</strong> reprogramados. No se suman a la caja de hoy y se activarán automáticamente para la siguiente jornada.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-indigo-600 text-white px-3 py-1.5 rounded-xl shrink-0 print:bg-slate-200 print:text-black">
                {scheduledTomorrowCount} en Cola
              </span>
            </div>
          )}

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 avoid-page-break">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 print:bg-white print:border-slate-300">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Botellones Entregados</span>
              <span className="text-2xl sm:text-3xl font-black text-sky-700 block mt-1">
                {totalBottles} <span className="text-sm font-semibold text-slate-400">unid.</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{deliveredOrders.length} entregas totales</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 print:bg-white print:border-slate-300">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Recaudo Efectivo</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-1">
                ${totalCashCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">En caja física</span>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 print:bg-white print:border-slate-300">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Nequi / Bancos</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-700 block mt-1">
                ${totalTransferCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">Transferencias</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 print:bg-white print:border-slate-300">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">A Crédito (Por Cobrar)</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 block mt-1">
                ${totalCreditCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Cuentas por cobrar</span>
            </div>
          </div>

          {/* Gran Total Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-5 rounded-2xl flex items-center justify-between border border-sky-900/50 print:bg-slate-100 print:text-slate-900 print:border-slate-300 avoid-page-break">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-300 print:text-slate-700 block">
                Total Consolidado Facturado
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 print:text-slate-900">
                ${grandTotal.toLocaleString('es-CO')} COP
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-300 print:text-slate-600 block">Total en Caja (Efectivo + Banco):</span>
              <span className="text-lg font-black text-white print:text-emerald-700">
                ${(totalCashCollected + totalTransferCollected).toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Conteo y Consolidado Físico por Producto */}
          <div className="space-y-3 avoid-page-break">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 print:text-black">
              <Package className="w-4 h-4 text-sky-600 print:hidden" />
              <span>Conteo Físico y Consolidado de Productos Vendidos</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[11px] print:bg-slate-200">
                  <tr>
                    <th className="py-3 px-4">Producto / Presentación</th>
                    <th className="py-3 px-3 text-center">Categoría</th>
                    <th className="py-3 px-3 text-center">Unidades Entregadas</th>
                    <th className="py-3 px-4 text-right">Total Facturado ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {productList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 print:bg-white">
                      <td className="py-3 px-4 font-black text-slate-900">
                        {item.nombre}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {item.categoria}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-sky-700 text-sm">
                        {item.cantidad} <span className="text-xs font-semibold text-slate-400">unid.</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ${item.total.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black print:bg-slate-100 print:text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3 px-4">TOTAL DE PRODUCTOS DESPACHADOS</td>
                    <td className="py-3 px-3 text-center text-sky-300 print:text-slate-900 text-sm">{totalItemsCount} unid.</td>
                    <td className="py-3 px-4 text-right text-emerald-400 print:text-slate-900">${grandTotal.toLocaleString('es-CO')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Desglose por Repartidor */}
          <div className="space-y-3 avoid-page-break">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 print:text-black">
              <Truck className="w-4 h-4 text-sky-600 print:hidden" />
              <span>Liquidación Detallada por Repartidor</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs print:border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[11px] print:bg-slate-200">
                  <tr>
                    <th className="py-3 px-4">Repartidor</th>
                    <th className="py-3 px-3 text-center">Botellones</th>
                    <th className="py-3 px-3 text-right">Efectivo ($)</th>
                    <th className="py-3 px-3 text-right">A Crédito ($)</th>
                    <th className="py-3 px-3 text-right">Transferencia ($)</th>
                    <th className="py-3 px-4 text-right">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {driverBreakdown.map((row) => (
                    <tr key={row.driver.id} className="hover:bg-slate-50 print:bg-white">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {row.driver.nombre}
                        <span className="block text-[10px] text-slate-400 font-semibold print:text-slate-500">
                          {row.deliveredCount} pedidos entregados
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-sky-700">
                        {row.bottles} unid.
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                        ${row.cash.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-amber-700">
                        ${row.credit.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-purple-700">
                        ${row.transfer.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        ${row.total.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black print:bg-slate-100 print:text-slate-900">
                  <tr>
                    <td className="py-3 px-4">TOTALES</td>
                    <td className="py-3 px-3 text-center text-sky-300 print:text-slate-900">{totalBottles} unid.</td>
                    <td className="py-3 px-3 text-right text-emerald-400 print:text-slate-900">${totalCashCollected.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-3 text-right text-amber-400 print:text-slate-900">${totalCreditCollected.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-3 text-right text-purple-300 print:text-slate-900">${totalTransferCollected.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-4 text-right text-white print:text-slate-900 text-sm">${grandTotal.toLocaleString('es-CO')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Firmas de Auditoría (Exclusivo para Impresión y PDF) */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-12 mt-6 border-t-2 border-slate-300 signature-block avoid-page-break">
            <div className="text-center space-y-1">
              <div className="border-b-2 border-slate-900 w-3/4 mx-auto pb-8"></div>
              <p className="font-extrabold text-xs text-slate-900">Firma del Repartidor / Responsable</p>
              <p className="text-[10px] text-slate-500">C.C. ___________________</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-b-2 border-slate-900 w-3/4 mx-auto pb-8"></div>
              <p className="font-extrabold text-xs text-slate-900">Firma Administración / Tesorería</p>
              <p className="text-[10px] text-slate-500">Recibido y Verificado en Caja</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            Agua YA &copy; Sistema de Gestión de Entregas
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ejecutar Cierre Diario</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
