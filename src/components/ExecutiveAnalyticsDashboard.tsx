'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  Award,
  Zap,
  BarChart3,
  PieChart as PieIcon,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  Clock,
  Truck,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Order {
  id: number;
  numeroPedido?: number;
  cliente?: {
    nombre?: string;
    direccion?: string;
    telefono?: string;
    barrio?: string;
  };
  cantidadBotellones: number;
  montoTotal: number;
  metodoPago: string; // 'EFECTIVO' | 'CREDITO' | 'TRANSFERENCIA' | 'NEQUI' | 'PAGOMOVIL'
  estadoEntrega: string; // 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO'
  estadoPago: string;
  repartidorId?: number | null;
  repartidor?: {
    id: number;
    nombre: string;
    telefono?: string;
  } | null;
  numeroRemision?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface Driver {
  id: number;
  nombre: string;
  telefono?: string;
  rol?: string;
  estado?: string;
  pedidosAsignados?: Order[];
}

interface ExecutiveAnalyticsDashboardProps {
  orders: Order[];
  drivers: Driver[];
}

// Paleta Oficial Agua YA
const PAYMENT_COLORS: { [key: string]: string } = {
  EFECTIVO: '#10b981', // Verde Esmeralda
  CREDITO: '#f59e0b', // Ámbar Alerta Cobro
  TRANSFERENCIA: '#8b5cf6', // Violeta Tech
  NEQUI: '#a855f7',
  PAGOMOVIL: '#6366f1',
};

export function ExecutiveAnalyticsDashboard({ orders, drivers }: ExecutiveAnalyticsDashboardProps) {
  const [metricMode, setMetricMode] = useState<'MONTO' | 'BOTELLONES'>('MONTO');
  const [timeFilter, setTimeFilter] = useState<'HOY' | 'SEMANA' | 'MES' | 'TODOS'>('HOY');
  const [selectedDriverId, setSelectedDriverId] = useState<number | 'ALL'>('ALL');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('es-CO'));

  // Helper seguro para parsear fechas sin arrojar RangeError
  const getSafeDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  };

  // Filtrado de pedidos según fecha seleccionada y repartidor
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let list = orders;

    if (timeFilter === 'HOY') {
      const todayList = orders.filter((o) => {
        const d = getSafeDate(o.createdAt);
        return d && d.toISOString().split('T')[0] === todayStr;
      });
      // Fallback amigable si es base de datos de test
      list = todayList.length > 0 ? todayList : orders;
    } else if (timeFilter === 'SEMANA') {
      list = orders.filter((o) => {
        const d = getSafeDate(o.createdAt);
        return d && d >= sevenDaysAgo;
      });
      if (list.length === 0) list = orders;
    } else if (timeFilter === 'MES') {
      list = orders.filter((o) => {
        const d = getSafeDate(o.createdAt);
        return d && d >= thirtyDaysAgo;
      });
      if (list.length === 0) list = orders;
    }

    // Filtrar por repartidor si se seleccionó uno específico
    if (selectedDriverId !== 'ALL') {
      list = list.filter((o) => o.repartidorId === selectedDriverId);
    }

    return list;
  }, [orders, timeFilter, selectedDriverId]);

  // Cálculos Globales
  const totalOrdersCount = filteredOrders.length;
  const deliveredOrders = useMemo(
    () => filteredOrders.filter((o) => o.estadoEntrega === 'ENTREGADO' || o.estadoEntrega === 'CERRADO'),
    [filteredOrders]
  );
  const totalDeliveredCount = deliveredOrders.length;

  const totalBottlesDelivered = useMemo(
    () => deliveredOrders.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0),
    [deliveredOrders]
  );
  const totalBottlesAssigned = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => deliveredOrders.reduce((sum, o) => sum + (o.montoTotal || 0), 0),
    [deliveredOrders]
  );

  const deliverySuccessRate = totalOrdersCount > 0 ? Math.round((totalDeliveredCount / totalOrdersCount) * 100) : 0;

  // Totales por Método de Pago
  const paymentBreakdown = useMemo(() => {
    let efectivo = 0;
    let credito = 0;
    let transferencia = 0;

    let efectivoBottles = 0;
    let creditoBottles = 0;
    let transferenciaBottles = 0;

    deliveredOrders.forEach((o) => {
      const m = o.metodoPago?.toUpperCase() || 'EFECTIVO';
      const amount = o.montoTotal || 0;
      const bottles = o.cantidadBotellones || 0;

      if (m === 'EFECTIVO') {
        efectivo += amount;
        efectivoBottles += bottles;
      } else if (m === 'CREDITO') {
        credito += amount;
        creditoBottles += bottles;
      } else {
        transferencia += amount;
        transferenciaBottles += bottles;
      }
    });

    return {
      efectivo,
      credito,
      transferencia,
      efectivoBottles,
      creditoBottles,
      transferenciaBottles,
      total: efectivo + credito + transferencia,
    };
  }, [deliveredOrders]);

  // Datos para Gráfico de Torta de Métodos de Pago
  const paymentPieData = useMemo(() => {
    const total = paymentBreakdown.total || 1;
    return [
      {
        name: 'Efectivo',
        value: paymentBreakdown.efectivo,
        bottles: paymentBreakdown.efectivoBottles,
        color: PAYMENT_COLORS.EFECTIVO,
        percent: Math.round((paymentBreakdown.efectivo / total) * 100),
      },
      {
        name: 'A Crédito',
        value: paymentBreakdown.credito,
        bottles: paymentBreakdown.creditoBottles,
        color: PAYMENT_COLORS.CREDITO,
        percent: Math.round((paymentBreakdown.credito / total) * 100),
      },
      {
        name: 'Transferencia / Nequi',
        value: paymentBreakdown.transferencia,
        bottles: paymentBreakdown.transferenciaBottles,
        color: PAYMENT_COLORS.TRANSFERENCIA,
        percent: Math.round((paymentBreakdown.transferencia / total) * 100),
      },
    ].filter((item) => item.value > 0 || total === 1);
  }, [paymentBreakdown]);

  // Rendimiento por Repartidor (Estadísticas completas)
  const driverStats = useMemo(() => {
    const activeDrivers = drivers.filter((d) => d.estado !== 'INACTIVO');

    const list = activeDrivers.map((driver) => {
      const driverOrders = orders.filter((o) => o.repartidorId === driver.id);
      const delivered = driverOrders.filter((o) => o.estadoEntrega === 'ENTREGADO' || o.estadoEntrega === 'CERRADO');
      const inRoute = driverOrders.filter((o) => o.estadoEntrega === 'EN_CAMINO');
      const pending = driverOrders.filter((o) => o.estadoEntrega === 'PENDIENTE');

      const totalDeliveredMonto = delivered.reduce((sum, o) => sum + (o.montoTotal || 0), 0);
      const totalBottles = delivered.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0);
      const totalAssignedBottles = driverOrders.reduce((sum, o) => sum + (o.cantidadBotellones || 0), 0);

      // Métodos de pago por repartidor
      const cashMonto = delivered.filter((o) => o.metodoPago === 'EFECTIVO').reduce((sum, o) => sum + (o.montoTotal || 0), 0);
      const creditMonto = delivered.filter((o) => o.metodoPago === 'CREDITO').reduce((sum, o) => sum + (o.montoTotal || 0), 0);
      const transferMonto = delivered
        .filter((o) => o.metodoPago === 'TRANSFERENCIA' || o.metodoPago === 'NEQUI' || o.metodoPago === 'PAGOMOVIL')
        .reduce((sum, o) => sum + (o.montoTotal || 0), 0);

      const completionRate = driverOrders.length > 0 ? Math.round((delivered.length / driverOrders.length) * 100) : 0;
      const shareOfTotalRevenue = totalRevenue > 0 ? Math.round((totalDeliveredMonto / totalRevenue) * 100) : 0;
      const shareOfTotalBottles = totalBottlesDelivered > 0 ? Math.round((totalBottles / totalBottlesDelivered) * 100) : 0;

      return {
        id: driver.id,
        nombre: driver.nombre,
        assignedCount: driverOrders.length,
        deliveredCount: delivered.length,
        inRouteCount: inRoute.length,
        pendingCount: pending.length,
        totalDeliveredMonto,
        totalBottles,
        totalAssignedBottles,
        cashMonto,
        creditMonto,
        transferMonto,
        completionRate,
        shareOfTotalRevenue,
        shareOfTotalBottles,
      };
    });

    // Ordenar de mayor a menor según monto total
    return list.sort((a, b) => b.totalDeliveredMonto - a.totalDeliveredMonto || b.totalBottles - a.totalBottles);
  }, [drivers, orders, totalRevenue, totalBottlesDelivered]);

  // Identificar el Mejor y Menor Repartidor
  const topSellerDriver = driverStats.length > 0 ? driverStats[0] : null;
  const lowestSellerDriver = driverStats.length > 1 ? driverStats[driverStats.length - 1] : null;

  // Repartidor que vendió más a crédito
  const topCreditDriver = useMemo(() => {
    if (driverStats.length === 0) return null;
    const sorted = [...driverStats].sort((a, b) => b.creditMonto - a.creditMonto);
    return sorted[0].creditMonto > 0 ? sorted[0] : null;
  }, [driverStats]);

  // Repartidor que recaudó más efectivo
  const topCashDriver = useMemo(() => {
    if (driverStats.length === 0) return null;
    const sorted = [...driverStats].sort((a, b) => b.cashMonto - a.cashMonto);
    return sorted[0].cashMonto > 0 ? sorted[0] : null;
  }, [driverStats]);

  // Datos para Gráfico de Barras Comparativo
  const barChartData = useMemo(() => {
    const targetList = selectedDriverId === 'ALL'
      ? driverStats
      : driverStats.filter((d) => d.id === selectedDriverId);

    return targetList.map((d) => ({
      name: d.nombre,
      'Total Ventas ($)': d.totalDeliveredMonto,
      'Botellones Entregados': d.totalBottles,
      'Botellones Asignados': d.totalAssignedBottles,
      'Efectivo ($)': d.cashMonto,
      'A Crédito ($)': d.creditMonto,
      'Transferencia ($)': d.transferMonto,
      'Tasa Cumplimiento (%)': d.completionRate,
    }));
  }, [driverStats, selectedDriverId]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 🚀 Header Ejecutivo & Controles */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-sky-900/50 relative overflow-hidden">
        {/* Glow de Fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
                CENTRO DE INTELIGENCIA & KPIs
              </span>
              <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                En Vivo ({lastSyncTime})
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Dashboard de Rendimiento Ejecutivo
            </h1>
            <p className="text-sm text-sky-200/80 mt-1 max-w-2xl">
              Análisis interactivo de ventas, efectividad por repartidor, balance de botellones y cartera por método de pago.
            </p>
          </div>

          {/* Selector de Modos y Filtro Temporal */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700 flex items-center backdrop-blur-md">
              <button
                onClick={() => setMetricMode('MONTO')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  metricMode === 'MONTO'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Por Dinero ($)</span>
              </button>
              <button
                onClick={() => setMetricMode('BOTELLONES')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  metricMode === 'BOTELLONES'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Por Botellones</span>
              </button>
            </div>

            <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700 flex items-center backdrop-blur-md">
              <button
                onClick={() => setTimeFilter('HOY')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeFilter === 'HOY' ? 'bg-slate-700 text-sky-300 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setTimeFilter('SEMANA')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeFilter === 'SEMANA' ? 'bg-slate-700 text-sky-300 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Días
              </button>
              <button
                onClick={() => setTimeFilter('MES')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeFilter === 'MES' ? 'bg-slate-700 text-sky-300 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setTimeFilter('TODOS')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeFilter === 'TODOS' ? 'bg-slate-700 text-sky-300 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtro Rápido por Repartidor (Drilldown) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">Filtrar por Repartidor:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDriverId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                selectedDriverId === 'ALL'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              👥 Todos los Repartidores
            </button>
            {driverStats.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDriverId(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedDriverId === d.id
                    ? 'bg-sky-400 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>🚚 {d.nombre}</span>
                <span className="text-[10px] opacity-75 font-semibold">({d.totalBottles} u)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 Tarjetas de Métricas KPI Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Recaudación Total */}
        <div className="glass-mac glass-mac-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/15 rounded-bl-full -z-0 transition-transform group-hover:scale-125 blur-sm" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Recaudación Total</span>
            <div className="p-2.5 bg-emerald-500/15 text-emerald-700 rounded-2xl border border-emerald-500/20 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-xs">
              ${totalRevenue.toLocaleString('es-CO')}
            </h3>
            <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalDeliveredCount} entregas completadas</span>
            </p>
          </div>
        </div>

        {/* Botellones Entregados */}
        <div className="glass-mac glass-mac-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-400/15 rounded-bl-full -z-0 transition-transform group-hover:scale-125 blur-sm" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Botellones Entregados</span>
            <div className="p-2.5 bg-sky-500/15 text-sky-700 rounded-2xl border border-sky-500/20 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-xs">
              {totalBottlesDelivered} <span className="text-base text-slate-400 font-semibold">/ {totalBottlesAssigned}</span>
            </h3>
            <p className="text-xs font-bold text-sky-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{deliverySuccessRate}% de efectividad</span>
            </p>
          </div>
        </div>

        {/* Cartera A Crédito */}
        <div className="glass-mac glass-mac-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/15 rounded-bl-full -z-0 transition-transform group-hover:scale-125 blur-sm" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Ventas a Crédito</span>
            <div className="p-2.5 bg-amber-500/15 text-amber-700 rounded-2xl border border-amber-500/20 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-3xl font-black text-amber-900 tracking-tight drop-shadow-xs">
              ${paymentBreakdown.credito.toLocaleString('es-CO')}
            </h3>
            <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{paymentBreakdown.creditoBottles} botellones por cobrar</span>
            </p>
          </div>
        </div>

        {/* Efectivo en Caja */}
        <div className="glass-mac glass-mac-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-400/15 rounded-bl-full -z-0 transition-transform group-hover:scale-125 blur-sm" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Caja Física & Bancos</span>
            <div className="p-2.5 bg-purple-500/15 text-purple-700 rounded-2xl border border-purple-500/20 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-xs">
              ${(paymentBreakdown.efectivo + paymentBreakdown.transferencia).toLocaleString('es-CO')}
            </h3>
            <p className="text-xs font-bold text-purple-600 mt-1 flex items-center gap-1">
              <span>Efectivo: ${paymentBreakdown.efectivo.toLocaleString('es-CO')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 🏆 Podio de Repartidores: Líder vs Menor Desempeño */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 🥇 Repartidor Líder en Ventas */}
        {topSellerDriver && (
          <div className="glass-mac glass-mac-card p-6 rounded-3xl border-2 border-amber-300/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-md flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                REPARTIDOR LÍDER EN VENTAS
              </span>
              <span className="text-3xl filter drop-shadow-sm">🥇</span>
            </div>

            <div className="mt-4">
              <h4 className="text-2xl font-black text-slate-900">{topSellerDriver.nombre}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Mayor volumen facturado</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-amber-200/80 shadow-inner">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Facturado</p>
                <p className="text-lg font-black text-slate-900">
                  ${topSellerDriver.totalDeliveredMonto.toLocaleString('es-CO')}
                </p>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {topSellerDriver.shareOfTotalRevenue}% del total
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Botellones</p>
                <p className="text-lg font-black text-sky-700">
                  {topSellerDriver.totalBottles} unid.
                </p>
                <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                  {topSellerDriver.deliveredCount} entregas
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Efectividad de entrega:</span>
              <span className="font-black text-amber-700">{topSellerDriver.completionRate}%</span>
            </div>
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full mt-1.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${topSellerDriver.completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* 📉 Repartidor con Menor Desempeño / Alerta */}
        {lowestSellerDriver && (
          <div className="glass-mac glass-mac-card p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200/90 text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                MENOR DESEMPEÑO / PENDIENTES
              </span>
              <span className="text-2xl filter drop-shadow-sm">📉</span>
            </div>

            <div className="mt-4">
              <h4 className="text-2xl font-black text-slate-900">{lowestSellerDriver.nombre}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Oportunidad de apoyo o reasignación de ruta</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-inner">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Facturado</p>
                <p className="text-lg font-black text-slate-800">
                  ${lowestSellerDriver.totalDeliveredMonto.toLocaleString('es-CO')}
                </p>
                <span className="text-[10px] font-semibold text-slate-500">
                  {lowestSellerDriver.shareOfTotalRevenue}% del total
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Pendientes</p>
                <p className="text-lg font-black text-rose-600">
                  {lowestSellerDriver.pendingCount + lowestSellerDriver.inRouteCount} pedidos
                </p>
                <span className="text-[10px] font-semibold text-slate-500">
                  {lowestSellerDriver.totalBottles} entregados
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Efectividad actual:</span>
              <span className="font-black text-slate-700">{lowestSellerDriver.completionRate}%</span>
            </div>
            <div className="w-full bg-slate-200/80 h-2.5 rounded-full mt-1.5 overflow-hidden shadow-inner">
              <div
                className="bg-slate-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${lowestSellerDriver.completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* 💳 Líder en Ventas a Crédito / Efectivo */}
        <div className="glass-mac glass-mac-card p-6 rounded-3xl border border-sky-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-600 text-white flex items-center gap-1.5 shadow-xs">
                <CreditCard className="w-3.5 h-3.5" />
                CONTROL DE CARTERA Y CAJA
              </span>
              <span className="text-2xl">💼</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-2">Líderes por Tipo de Pago</h4>
            <p className="text-xs text-slate-500 font-medium">Control de recaudo individual</p>

            <div className="space-y-3 mt-4">
              {topCreditDriver && (
                <div className="p-3 bg-amber-50/80 backdrop-blur-xs border border-amber-200 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800">Mayor Venta a Crédito</span>
                    <p className="font-black text-slate-900 text-sm">{topCreditDriver.nombre}</p>
                  </div>
                  <span className="text-sm font-black text-amber-900 bg-amber-200/90 px-2.5 py-1 rounded-xl shadow-xs">
                    ${topCreditDriver.creditMonto.toLocaleString('es-CO')}
                  </span>
                </div>
              )}

              {topCashDriver && (
                <div className="p-3 bg-emerald-50/80 backdrop-blur-xs border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800">Mayor Recaudo Efectivo</span>
                    <p className="font-black text-slate-900 text-sm">{topCashDriver.nombre}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-900 bg-emerald-200/90 px-2.5 py-1 rounded-xl shadow-xs">
                    ${topCashDriver.cashMonto.toLocaleString('es-CO')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Repartidores Monitoreados:</span>
            <span className="font-black text-slate-900">{driverStats.length}</span>
          </div>
        </div>
      </div>

      {/* 📈 Sección de Gráficos Interactivos: Barras & Torta de Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras Comparativo (2 Columnas) */}
        <div className="lg:col-span-2 glass-mac glass-mac-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                <h3 className="text-xl font-black text-slate-900">
                  {metricMode === 'MONTO' ? 'Comparativa de Ventas por Repartidor ($ COP)' : 'Comparativa de Botellones por Repartidor'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pasa el cursor sobre las barras para ver detalles interactivos de rendimiento.
              </p>
            </div>

            <span className="text-xs font-black px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl">
              {metricMode === 'MONTO' ? 'Modo: Montos en Dinero' : 'Modo: Volumen de Botellones'}
            </span>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val) =>
                    metricMode === 'MONTO' ? `$${(val / 1000).toLocaleString()}k` : `${val} u`
                  }
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2">
                          <p className="font-black text-sky-300 text-sm">{label}</p>
                          <div className="border-t border-slate-700 pt-2 space-y-1">
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Total Facturado:</span>
                              <span className="font-black text-emerald-400">
                                ${data['Total Ventas ($)'].toLocaleString('es-CO')}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Botellones Entregados:</span>
                              <span className="font-black text-sky-400">{data['Botellones Entregados']} unid.</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Efectivo:</span>
                              <span className="font-bold text-white">${data['Efectivo ($)'].toLocaleString('es-CO')}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">A Crédito:</span>
                              <span className="font-bold text-amber-400">${data['A Crédito ($)'].toLocaleString('es-CO')}</span>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-slate-400">Transferencias:</span>
                              <span className="font-bold text-purple-400">
                                ${data['Transferencia ($)'].toLocaleString('es-CO')}
                              </span>
                            </p>
                            <p className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                              <span className="text-slate-400">Tasa Cumplimiento:</span>
                              <span className="font-black text-sky-300">{data['Tasa Cumplimiento (%)']}%</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontWeight: 700, fontSize: '12px' }} />
                {metricMode === 'MONTO' ? (
                  <>
                    <Bar
                      dataKey="Efectivo ($)"
                      stackId="a"
                      fill={PAYMENT_COLORS.EFECTIVO}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="A Crédito ($)"
                      stackId="a"
                      fill={PAYMENT_COLORS.CREDITO}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Transferencia ($)"
                      stackId="a"
                      fill={PAYMENT_COLORS.TRANSFERENCIA}
                      radius={[8, 8, 0, 0]}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="Botellones Entregados"
                      fill="#0ea5e9"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="Botellones Asignados"
                      fill="#cbd5e1"
                      radius={[8, 8, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Torta / Donut: Métodos de Pago */}
        <div className="glass-mac glass-mac-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-black text-slate-900">Distribución de Pagos</h3>
              </div>
              <span className="text-xs font-black text-slate-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">100% Total</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Porcentaje y monto recaudado por cada forma de pago.
            </p>
          </div>

          <div className="w-full h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs">
                          <p className="font-black" style={{ color: data.color }}>
                            {data.name}
                          </p>
                          <p className="font-black text-sm mt-1">${data.value.toLocaleString('es-CO')}</p>
                          <p className="text-slate-400 text-[10px]">{data.percent}% del total de ventas</p>
                          <p className="text-slate-400 text-[10px]">{data.bottles} botellones</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centro del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-black text-slate-400 uppercase">Total Recaudo</span>
              <span className="text-lg font-black text-slate-900">
                ${totalRevenue > 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${(totalRevenue / 1000).toFixed(0)}k`}
              </span>
            </div>
          </div>

          {/* Leyenda Detallada */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200/60">
            {paymentPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold bg-white/50 backdrop-blur-xs p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md shadow-xs" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">${item.value.toLocaleString('es-CO')}</span>
                  <span className="text-slate-400 font-semibold ml-2">({item.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 Tabla Detallada de Rendimiento y Liquidación por Repartidor */}
      <div className="glass-mac glass-mac-card rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/70 bg-white/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-600" />
              Matriz Analítica de Liquidación y Desempeño
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría directa de botellones entregados, dinero por método de pago y porcentaje de efectividad.
            </p>
          </div>
          <span className="text-xs font-black text-slate-600 bg-white/90 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs backdrop-blur-md">
            {driverStats.length} Repartidores Monitoreados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/80 backdrop-blur-md text-slate-700 font-black text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Posición & Repartidor</th>
                <th className="py-3.5 px-4 text-center">Botellones</th>
                <th className="py-3.5 px-4 text-right">Efectivo ($)</th>
                <th className="py-3.5 px-4 text-right">A Crédito ($)</th>
                <th className="py-3.5 px-4 text-right">Transferencia ($)</th>
                <th className="py-3.5 px-4 text-right">Total Facturado</th>
                <th className="py-3.5 px-5 text-center">Efectividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverStats.map((d, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

                return (
                  <tr key={d.id} className="hover:bg-sky-50/50 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-500 text-sm w-6 text-center">{medal}</span>
                        <div>
                          <p className="font-black text-slate-900">{d.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {d.deliveredCount} de {d.assignedCount} entregas completadas
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-black text-sky-700 bg-sky-50/90 border border-sky-200 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
                        {d.totalBottles} unid.
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-emerald-700">
                      ${d.cashMonto.toLocaleString('es-CO')}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-amber-700">
                      ${d.creditMonto.toLocaleString('es-CO')}
                    </td>

                    <td className="py-4 px-4 text-right font-bold text-purple-700">
                      ${d.transferMonto.toLocaleString('es-CO')}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-black text-slate-900 text-base drop-shadow-2xs">
                        ${d.totalDeliveredMonto.toLocaleString('es-CO')}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs ${
                          d.completionRate >= 80
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : d.completionRate >= 50
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {d.completionRate}%
                        </span>
                        <div className="w-16 bg-slate-200/80 h-2 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full ${
                              d.completionRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${d.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="glass-mac-dark text-white font-black text-sm">
              <tr>
                <td className="py-4 px-5">TOTAL CONSOLIDADO</td>
                <td className="py-4 px-4 text-center text-sky-300">{totalBottlesDelivered} unid.</td>
                <td className="py-4 px-4 text-right text-emerald-400">
                  ${paymentBreakdown.efectivo.toLocaleString('es-CO')}
                </td>
                <td className="py-4 px-4 text-right text-amber-400">
                  ${paymentBreakdown.credito.toLocaleString('es-CO')}
                </td>
                <td className="py-4 px-4 text-right text-purple-300">
                  ${paymentBreakdown.transferencia.toLocaleString('es-CO')}
                </td>
                <td className="py-4 px-4 text-right text-white text-base">
                  ${totalRevenue.toLocaleString('es-CO')}
                </td>
                <td className="py-4 px-5 text-center text-sky-300">{deliverySuccessRate}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
