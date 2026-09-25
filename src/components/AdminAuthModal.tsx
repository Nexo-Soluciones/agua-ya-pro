'use client';

import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [email, setEmail] = useState('admin@aguaya.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950/60 border border-sky-500/30 px-3 py-0.5 rounded-full inline-block">
              Acceso Restringido
            </span>
            <h3 className="text-2xl font-black text-white mt-1.5">Control Administrativo</h3>
            <p className="text-xs text-slate-300">
              Ingresa tus credenciales maestras para gestionar despacho y reportes
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Correo Administrador</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition"
              placeholder="admin@aguaya.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition"
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
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] text-white font-black rounded-xl shadow-lg shadow-sky-500/30 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="text-sm">Verificando seguridad...</span>
            ) : (
              <>
                <span>Ingresar a Oficina</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 mt-4">
          🔒 Conexión encriptada con JWT HttpOnly y protección contra ataques
        </p>
      </div>
    </div>
  );
}
