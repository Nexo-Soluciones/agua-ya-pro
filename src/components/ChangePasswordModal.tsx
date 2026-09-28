'use client';

import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserName,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const emailToUse =
        currentUserEmail ||
        (typeof window !== 'undefined' ? localStorage.getItem('aguaya_admin_email') : null) ||
        'admin@aguaya.com';

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Contraseña actualizada con éxito.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 2200);
      } else {
        setErrorMsg(data.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err) {
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    currentUserName ||
    (typeof window !== 'undefined' ? localStorage.getItem('aguaya_admin_name') : null) ||
    'Operador';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/25">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-3 py-0.5 rounded-full inline-block">
              Seguridad de Cuenta
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1.5">Cambiar mi Contraseña</h3>
            <p className="text-xs text-slate-500">
              Usuario: <strong className="text-slate-800">{displayName}</strong>
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Actual</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Ingresa tu clave actual"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña (mínimo 6 caracteres)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Crea tu nueva contraseña"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                placeholder="Repite tu nueva contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!successMsg}
            className="w-full py-3 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black rounded-xl shadow-lg shadow-sky-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="text-sm">Guardando nueva clave...</span>
            ) : (
              <span>Actualizar Mi Contraseña</span>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-4">
          🔒 Tu contraseña se guardará encriptada y nadie más tendrá acceso a ella.
        </p>
      </div>
    </div>
  );
}
