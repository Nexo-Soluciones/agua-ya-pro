'use client';

import React from 'react';
import { Droplets, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentRole: 'ADMIN' | string;
  setCurrentRole: (role: string) => void;
  drivers: Array<{ id: number; nombre: string }>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({
  currentRole,
  setCurrentRole,
  drivers,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  return (
    <header className="glass-mac-dark text-white sticky top-0 z-50 border-b border-sky-400/30 shadow-2xl backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo Section */}
        <div className="flex items-center gap-3.5">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-sky-500/25 relative group">
            <Droplets className="w-7 h-7 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center">
                AGUA <span className="text-sky-400 ml-1">YA</span>
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-sky-200/80 font-medium tracking-wide">
              Sistema Central de Despacho & Flota en Vivo
            </p>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-11 px-4 bg-slate-900/80 hover:bg-slate-800 text-sky-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold border border-sky-500/30 shadow-sm transition flex items-center gap-2 backdrop-blur-sm"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-300' : 'text-sky-400'}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="h-11 bg-slate-900/90 p-1 rounded-xl flex items-center gap-1.5 border border-sky-500/30 shadow-inner">
            <button
              onClick={() => setCurrentRole('ADMIN')}
              className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-extrabold transition flex items-center gap-2 ${
                currentRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Oficina (Admin)</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-0.5" />

            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-400 hidden xs:block" />
              <select
                value={currentRole !== 'ADMIN' ? currentRole : ''}
                onChange={(e) => {
                  if (e.target.value) setCurrentRole(e.target.value);
                }}
                className={`h-9 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs sm:text-sm font-bold rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400 transition cursor-pointer ${
                  currentRole !== 'ADMIN'
                    ? 'bg-emerald-600 font-black border-emerald-400 text-white ring-2 ring-emerald-400/40'
                    : ''
                }`}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  Ver como Repartidor...
                </option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id.toString()} className="bg-slate-900 text-white">
                    🚚 {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
