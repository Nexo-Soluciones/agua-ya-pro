'use client';

import React, { useState } from 'react';
import {
  Droplet,
  Plus,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  User,
  Phone,
  MapPin,
  Check,
  XCircle,
  Filter,
  CreditCard,
  Navigation,
  FileSpreadsheet,
  AlertCircle,
  UserPlus,
  Users,
  BarChart3,
  History,
  RotateCcw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DailyClosureModal } from './DailyClosureModal';
import { NewClientModal } from './NewClientModal';
import { ManageDriversModal } from './ManageDriversModal';
import { AuditLogsModal } from './AuditLogsModal';
import { HeroVideoBanner } from './HeroVideoBanner';

// Lazy loading diferido para mapas y gráficas con skeletons elegantes
const LiveDriverMap = dynamic(
  () => import('./LiveDriverMap').then((mod) => mod.LiveDriverMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-md animate-pulse flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-3">
          <Navigation className="w-6 h-6 text-sky-500 animate-spin" />
        </div>
        <p className="font-black text-slate-800 text-lg">Cargando Mapa GPS en Tiempo Real...</p>
        <p className="text-xs text-slate-400 mt-1">Conectando con la flota de repartidores en Cúcuta</p>
      </div>
    ),
  }
);

const ExecutiveAnalyticsDashboard = dynamic(
  () => import('./ExecutiveAnalyticsDashboard').then((mod) => mod.ExecutiveAnalyticsDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-slate-800/60 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-white/70 rounded-3xl border border-slate-200" />
          <div className="h-28 bg-white/70 rounded-3xl border border-slate-200" />
          <div className="h-28 bg-white/70 rounded-3xl border border-slate-200" />
          <div className="h-28 bg-white/70 rounded-3xl border border-slate-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white rounded-3xl border border-slate-200" />
          <div className="h-80 bg-white rounded-3xl border border-slate-200" />
        </div>
      </div>
    ),
  }
);

interface AdminDashboardProps {
  orders: any[];
  drivers: any[];
  onOpenNewOrderModal: () => void;
  onRefreshDrivers?: () => void;
  onUpdateOrder: (
    orderId: number,
    data: {
      estadoEntrega?: string;
      repartidorId?: number | null;
      estadoPago?: string;
      comprobanteRef?: string;
      cantidadBotellones?: number;
      montoTotal?: number;
      notasEntrega?: string;
    }
  ) => void;
}

