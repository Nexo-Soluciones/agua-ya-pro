'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, CheckCircle2, AlertCircle, Building2, DollarSign, FileText } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: () => void;
}

export function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrioSector, setBarrioSector] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'VIEJO' | 'NUEVO'>('VIEJO');
  const [precioAcordado, setPrecioAcordado] = useState<number>(7000);
  const [notasUbicacion, setNotasUbicacion] = useState('');
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg('Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          direccion: direccion.trim(),
          barrioSector: barrioSector.trim() || undefined,
          tipoCliente,
          precioAcordado,
          notasUbicacion: notasUbicacion.trim() || undefined,
          requiereFactura,
          numeroFactura: requiereFactura ? numeroFactura.trim() || undefined : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar el cliente');
      }

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        if (onClientCreated) onClientCreated();
        onClose();
        setNombre('');
        setTelefono('');
        setDireccion('');
        setBarrioSector('');
        setTipoCliente('VIEJO');
        setPrecioAcordado(7000);
        setNotasUbicacion('');
        setRequiereFactura(false);
        setNumeroFactura('');
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Registrar Nuevo Cliente</h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Guarda los datos y tarifa personalizada ($5.000 - $12.000) en la base de datos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sky-200 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>¡Cliente guardado exitosamente en la base de datos!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Completo del Cliente <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Distribuidora Los Andes / Sra. Carmen"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="3001234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clasificación de Cliente
              </label>
              <select
                value={tipoCliente}
                onChange={(e) => {
                  const val = e.target.value as 'VIEJO' | 'NUEVO';
                  setTipoCliente(val);
                  setPrecioAcordado(val === 'NUEVO' ? 8000 : 7000);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="VIEJO">Cliente Frecuente</option>
                <option value="NUEVO">Cliente Nuevo</option>
              </select>
            </div>
          </div>

          {/* Pricing Selector ($5,000 to $12,000) */}
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-1.5">
            <label className="block text-xs font-black text-sky-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-sky-600" />
              <span>Precio Acordado por Botellón ($5.000 a $12.000 COP)</span>
            </label>
            <select
              value={precioAcordado}
              onChange={(e) => setPrecioAcordado(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-sky-300 rounded-xl text-sm font-black text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            >
              <option value={10500}>$10.500 COP</option>
              <option value={10000}>$10.000 COP</option>
              <option value={9500}>$9.500 COP</option>
              <option value={9000}>$9.000 COP</option>
              <option value={8933}>$8.933 COP</option>
              <option value={8500}>$8.500 COP</option>
              <option value={8000}>$8.000 COP</option>
              <option value={7000}>$7.000 COP</option>
              <option value={6000}>$6.000 COP</option>
              <option value={5000}>$5.000 COP</option>
            </select>
            <p className="text-[11px] text-sky-700 font-medium">
              Este precio se guardará en la ficha del cliente y se usará automáticamente en cada pedido.
            </p>
          </div>

          {/* Facturación: Check Sí/No y Número de Factura */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>¿Factura?</span>
              </label>

              {/* Botones Sí / No */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setRequiereFactura(false);
                    setNumeroFactura('');
                  }}
                  className={`px-3.5 py-1 rounded-lg text-xs font-black transition ${
                    !requiereFactura
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setRequiereFactura(true)}
                  className={`px-3.5 py-1 rounded-lg text-xs font-black transition ${
                    requiereFactura
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sí
                </button>
              </div>
            </div>

            {requiereFactura && (
              <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-sky-900 mb-1">
                  Número de Factura
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-sky-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ej: FAC-1045 o 1045"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-sky-300 rounded-xl text-sm font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dirección de Entrega <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Calle 10 # 5-20"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Barrio o Sector</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ej: Caobos, Centro, Blanco"
                value={barrioSector}
                onChange={(e) => setBarrioSector(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas de Ubicación o Indicaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Portón verde frente al parque, timbre 2..."
              value={notasUbicacion}
              onChange={(e) => setNotasUbicacion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
