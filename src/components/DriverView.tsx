'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Phone,
  Navigation,
  MapPin,
  Clock,
  DollarSign,
  CreditCard,
  X,
  AlertCircle,
  Check,
  Droplet,
  FileText,
  Bookmark,
  ChevronRight,
} from 'lucide-react';

interface DriverViewProps {
  driver: { id: number; nombre: string; telefono: string };
  orders: any[];
  onUpdateOrder: (
    orderId: number,
    data: {
      estadoEntrega?: string;
      metodoPago?: string;
      estadoPago?: string;
      comprobanteRef?: string;
      numeroRemision?: string;
      notasEntrega?: string;
    }
  ) => Promise<void>;
}

export function DriverView({ driver, orders, onUpdateOrder }: DriverViewProps) {
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<any | null>(null);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'NEQUI' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO');
  const [comprobanteRef, setComprobanteRef] = useState('');
  const [numeroRemision, setNumeroRemision] = useState('');
  const [notasEntrega, setNotasEntrega] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDIENTES' | 'ENTREGADOS'>('PENDIENTES');

  // Filter orders assigned to this driver
  const driverOrders = orders.filter((o) => o.repartidorId === driver.id);

  // Sort active orders in chronological arrival order (oldest first = #1, #2, #3...)
  const activeOrders = driverOrders
    .filter((o) => o.estadoEntrega === 'PENDIENTE' || o.estadoEntrega === 'EN_CAMINO')
    .sort((a, b) => new Date(a.fechaCreacion || a.createdAt).getTime() - new Date(b.fechaCreacion || b.createdAt).getTime());

  const completedToday = driverOrders
    .filter((o) => o.estadoEntrega === 'ENTREGADO')
    .sort((a, b) => new Date(b.updatedAt || b.fechaEntrega || 0).getTime() - new Date(a.updatedAt || a.fechaEntrega || 0).getTime());

  const cashCollectedToday = completedToday
    .filter((o) => o.metodoPago === 'EFECTIVO')
    .reduce((sum, o) => sum + o.montoTotal, 0);

  const creditTotalToday = completedToday
    .filter((o) => o.metodoPago === 'CREDITO')
    .reduce((sum, o) => sum + o.montoTotal, 0);

  const transferTotalToday = completedToday
    .filter((o) => o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA')
    .reduce((sum, o) => sum + o.montoTotal, 0);

  const totalBottlesDelivered = completedToday.reduce(
    (sum, o) => sum + o.cantidadBotellones,
    0
  );

  // SILENT BACKGROUND GPS LOCATION TRANSMITTER
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const sendGpsUpdateSilently = (position: GeolocationPosition) => {
      const { latitude, longitude, speed, heading } = position.coords;

      fetch(`/api/drivers/${driver.id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          heading: heading || 0,
        }),
      }).catch(() => {
        // 100% silent
      });
    };

    navigator.geolocation.getCurrentPosition(sendGpsUpdateSilently, () => {}, {
      enableHighAccuracy: true,
    });

    const watchId = navigator.geolocation.watchPosition(sendGpsUpdateSilently, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 8000,
      timeout: 12000,
    });

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendGpsUpdateSilently, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 8000,
      });
    }, 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [driver.id]);

  const openDeliveryModal = (order: any) => {
    setSelectedOrderForDelivery(order);
    setMetodoPago((order.metodoPago as any) || 'EFECTIVO');
    setComprobanteRef(order.comprobanteRef || '');
    setNumeroRemision(order.numeroRemision || '');
    setNotasEntrega('');
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDelivery) return;

    setIsSubmitting(true);
    try {
      await onUpdateOrder(selectedOrderForDelivery.id, {
        estadoEntrega: 'ENTREGADO',
        metodoPago,
        estadoPago: metodoPago === 'EFECTIVO' ? 'VERIFICADO' : metodoPago === 'CREDITO' ? 'PENDIENTE' : 'PENDIENTE',
        comprobanteRef: metodoPago === 'NEQUI' || metodoPago === 'TRANSFERENCIA' ? comprobanteRef : undefined,
        numeroRemision: numeroRemision.trim() || undefined,
        notasEntrega,
      });
      setSelectedOrderForDelivery(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date().getTime();

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 font-sans">
      {/* Driver Identity Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-800 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between border border-emerald-400/30">
        <div className="flex items-center gap-3.5">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/30">
                Repartidor Activo
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{driver.nombre}</h2>
            <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">{driver.telefono}</p>
          </div>
        </div>

        <div className="text-right bg-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
          <span className="text-2xl sm:text-3xl font-black text-white">{activeOrders.length}</span>
          <span className="text-[10px] text-emerald-100 uppercase font-black block">Por Repartir</span>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-mac p-3.5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Entregados</span>
          <span className="text-xl sm:text-2xl font-black text-sky-600">{completedToday.length}</span>
          <span className="text-[10px] text-slate-600 font-medium block">({totalBottlesDelivered} bot.)</span>
        </div>

        <div className="glass-mac p-3.5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Efectivo</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700">${cashCollectedToday.toLocaleString('es-CO')}</span>
          <span className="text-[10px] text-slate-600 font-medium block">a entregar</span>
        </div>

        <div className="glass-mac p-3.5 rounded-2xl text-center">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Crédito / Transf</span>
          <span className="text-xl sm:text-2xl font-black text-purple-700">${(creditTotalToday + transferTotalToday).toLocaleString('es-CO')}</span>
          <span className="text-[10px] text-slate-600 font-medium block">digital</span>
        </div>
      </div>

      {/* Navigation Tabs between Active Deliveries and Completed */}
      <div className="flex rounded-2xl p-1.5 bg-slate-900/90 border border-sky-400/30 shadow-md">
        <button
          onClick={() => setActiveTab('PENDIENTES')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === 'PENDIENTES'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Por Repartir ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ENTREGADOS')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ENTREGADOS'
              ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-sky-200" />
          <span>Ya Entregadas ({completedToday.length})</span>
        </button>
      </div>

      {/* ACTIVE ORDERS TAB (VERDE Y ROJO EN ORDEN DE LLEGADA) */}
      {activeTab === 'PENDIENTES' && (
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="glass-mac rounded-3xl p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-black text-slate-800 text-lg">¡Al día! No tienes entregas pendientes</p>
              <p className="text-xs sm:text-sm text-slate-500">
                Espera a que el despacho central asigne nuevos pedidos a tu turno.
              </p>
            </div>
          ) : (
            activeOrders.map((order, index) => {
              const minsInRoute =
                order.estadoEntrega === 'EN_CAMINO' && order.updatedAt
                  ? Math.floor((now - new Date(order.updatedAt).getTime()) / 60000)
                  : 0;

              const isDelayed = minsInRoute >= 20;

              // Visual Semáforo:
              // 🔴 RED: Delayed order (>20m)
              // 🟢 GREEN: Active assigned order
              return (
                <div
                  key={order.id}
                  className={`rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden ${
                    isDelayed
                      ? 'bg-rose-50/95 border-2 border-rose-500 shadow-rose-500/20 ring-4 ring-rose-300/30'
                      : 'bg-emerald-50/95 border-2 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-300/30'
                  }`}
                >
                  {/* Color Banner Indicator */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-2.5 ${
                      isDelayed ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
                    }`}
                  />

                  {/* Header info: Numeración Secuencial en Orden de Llegada */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-black text-white shadow-sm flex items-center gap-1 ${
                          isDelayed ? 'bg-rose-600' : 'bg-emerald-700'
                        }`}
                      >
                        <span>TURNO #{index + 1}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Pedido #{order.numeroPedido}
                      </span>
                      {order.numeroRemision && (
                        <span className="text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>📄 Rem:</span>
                          <span>{order.numeroRemision}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isDelayed ? (
                        <span className="text-[11px] bg-rose-600 text-white font-black px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>RETRASADO ({minsInRoute} min)</span>
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-black uppercase ${
                            order.estadoEntrega === 'EN_CAMINO'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {order.estadoEntrega === 'EN_CAMINO' ? '🚚 En Camino' : '⏳ Por Despachar'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Client Name & Phone (if provided) */}
                  {order.cliente.nombre ? (
                    <div className="mt-3">
                      <h4 className="text-xl font-black text-slate-900 leading-tight">
                        {order.cliente.nombre}
                      </h4>
                      {order.cliente.telefono && !order.cliente.telefono.startsWith('310000') && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <a
                            href={`tel:${order.cliente.telefono}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-100/90 hover:bg-sky-200 px-3 py-1.5 rounded-xl border border-sky-300 transition shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-sky-700" />
                            <span>Llamar al Cliente ({order.cliente.telefono})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : order.cliente.telefono && !order.cliente.telefono.startsWith('310000') ? (
                    <div className="mt-2">
                      <a
                        href={`tel:${order.cliente.telefono}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-100/90 hover:bg-sky-200 px-3 py-1.5 rounded-xl border border-sky-300 transition shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-sky-700" />
                        <span>📞 Llamar al Teléfono ({order.cliente.telefono})</span>
                      </a>
                    </div>
                  ) : null}

                  {/* Address & GPS Navigation (Highlighted Priority) */}
                  <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 mt-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dirección de Entrega:</p>
                        <p className="font-black text-slate-900 text-base leading-snug">
                          {order.cliente.direccion}
                        </p>
                        {order.cliente.barrioSector && (
                          <p className="text-xs font-extrabold text-slate-700 mt-0.5">
                            Sector/Barrio: <span className="text-sky-700">{order.cliente.barrioSector}</span>
                          </p>
                        )}
                        {order.cliente.notasUbicacion && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium mt-1.5">
                            📌 {order.cliente.notasUbicacion}
                          </p>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${order.cliente.direccion}, ${order.cliente.barrioSector || ''}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span>Abrir GPS en Google Maps / Waze</span>
                    </a>
                  </div>

                  {/* Product & Payment Summary */}
                  <div className="flex items-center justify-between bg-white/90 p-3.5 rounded-2xl border border-slate-200 shadow-xs mt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
                        <Droplet className="w-5 h-5 fill-sky-500" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 text-base block">
                          {order.cantidadBotellones} Botellón{order.cantidadBotellones > 1 ? 'es' : ''} (20L)
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ${order.precioUnitario.toLocaleString('es-CO')} c/u
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto a Cobrar:</span>
                      <span className="text-xl font-black text-slate-900">
                        ${order.montoTotal.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5">
                    {order.estadoEntrega === 'PENDIENTE' ? (
                      <button
                        onClick={() =>
                          onUpdateOrder(order.id, {
                            estadoEntrega: 'EN_CAMINO',
                          })
                        }
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-2xl font-black text-base transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        <span>Iniciar Ruta (En Camino)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openDeliveryModal(order)}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-lg transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span>CONFIRMAR ENTREGA</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* COMPLETED DELIVERIES TAB (AZUL CORPORATIVO) */}
      {activeTab === 'ENTREGADOS' && (
        <div className="space-y-3.5">
          {completedToday.length === 0 ? (
            <div className="glass-mac rounded-3xl p-8 text-center text-slate-400 space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Aún no has completado entregas hoy</p>
              <p className="text-xs text-slate-500">
                Las entregas que finalices aparecerán registradas aquí en color azul.
              </p>
            </div>
          ) : (
            completedToday.map((order) => (
              <div
                key={order.id}
                className="bg-sky-50/95 border-2 border-sky-500/70 rounded-3xl p-4 shadow-md space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-blue-600 text-white">
                      Pedido #{order.numeroPedido}
                    </span>
                    {order.numeroRemision && (
                      <span className="text-[11px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md">
                        Remisión: {order.numeroRemision}
                      </span>
                    )}
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-blue-700" />
                    <span>ENTREGADO</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{order.cliente.nombre}</h4>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{order.cliente.direccion}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-sky-200/60">
                  <span className="font-bold text-slate-700">
                    {order.cantidadBotellones} Botellón{order.cantidadBotellones > 1 ? 'es' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      order.metodoPago === 'CREDITO'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                        : order.metodoPago === 'EFECTIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {order.metodoPago === 'CREDITO' ? '📝 A Crédito' : order.metodoPago === 'EFECTIVO' ? '💵 Efectivo' : '📲 Nequi/Transf'}
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      ${order.montoTotal.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delivery Finalization Modal */}
      {selectedOrderForDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-black text-lg">Finalizar Entrega</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForDelivery(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="p-5 space-y-4">
              {/* Order summary box */}
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-emerald-950 text-sm">
                <p className="font-black text-base">{selectedOrderForDelivery.cliente.nombre}</p>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  📍 {selectedOrderForDelivery.cliente.direccion}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/60 font-black">
                  <span>{selectedOrderForDelivery.cantidadBotellones} Botellones</span>
                  <span className="text-base text-emerald-900">
                    Total: ${selectedOrderForDelivery.montoTotal.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Forma de Pago (4 opciones: Efectivo, Nequi, Transferencia, A Crédito) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Forma de Pago del Cliente *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('EFECTIVO')}
                    className={`py-3 px-2 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      metodoPago === 'EFECTIVO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>💵 Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('NEQUI')}
                    className={`py-3 px-2 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      metodoPago === 'NEQUI'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>📲 Nequi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('TRANSFERENCIA')}
                    className={`py-3 px-2 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      metodoPago === 'TRANSFERENCIA'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>🏦 Transferencia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('CREDITO')}
                    className={`py-3 px-2 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                      metodoPago === 'CREDITO'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>📝 A Crédito</span>
                  </button>
                </div>
              </div>

              {/* Número de Remisión (Importantísimo para control interno) */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  <span>Número de Remisión / Control Interno</span>
                </label>
                <input
                  type="text"
                  value={numeroRemision}
                  onChange={(e) => setNumeroRemision(e.target.value)}
                  placeholder="Ej. REM-1042 o Nº de Talonario"
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-300 rounded-2xl focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none font-bold text-slate-900 bg-slate-50/50"
                />
              </div>

              {/* Comprobante / Ref si es electrónico */}
              {(metodoPago === 'NEQUI' || metodoPago === 'TRANSFERENCIA') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Comprobante / Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    required
                    value={comprobanteRef}
                    onChange={(e) => setComprobanteRef(e.target.value)}
                    placeholder="Ej. M123456 o # Referencia"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                  />
                </div>
              )}

              {/* Notas de Entrega */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notas de Entrega (Opcional)
                </label>
                <input
                  type="text"
                  value={notasEntrega}
                  onChange={(e) => setNotasEntrega(e.target.value)}
                  placeholder="Ej. Recibido por secretaria, pagará mañana"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition text-base disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? 'Guardando Entrega...' : 'COMPLETAR Y CERRAR PEDIDO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
