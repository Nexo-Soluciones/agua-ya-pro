'use client';

import React, { useState } from 'react';
import { Droplets, ShieldCheck, Truck, KeyRound, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { DriverAuthPinModal } from './DriverAuthPinModal';
import { AdminAuthModal } from './AdminAuthModal';

interface GatekeeperAuthScreenProps {
  drivers: Array<{ id: number; nombre: string; telefono?: string }>;
  onAuthenticatedAsAdmin: () => void;
  onAuthenticatedAsDriver: (driverId: number) => void;
}

export function GatekeeperAuthScreen({
  drivers,
  onAuthenticatedAsAdmin,
  onAuthenticatedAsDriver,
}: GatekeeperAuthScreenProps) {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedDriverForPin, setSelectedDriverForPin] = useState<{
    id: number;
    nombre: string;
    telefono?: string;
  } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const handleSelectDriver = (driver: { id: number; nombre: string; telefono?: string }) => {
    setSelectedDriverForPin(driver);
    setIsPinModalOpen(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full glass-mac-dark text-white rounded-3xl p-6 sm:p-10 border border-sky-400/40 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-sky-500/30 border border-sky-300/40">
            <Droplets className="w-9 h-9 text-white fill-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Portal Seguro Agua YA
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bienvenido al Sistema
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80 max-w-sm mx-auto">
              Selecciona tu tipo de acceso para ingresar a la plataforma
            </p>
          </div>
        </div>

        {/* Main Selection Grid */}
        <div className="space-y-4">
          {/* Admin Portal Card */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-800/90 hover:from-sky-950/80 hover:to-blue-950/80 border border-sky-400/30 hover:border-sky-400/60 shadow-lg transition-all duration-200 group flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/30 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white group-hover:text-sky-300 transition-colors">
                  Oficina & Despacho (Admin)
                </h3>
                <p className="text-xs text-slate-300">
                  Tablero de pedidos, métricas, clientes y cierre diario
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Drivers Section Divider */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Acceso para Repartidores en Ruta
              </span>
            </div>

            {/* Drivers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => handleSelectDriver(driver)}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/50 shadow-sm transition-all duration-200 text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block group-hover:text-emerald-300">
                          {driver.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {driver.telefono || 'Repartidor'}
                        </span>
                      </div>
                    </div>
                    <KeyRound className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                  Cargando lista de repartidores...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-500 mt-6">
          🔒 Seguridad blindada con PIN de 4 dígitos y encriptación bcrypt
        </p>
      </div>

      {/* Admin Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={onAuthenticatedAsAdmin}
      />

      {/* Driver PIN Modal */}
      <DriverAuthPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        driver={selectedDriverForPin}
        onSuccessAuth={onAuthenticatedAsDriver}
      />
    </div>
  );
}
