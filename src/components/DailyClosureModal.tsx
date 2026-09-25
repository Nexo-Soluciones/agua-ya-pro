import React from 'react';
import { X, Printer, DollarSign, Truck, FileSpreadsheet } from 'lucide-react';
import { exportStyledExcel } from '@/lib/excelExport';

interface DailyClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  drivers: any[];
}

export function DailyClosureModal({
  isOpen,
  onClose,
  orders,
  drivers,
}: DailyClosureModalProps) {
  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliveredOrders = orders.filter((o) => o.estadoEntrega === 'ENTREGADO');

  // Overall totals
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
    });
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-8 print:shadow-none print:border-none print:m-0 print:max-w-none print:rounded-none">
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
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Informe Excel (.XLSX)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl shadow-md shadow-sky-600/20 transition flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF Membretado</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                💵 Efectivo en Mano
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 block mt-1">
                ${totalCashCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                Físico a entregar
              </span>
            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                📲 Nequi / Transf.
              </span>
              <span className="text-2xl sm:text-3xl font-black text-purple-700 block mt-1">
                ${totalTransferCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-purple-600 font-medium mt-0.5 block">
                Cuentas bancarias
              </span>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                📝 A Crédito (Cartera)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 block mt-1">
                ${totalCreditCollected.toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
                Pendiente de cobro
              </span>
            </div>

            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider block">
                💧 Botellones
              </span>
              <span className="text-2xl sm:text-3xl font-black text-sky-900 block mt-1">
                {totalBottles}
              </span>
              <span className="text-[11px] text-sky-700 font-medium mt-0.5 block">
                En {deliveredOrders.length} entregas
              </span>
            </div>
          </div>

          {/* Liquidación por Repartidor */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-600" />
              <span>Liquidación por Repartidor (Subtotales y Totales)</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sm:text-[11px] border-b border-slate-200">
                    <th className="p-3">Repartidor</th>
                    <th className="p-3 text-center">Entregas</th>
                    <th className="p-3 text-center">Botellones</th>
                    <th className="p-3 text-right">Efectivo</th>
                    <th className="p-3 text-right">Nequi/Transf</th>
                    <th className="p-3 text-right">A Crédito</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {driverBreakdown.map((item) => (
                    <tr key={item.driver.id} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                        <span>🚚</span>
                        <span>{item.driver.nombre}</span>
                      </td>
                      <td className="p-3 text-center font-bold">{item.deliveredCount}</td>
                      <td className="p-3 text-center font-bold text-sky-700">{item.bottles}</td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        ${item.cash.toLocaleString('es-CO')}
                      </td>
                      <td className="p-3 text-right font-bold text-purple-700">
                        ${item.transfer.toLocaleString('es-CO')}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700">
                        ${item.credit.toLocaleString('es-CO')}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        ${item.total.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-xs sm:text-sm">
                    <td className="p-3">TOTAL GENERAL</td>
                    <td className="p-3 text-center">{deliveredOrders.length}</td>
                    <td className="p-3 text-center text-sky-300">{totalBottles}</td>
                    <td className="p-3 text-right text-emerald-400">
                      ${totalCashCollected.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3 text-right text-purple-300">
                      ${totalTransferCollected.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3 text-right text-amber-300">
                      ${totalCreditCollected.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3 text-right text-white font-black">
                      ${grandTotal.toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* List of Delivered Orders with Highlighted Address and Remisión */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Detalle de Entregas Realizadas ({deliveredOrders.length})
              </h4>
              <span className="text-[11px] text-slate-500 font-semibold">
                Ordenado con Dirección Prioritaria y Control de Remisiones
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {deliveredOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium text-xs">
                  No hay entregas completadas registradas el día de hoy.
                </div>
              ) : (
                deliveredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    {/* Priority: Dirección & Cliente */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          Pedido #{order.numeroPedido}
                        </span>

                        <span
                          className={`font-black px-2.5 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                            order.numeroRemision
                              ? 'text-blue-900 bg-blue-100 border border-blue-300'
                              : 'text-amber-800 bg-amber-100 border border-amber-300'
                          }`}
                        >
                          <span>📄 Remisión:</span>
                          <span className="font-extrabold">{order.numeroRemision || 'S/N (Sin registrar)'}</span>
                        </span>

                        <span className="text-slate-500 text-[11px] font-semibold">
                          Repartidor: <strong className="text-slate-800">{order.repartidor?.nombre || 'Sin asignar'}</strong>
                        </span>
                      </div>

                      {/* Dirección en grande / destacada */}
                      <div className="flex items-start gap-1.5 pt-0.5">
                        <span className="text-rose-500 font-bold text-sm">📍</span>
                        <div>
                          <p className="text-slate-950 font-black text-sm tracking-tight">
                            {order.cliente.direccion}
                            {order.cliente.barrioSector ? ` — Barrio ${order.cliente.barrioSector}` : ''}
                          </p>
                          <p className="text-slate-600 font-semibold text-xs">
                            Cliente: {order.cliente.nombre} • 📞 {order.cliente.telefono}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botellones, Método de pago, Subtotal */}
                    <div className="flex items-center gap-3 self-end md:self-center font-bold text-slate-800 shrink-0">
                      <span className="bg-sky-100 text-sky-900 px-2.5 py-1 rounded-lg font-black text-xs">
                        💧 {order.cantidadBotellones} Bot.
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                          order.metodoPago === 'EFECTIVO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : order.metodoPago === 'CREDITO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {order.metodoPago === 'EFECTIVO'
                          ? '💵 Efectivo'
                          : order.metodoPago === 'CREDITO'
                          ? '📝 A Crédito'
                          : order.metodoPago === 'NEQUI'
                          ? '📲 Nequi'
                          : '🏦 Transferencia'}
                      </span>

                      <span className="text-sm font-black text-slate-950 bg-slate-100 px-3 py-1 rounded-lg">
                        ${order.montoTotal.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Firmas de Auditoría (Exclusivo para Impresión y PDF) */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-16 mt-8 border-t border-slate-300">
            <div className="text-center space-y-1">
              <div className="border-b-2 border-slate-900 w-3/4 mx-auto pb-8"></div>
              <p className="font-extrabold text-sm text-slate-900">Firma del Repartidor / Responsable</p>
              <p className="text-xs text-slate-500">C.C. ___________________</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-b-2 border-slate-900 w-3/4 mx-auto pb-8"></div>
              <p className="font-extrabold text-sm text-slate-900">Firma Administración / Tesorería</p>
              <p className="text-xs text-slate-500">Recibido y Verificado en Caja</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500 font-medium">
            Agua YA &copy; Sistema de Gestión de Entregas
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
          >
            Cerrar Cierre de Caja
          </button>
        </div>
      </div>
    </div>
  );
}
