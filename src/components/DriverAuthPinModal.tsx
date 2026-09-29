'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, ShieldAlert, CheckCircle2, Sparkles, KeyRound } from 'lucide-react';

interface DriverAuthPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: {
    id: number;
    nombre: string;
    telefono?: string;
  } | null;
  onSuccessAuth: (driverId: number) => void;
}

export function DriverAuthPinModal({
  isOpen,
  onClose,
  driver,
  onSuccessAuth,
}: DriverAuthPinModalProps) {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isOpen, driver?.id]);

  if (!isOpen || !driver) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg('');

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const validatePin = async (enteredPin: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REPARTIDOR',
          driverId: driver.id,
          pin: enteredPin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`driver_authenticated_${driver.id}`, 'true');
          localStorage.setItem('agua_ya_active_driver_id', driver.id.toString());
        }
        onSuccessAuth(driver.id);
        onClose();
      } else {
        setIsShaking(true);
        setErrorMsg(data.error || 'PIN incorrecto. Intenta de nuevo.');
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 700);
      }
    } catch (err) {
      setIsShaking(true);
      setErrorMsg('Error de conexión con el servidor. Verifica tu internet e intenta de nuevo.');
      setTimeout(() => {
        setPin('');
        setIsShaking(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`glass-mac-dark text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-sky-400/40 shadow-2xl relative overflow-hidden transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Glow de fondo */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-400/30">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 bg-sky-950/60 border border-sky-500/30 px-3 py-0.5 rounded-full inline-block">
              Seguridad de Repartidor
            </span>
            <h3 className="text-xl font-black text-white mt-1.5">{driver.nombre}</h3>
            <p className="text-xs text-slate-300">
              Digita tu PIN de 4 dígitos para acceder a tus pedidos
            </p>
          </div>
        </div>

        {/* Círculos Indicadores de PIN */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-sky-400 shadow-md shadow-sky-400/50 scale-125 ring-2 ring-sky-300'
                    : 'bg-slate-800 border-2 border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Mensaje de Error o Ayuda */}
        <div className="h-6 text-center">
          {errorMsg ? (
            <p className="text-xs font-black text-rose-400 animate-pulse">{errorMsg}</p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Ingresa tu PIN de 4 dígitos asignado por el administrador
            </p>
          )}
        </div>

        {/* Teclado Numérico Táctil */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 bg-white/10 hover:bg-white/20 active:bg-sky-500 active:scale-95 text-xl font-black text-white rounded-2xl border border-white/10 shadow-sm transition flex items-center justify-center backdrop-blur-sm"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 bg-white/10 hover:bg-white/20 active:bg-sky-500 active:scale-95 text-xl font-black text-white rounded-2xl border border-white/10 shadow-sm transition flex items-center justify-center backdrop-blur-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-300 rounded-2xl border border-rose-500/30 shadow-sm transition flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-500 mt-4">
          🔒 Este dispositivo recordará tu sesión una vez validado
        </p>
      </div>
    </div>
  );
}
