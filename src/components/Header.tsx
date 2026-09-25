'use client';

import React, { useState } from 'react';
import { Droplets, ShieldCheck, Truck, RefreshCw, LogOut } from 'lucide-react';
import { DriverAuthPinModal } from './DriverAuthPinModal';
import { AdminAuthModal } from './AdminAuthModal';

interface HeaderProps {
  currentRole: 'ADMIN' | string;
  setCurrentRole: (role: string) => void;
  drivers: Array<{ id: number; nombre: string; telefono?: string }>;
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
  const [selectedDriverForPin, setSelectedDriverForPin] = useState<{
    id: number;
    nombre: string;
    telefono?: string;
  } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const handleSelectAdmin = () => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('aguaya_admin_authenticated') === 'true';
      if (!isAuth) {
        setIsAdminModalOpen(true);
        return;
      }
    }
    setCurrentRole('ADMIN');
  };

  const handleSelectDriver = (driverIdStr: string) => {
    const driverId = parseInt(driverIdStr, 10);
    const targetDriver = drivers.find((d) => d.id === driverId);
    if (!targetDriver) return;

    // Verificar si ya está autenticado en este dispositivo
    const isAuth = typeof window !== 'undefined' && localStorage.getItem(`driver_authenticated_${driverId}`) === 'true';

    if (isAuth) {
      setCurrentRole(driverIdStr);
    } else {
      setSelectedDriverForPin(targetDriver);
      setIsPinModalOpen(true);
    }
  };

  const handleSuccessAuth = (driverId: number) => {
    setCurrentRole(driverId.toString());
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aguaya_admin_authenticated');
      localStorage.removeItem('agua_ya_active_driver_id');
      window.location.reload();
    }
  };

  return (
    <>
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
                onClick={handleSelectAdmin}
                className={`h-9 px-3 rounded-lg text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 ${
                  currentRole === 'ADMIN'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Cambiar operador o ingresar como Admin"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {currentRole === 'ADMIN' && typeof window !== 'undefined' && localStorage.getItem('aguaya_admin_name')
                    ? `👤 ${localStorage.getItem('aguaya_admin_name')?.split(' ')[0]}`
                    : 'Oficina'}
                </span>
              </button>

              <div className="h-5 w-px bg-slate-700 mx-0.5" />

              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-400 hidden xs:block" />
                <select
                  value={currentRole !== 'ADMIN' ? currentRole : ''}
                  onChange={(e) => {
                    if (e.target.value) handleSelectDriver(e.target.value);
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

            {/* Logout Icon */}
            <button
              onClick={handleLogout}
              className="h-11 w-11 bg-slate-900/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700/60 hover:border-rose-500/40 transition flex items-center justify-center"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Autenticación de PIN Repartidor */}
      <DriverAuthPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        driver={selectedDriverForPin}
        onSuccessAuth={handleSuccessAuth}
      />

      {/* Modal de Autenticación de Administrador */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => setCurrentRole('ADMIN')}
      />
    </>
  );
}


