'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Droplets,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface HeroVideoBannerProps {
  onOpenNewOrder?: () => void;
  totalBottlesToday?: number;
  activeDriversCount?: number;
}

export function HeroVideoBanner({
  onOpenNewOrder,
  totalBottlesToday = 0,
  activeDriversCount = 0,
}: HeroVideoBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl glass-mac-dark text-white shadow-2xl border border-sky-500/20">
      {/* Top Controls Bar */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 backdrop-blur-md flex items-center justify-between border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-sm shadow-sky-500/20">
            <Droplets className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base sm:text-lg tracking-tight text-white">
              AGUA <span className="text-sky-400">YA</span>
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="hidden sm:inline text-xs font-semibold text-sky-200">
              Despacho & Distribución de Botellones
            </span>
          </div>
        </div>

        {/* Live System Badge & Minimize */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Operación en Vivo</span>
          </div>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-xs backdrop-blur-sm transition text-sky-200 border border-sky-400/30 ml-1"
            title={isMinimized ? 'Expandir Banner' : 'Minimizar Banner'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Animated Banner Section (Pure CSS & SVG, 0 KB Network Transfer) */}
      {!isMinimized && (
        <div className="relative w-full min-h-[220px] sm:min-h-[250px] bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 overflow-hidden flex items-center p-6 sm:p-8">
          {/* Animated Water Mesh Ambient Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Decorative Glowing Water Bottle SVG Graphic */}
          <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 opacity-15 sm:opacity-25 pointer-events-none select-none">
            <svg
              className="w-48 h-48 sm:w-64 sm:h-64 text-sky-400 drop-shadow-[0_0_35px_rgba(56,189,248,0.4)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Bottle neck & cap */}
              <rect x="9" y="2" width="6" height="3" rx="1" />
              <path d="M10 5v2" />
              <path d="M14 5v2" />
              {/* Bottle body */}
              <path d="M7 9h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-9a2 2 0 0 1 2-2z" />
              {/* Internal water wave lines */}
              <path d="M7 14c1.5 1 3.5 1 5 0s3.5-1 5 0" strokeWidth="1.5" className="animate-pulse" />
              <path d="M7 18c1.5 1 3.5 1 5 0s3.5-1 5 0" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Banner Content */}
          <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Botellón 20L Purificado
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Calidad & Pureza Garantizada
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 backdrop-blur-md">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  Logística Express
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-md tracking-tight leading-tight">
                Agua Purificada de Alta Calidad & Despacho Inmediato
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                Monitoreo en vivo de pedidos, asignación rápida de rutas y despacho inteligente para empresas y hogares.
              </p>

              {/* Real-time Telemetry Badges */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">
                    <strong className="text-white font-black text-sm">{totalBottlesToday}</strong> botellones hoy
                  </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    <strong className="text-white font-black text-sm">{activeDriversCount}</strong> repartidores activos
                  </span>
                </div>
              </div>
            </div>

            {onOpenNewOrder && (
              <div className="shrink-0 pt-2 lg:pt-0">
                <button
                  onClick={onOpenNewOrder}
                  className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2.5 border border-sky-300/40"
                >
                  <Droplets className="w-5 h-5 fill-white" />
                  <span>Crear Pedido de Botellón</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
