'use client';

import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PRESETS = [
  { nombre: 'Thalia Jimenez', email: 'thalia@aguaya.com', avatar: '👩‍💼', cargo: 'Despacho & Operaciones' },
  { nombre: 'Leidy Giraldo', email: 'leidy@aguaya.com', avatar: '👩‍💻', cargo: 'Administración & Clientes' },
  { nombre: 'Maritza Correa', email: 'maritza@aguaya.com', avatar: '👩‍💼', cargo: 'Control & Liquidación' },
  { nombre: 'Admin General', email: 'admin@aguaya.com', avatar: '🛡️', cargo: 'Acceso Maestro' },
];

export function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [selectedUser, setSelectedUser] = useState<string>('Thalia Jimenez');
  const [email, setEmail] = useState('thalia@aguaya.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof ADMIN_PRESETS[0]) => {
    setSelectedUser(preset.nombre);
    setEmail(preset.email);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADMIN',
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('aguaya_admin_authenticated', 'true');
          localStorage.setItem('aguaya_admin_name', data.user.nombre || selectedUser);
          localStorage.setItem('aguaya_admin_email', data.user.email || email);
        }
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-mac-dark text-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-sky-400/40 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950/60 border border-sky-500/30 px-3 py-0.5 rounded-full inline-block">
              Trazabilidad Operativa
            </span>
            <h3 className="text-2xl font-black text-white mt-1.5">Ingreso de Operadores</h3>
            <p className="text-xs text-slate-300">
              Selecciona tu usuario para firmar las operaciones y despachos
            </p>
          </div>
        </div>

        {/* User Selector Grid */}
        <div className="mb-4">
          <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2">
            1. Selecciona tu Usuario:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ADMIN_PRESETS.map((preset) => (
              <button
                key={preset.email}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  email === preset.email
                    ? 'bg-sky-500/25 border-sky-400 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/50'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{preset.avatar}</span>
                  <span className="text-xs font-black text-white truncate">{preset.nombre}</span>
                </div>
                <span className="text-[10px] text-sky-300 font-medium truncate">{preset.cargo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition"
              placeholder="usuario@aguaya.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition"
              placeholder="••••••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] text-white font-black rounded-xl shadow-lg shadow-sky-500/30 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="text-sm">Verificando firma digital...</span>
            ) : (
              <>
                <span>Iniciar Turno como {selectedUser.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-3">
          🔒 Trazabilidad activa: cada acción quedará registrada bajo tu usuario
        </p>
      </div>
    </div>
  );
}