export function AdminDashboard({
  orders,
  drivers,
  onOpenNewOrderModal,
  onRefreshDrivers,
  onUpdateOrder,
}: AdminDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<
    'TODOS' | 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'PAGOS' | 'RECHAZADOS' | 'MAPA' | 'METRICAS'
  >('TODOS');
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isManageDriversOpen, setIsManageDriversOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Active jornada orders (excluding CERRADO from active dispatch list)
  const activeJornadaOrders = orders.filter((o) => o.estadoEntrega !== 'CERRADO');
  const totalOrders = activeJornadaOrders.length;
  const totalBottles = activeJornadaOrders.reduce((sum, o) => sum + o.cantidadBotellones, 0);
  const pendingCount = activeJornadaOrders.filter((o) => o.estadoEntrega === 'PENDIENTE').length;
  const inTransitCount = activeJornadaOrders.filter((o) => o.estadoEntrega === 'EN_CAMINO').length;
  const deliveredCount = activeJornadaOrders.filter((o) => o.estadoEntrega === 'ENTREGADO').length;
  const pendingPaymentsCount = activeJornadaOrders.filter(
    (o) => (o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA') && o.estadoPago === 'PENDIENTE'
  ).length;

  // Rejected / Cancelled orders calculation
  const rejectedOrders = activeJornadaOrders.filter(
    (o) => o.estadoEntrega === 'CANCELADO' || o.estadoEntrega === 'RECHAZADO'
  );
  const rejectedCount = rejectedOrders.length;
  const rejectedBottles = rejectedOrders.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0);

  // Delayed orders calculation (>20 min in route)
  const now = new Date().getTime();
  const delayedOrdersCount = activeJornadaOrders.filter((o) => {
    if (o.estadoEntrega === 'EN_CAMINO' && o.updatedAt) {
      const mins = Math.floor((now - new Date(o.updatedAt).getTime()) / 60000);
      return mins >= 20;
    }
    return false;
  }).length;

  const totalCollectedCash = activeJornadaOrders
    .filter((o) => o.estadoEntrega === 'ENTREGADO' && o.metodoPago === 'EFECTIVO')
    .reduce((sum, o) => sum + o.montoTotal, 0);

  const totalCollectedTransfer = activeJornadaOrders
    .filter((o) => o.estadoEntrega === 'ENTREGADO' && (o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA' || o.metodoPago === 'PAGOMOVIL'))
    .reduce((sum, o) => sum + o.montoTotal, 0);

  const totalCollectedCredit = activeJornadaOrders
    .filter((o) => o.estadoEntrega === 'ENTREGADO' && o.metodoPago === 'CREDITO')
    .reduce((sum, o) => sum + o.montoTotal, 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (o.estadoEntrega === 'CERRADO') return false;
    if (activeFilter === 'PENDIENTE') return o.estadoEntrega === 'PENDIENTE';
    if (activeFilter === 'EN_CAMINO') return o.estadoEntrega === 'EN_CAMINO';
    if (activeFilter === 'ENTREGADO') return o.estadoEntrega === 'ENTREGADO';
    if (activeFilter === 'RECHAZADOS')
      return o.estadoEntrega === 'CANCELADO' || o.estadoEntrega === 'RECHAZADO';
    if (activeFilter === 'PAGOS')
      return (o.metodoPago === 'NEQUI' || o.metodoPago === 'TRANSFERENCIA') && o.estadoPago === 'PENDIENTE';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Video Banner Promocional / Branding */}
      <HeroVideoBanner
        onOpenNewOrder={onOpenNewOrderModal}
        totalBottlesToday={totalBottles}
        activeDriversCount={drivers.length}
      />

      {/* Top Banner & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 glass-mac p-6 sm:p-7 rounded-3xl">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex flex-wrap items-center gap-2.5">
            <span>Tablero de Despacho Central</span>
            {delayedOrdersCount > 0 && (
              <span className="text-xs bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{delayedOrdersCount} Retrasado(s)</span>
              </span>
            )}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Asignación directa a repartidores, monitoreo GPS y notificaciones en tiempo real
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Trazabilidad: ONLY visible to Admin General */}
          {typeof window !== 'undefined' &&
            (localStorage.getItem('aguaya_admin_email')?.toLowerCase() === 'admin@aguaya.com' ||
             localStorage.getItem('aguaya_admin_name')?.toLowerCase().includes('administrador') ||
             localStorage.getItem('aguaya_admin_name')?.toLowerCase().includes('admin general')) && (
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="h-11 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0 border border-slate-700 ring-2 ring-sky-500/40"
              title="Módulo exclusivo de Admin General: Trazabilidad y Auditoría"
            >
              <History className="w-4 h-4 text-sky-400" />
              <span>Trazabilidad</span>
            </button>
          )}

          <button
            onClick={() => setIsClosureModalOpen(true)}
            className="h-11 px-3.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0 border border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-300" />
            <span>Cierre Caja</span>
          </button>

          <button
            onClick={() => setIsManageDriversOpen(true)}
            className="h-11 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0"
          >
            <Users className="w-4 h-4 text-emerald-100" />
            <span>Repartidores ({drivers.length})</span>
          </button>

          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="h-11 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0"
          >
            <UserPlus className="w-4 h-4 text-blue-100" />
            <span>+ Cliente</span>
          </button>

          <button
            onClick={onOpenNewOrderModal}
            className="h-11 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black rounded-xl shadow-lg shadow-sky-500/35 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Botellones */}
        <div className="glass-mac glass-mac-interactive p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Botellones Hoy</span>
            <Droplet className="w-5 h-5 fill-sky-500 text-sky-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">{totalBottles}</span>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mt-0.5">
              <span>{totalOrders} pedidos</span>
              {rejectedBottles > 0 && (
                <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md text-[11px]">
                  ⚠️ {rejectedBottles} rech.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Pendientes */}
        <div className="glass-mac glass-mac-interactive p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sin Asignar</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-amber-600">{pendingCount}</span>
            <span className="text-xs text-amber-700 block font-medium mt-0.5">Pendientes de ruta</span>
          </div>
        </div>

        {/* Card 3: En Camino */}
        <div className="glass-mac glass-mac-interactive p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">En Ruta</span>
            <Truck className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-blue-600">{inTransitCount}</span>
            <span className="text-xs text-blue-700 block font-medium mt-0.5">En proceso de entrega</span>
          </div>
        </div>

        {/* Card 4: Entregados */}
        <div className="glass-mac glass-mac-interactive p-5 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Entregados</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600">{deliveredCount}</span>
            <span className="text-xs text-emerald-700 block font-medium mt-0.5">Completados hoy</span>
          </div>
        </div>

        {/* Card 5: Verificación Nequi */}
        <div className="glass-mac glass-mac-interactive p-5 rounded-3xl flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Validar Nequi</span>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="mt-3">
            <span className="text-3xl sm:text-4xl font-black text-purple-700">{pendingPaymentsCount}</span>
            <span className="text-xs text-purple-700 block font-medium mt-0.5">Pagos por verificar</span>
          </div>
        </div>
      </div>

      {/* Recaudación Total Banner */}
      <div className="glass-mac-dark text-white p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30 shadow-inner">
            <DollarSign className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">Recaudación Total del Día (Entregados)</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              ${(totalCollectedCash + totalCollectedTransfer).toLocaleString('es-CO')} COP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div>
            <p className="text-xs text-slate-400 font-medium">Efectivo Recaudado:</p>
            <p className="font-extrabold text-white text-base">${totalCollectedCash.toLocaleString('es-CO')}</p>
          </div>
          <div className="h-9 w-px bg-slate-700 hidden sm:block" />
          <div>
            <p className="text-xs text-slate-400 font-medium">Nequi / Transferencias:</p>
            <p className="font-extrabold text-purple-300 text-base">${totalCollectedTransfer.toLocaleString('es-CO')}</p>
          </div>
          {totalCollectedCredit > 0 && (
            <>
              <div className="h-9 w-px bg-slate-700 hidden sm:block" />
              <div>
                <p className="text-xs text-slate-400 font-medium">A Crédito (Por Cobrar):</p>
                <p className="font-extrabold text-amber-300 text-base">${totalCollectedCredit.toLocaleString('es-CO')}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alert bar if there are rejected orders */}
      {rejectedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              Hay <strong className="text-rose-700">{rejectedCount} pedido(s) rechazado(s)</strong> ({rejectedBottles} botellones devueltos o no entregados).
            </span>
          </div>
          <button
            onClick={() => setActiveFilter('RECHAZADOS')}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-black px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
          >
            <span>Ver Pedidos Rechazados ({rejectedCount})</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-sky-300/30 pb-3 overflow-x-auto gap-2">
        <div className="flex items-center gap-2.5 min-w-max">
          <button
            onClick={() => setActiveFilter('TODOS')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeFilter === 'TODOS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'glass-mac text-slate-700 hover:text-slate-950'
            }`}
          >
            Todos ({totalOrders})
          </button>
          <button
            onClick={() => setActiveFilter('PENDIENTE')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeFilter === 'PENDIENTE'
                ? 'bg-amber-500 text-white shadow-md'
                : 'glass-mac text-amber-800 hover:text-amber-950'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('EN_CAMINO')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeFilter === 'EN_CAMINO'
                ? 'bg-blue-600 text-white shadow-md'
                : 'glass-mac text-blue-800 hover:text-blue-950'
            }`}
          >
            En Ruta ({inTransitCount})
          </button>
          <button
            onClick={() => setActiveFilter('ENTREGADO')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeFilter === 'ENTREGADO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'glass-mac text-emerald-800 hover:text-emerald-950'
            }`}
          >
            Entregados ({deliveredCount})
          </button>
          <button
            onClick={() => setActiveFilter('PAGOS')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
              activeFilter === 'PAGOS'
                ? 'bg-purple-700 text-white shadow-md'
                : 'glass-mac text-purple-800 hover:text-purple-950'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Validar Pagos ({pendingPaymentsCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('RECHAZADOS')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
              activeFilter === 'RECHAZADOS'
                ? 'bg-rose-600 text-white shadow-md'
                : 'glass-mac text-rose-800 hover:text-rose-950'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazados ({rejectedCount})</span>
            {rejectedBottles > 0 && (
              <span className="text-[10px] bg-rose-200 text-rose-950 px-1.5 py-0.5 rounded-full font-black">
                {rejectedBottles} bot.
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFilter('MAPA')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
              activeFilter === 'MAPA'
                ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300'
                : 'glass-mac text-sky-800 hover:text-sky-950'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>🗺️ Mapa GPS en Vivo</span>
          </button>

          <button
            onClick={() => setActiveFilter('METRICAS')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
              activeFilter === 'METRICAS'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-700 text-white shadow-lg ring-2 ring-indigo-400'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 font-black'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>📊 Dashboard de Métricas & KPIs</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Metrics Dashboard, Live GPS Map or Orders Grid */}
      {activeFilter === 'METRICAS' ? (
        <ExecutiveAnalyticsDashboard orders={orders} drivers={drivers} />
      ) : activeFilter === 'MAPA' ? (
        <LiveDriverMap drivers={drivers} />
      ) : filteredOrders.length === 0 ? (
        <div className="glass-mac rounded-3xl p-12 text-center text-slate-400">
          <Droplet className="w-12 h-12 mx-auto stroke-1 text-sky-400 mb-3 animate-pulse" />
          <p className="font-black text-slate-700 text-lg">No hay pedidos en esta categoría</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Registra un nuevo pedido o cambia el filtro activo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const isNequiPending =
              (order.metodoPago === 'NEQUI' || order.metodoPago === 'TRANSFERENCIA') &&
              order.estadoPago === 'PENDIENTE';

            const isRejected = order.estadoEntrega === 'CANCELADO' || order.estadoEntrega === 'RECHAZADO';

            const minsInRoute =
              order.estadoEntrega === 'EN_CAMINO' && order.updatedAt
                ? Math.floor((now - new Date(order.updatedAt).getTime()) / 60000)
                : 0;

            const isDelayed = minsInRoute >= 20;

            return (
              <div
                key={order.id}
                className={`glass-mac glass-mac-interactive rounded-3xl p-5 sm:p-6 flex flex-col justify-between ${
                  isDelayed
                    ? 'ring-2 ring-rose-400 bg-rose-50/50'
                    : isRejected
                    ? 'ring-2 ring-rose-500 bg-rose-50/40 border-rose-200'
                    : isNequiPending
                    ? 'ring-2 ring-purple-400 bg-purple-50/50'
                    : ''
                }`}
              >
                <div>
                  {/* Card Header: Order # & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 text-base">
                        Pedido #{order.numeroPedido}
                      </span>
                      {order.numeroRemision && (
                        <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-200 font-black px-2 py-0.5 rounded-md">
                          📄 Rem: {order.numeroRemision}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDelayed && (
                        <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>{minsInRoute} min (Retrasado)</span>
                        </span>
                      )}

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          order.estadoEntrega === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800'
                            : order.estadoEntrega === 'EN_CAMINO'
                            ? 'bg-blue-100 text-blue-800'
                            : order.estadoEntrega === 'ENTREGADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {order.estadoEntrega === 'PENDIENTE'
                          ? 'Pendiente'
                          : order.estadoEntrega === 'EN_CAMINO'
                          ? 'En Ruta'
                          : order.estadoEntrega === 'ENTREGADO'
                          ? 'Entregado'
                          : 'Rechazado'}
                      </span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-base flex-wrap">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{order.cliente?.nombre || 'Entrega Directa'}</span>
                      {order.cliente?.requiereFactura && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-black">
                          📄 Factura {order.cliente?.numeroFactura ? `#${order.cliente?.numeroFactura}` : ''}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ml-auto ${
                          order.cliente?.tipoCliente === 'VIEJO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.cliente?.tipoCliente === 'VIEJO' ? 'Frecuente ($7k)' : 'Nuevo ($8k)'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">{order.cliente?.direccion}</p>
                        {order.cliente?.barrioSector && (
                          <p className="text-slate-500 font-normal">Barrio: {order.cliente?.barrioSector}</p>
                        )}
                        {order.cliente?.notasUbicacion && (
                          <p className="text-slate-500 italic mt-0.5">Nota: "{order.cliente?.notasUbicacion}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{order.cliente?.telefono}</span>
                    </div>
                  </div>

                  {/* Order Items & Payment Info */}
                  <div className="bg-white/45 backdrop-blur-sm p-3.5 rounded-2xl border border-white/60 space-y-2 mb-4 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Detalle de Productos:
                      </span>
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-1">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">
                                <span className="text-sky-600 font-black">{item.cantidad}x</span> {item.nombreProducto}
                              </span>
                              <span className="font-semibold text-slate-600">${item.subtotal.toLocaleString('es-CO')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-900 bg-sky-100 text-sky-800 px-2 py-0.5 rounded-lg text-xs inline-block">
                          {order.resumenProductos || `${order.cantidadBotellones} Botellón(es) 20L`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                      <span className="text-slate-600 font-bold">Total a Cobrar:</span>
                      <span className="font-black text-slate-900 text-base">
                        ${order.montoTotal.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Método de Pago:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        {order.metodoPago === 'EFECTIVO'
                          ? '💵 Efectivo'
                          : order.metodoPago === 'CREDITO'
                          ? '📝 A Crédito'
                          : order.metodoPago === 'NEQUI'
                          ? '📲 Nequi'
                          : '🏦 Transferencia'}
                      </span>
                    </div>

                    {/* Nequi / Transfer Status */}
                    {(order.metodoPago === 'NEQUI' || order.metodoPago === 'TRANSFERENCIA' || order.metodoPago === 'PAGOMOVIL') && (
                      <div className="pt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Estado Pago:</span>
                        {order.estadoPago === 'VERIFICADO' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Verificado
                          </span>
                        ) : order.estadoPago === 'RECHAZADO' ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Rechazado
                          </span>
                        ) : (
                          <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                            Pendiente Validación
                          </span>
                        )}
                      </div>
                    )}

                    {order.comprobanteRef && (
                      <div className="text-[11px] bg-purple-100/70 p-2 rounded-lg text-purple-900 font-mono">
                        Ref: <strong>{order.comprobanteRef}</strong>
                      </div>
                    )}

                    {/* Motivo de Rechazo en Ruta si aplica */}
                    {isRejected && (
                      <div className="bg-rose-100/80 border border-rose-300 text-rose-950 p-2.5 rounded-xl text-xs mt-2 space-y-1">
                        <p className="font-extrabold text-rose-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Motivo de Rechazo en Ruta:</span>
                        </p>
                        <p className="italic font-medium text-slate-900 bg-white/70 p-1.5 rounded-lg border border-rose-200">
                          {order.notasEntrega || 'Sin motivo especificado'}
                        </p>
                      </div>
                    )}

                    {/* Traceability: Operator */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80 text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        👤 Registrado por:
                      </span>
                      <span className="font-extrabold text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md">
                        {order.creadoPor || 'Oficina'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions / Driver Assignment */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* Driver Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Repartidor Asignado:
                    </label>
                    <select
                      value={order.repartidorId || ''}
                      onChange={(e) =>
                        onUpdateOrder(order.id, {
                          repartidorId: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none text-slate-800"
                    >
                      <option value="">-- Sin Asignar --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} ({d._count?.pedidosAsignados || 0} pendientes)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nequi Admin Verification Controls */}
                  {isNequiPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onUpdateOrder(order.id, { estadoPago: 'VERIFICADO' })}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar Pago
                      </button>
                      <button
                        onClick={() => onUpdateOrder(order.id, { estadoPago: 'RECHAZADO' })}
                        className="py-1.5 px-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-bold transition"
                        title="Rechazar Pago"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}

                  {/* Change Order Delivery Status or Reassign Rejected Order */}
                  <div className="flex items-center gap-1 pt-1">
                    {isRejected ? (
                      <button
                        onClick={() =>
                          onUpdateOrder(order.id, {
                            estadoEntrega: 'PENDIENTE',
                            repartidorId: null,
                          })
                        }
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reintentar / Devolver a Pendientes</span>
                      </button>
                    ) : order.estadoEntrega !== 'ENTREGADO' ? (
                      <button
                        onClick={() =>
                          onUpdateOrder(order.id, {
                            estadoEntrega: 'ENTREGADO',
                            estadoPago: order.metodoPago === 'EFECTIVO' ? 'VERIFICADO' : order.estadoPago,
                          })
                        }
                        className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Entregado
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Closure Modal */}
      <DailyClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        orders={orders}
        drivers={drivers}
        onRefreshOrders={onRefreshDrivers}
      />


      {/* New Standalone Client Registration Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />

      {/* Manage & Configure Drivers Modal */}
      <ManageDriversModal
        isOpen={isManageDriversOpen}
        onClose={() => setIsManageDriversOpen(false)}
        drivers={drivers}
        onDriversUpdated={() => {
          if (onRefreshDrivers) onRefreshDrivers();
        }}
      />

      {/* Operational Traceability & Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
