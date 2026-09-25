'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, UserCheck, AlertCircle, Phone, MapPin, Truck, CheckCircle2 } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  drivers: Array<{ id: number; nombre: string; _count?: { pedidosAsignados: number } }>;
}

export function NewOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  drivers,
}: NewOrderModalProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [barrioSector, setBarrioSector] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'VIEJO' | 'NUEVO'>('VIEJO');
  const [precioUnitario, setPrecioUnitario] = useState<number>(7000);
  const [notasUbicacion, setNotasUbicacion] = useState('');

  const [cantidadBotellones, setCantidadBotellones] = useState(1);
  const [repartidorId, setRepartidorId] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'NEQUI' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO');
  const [numeroRemision, setNumeroRemision] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Predictive search for clients
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      fetch(`/api/clients?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .catch(console.error);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const selectClient = (client: any) => {
    setSelectedClient(client);
    setNombre(client.nombre);
    setTelefono(client.telefono);
    setDireccion(client.direccion);
    setBarrioSector(client.barrioSector || '');
    setTipoCliente(client.tipoCliente || 'VIEJO');
    setPrecioUnitario(client.precioAcordado || (client.tipoCliente === 'NUEVO' ? 8000 : 7000));
    setNotasUbicacion(client.notasUbicacion || '');
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setNombre('');
    setTelefono('');
    setDireccion('');
    setBarrioSector('');
    setTipoCliente('NUEVO');
    setPrecioUnitario(8000);
    setNotasUbicacion('');
    setNumeroRemision('');
  };

  const totalPrice = cantidadBotellones * precioUnitario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg('Nombre, teléfono y dirección son campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedClient ? selectedClient.id : undefined,
          nombreCliente: nombre,
          telefonoCliente: telefono,
          direccionCliente: direccion,
          barrioSector,
          tipoCliente,
          precioUnitario,
          notasUbicacion,
          repartidorId: repartidorId || undefined,
          cantidadBotellones,
          metodoPago,
          numeroRemision: numeroRemision.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar el pedido');
      }

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onOrderCreated();
        onClose();
        // Reset form
        clearSelectedClient();
        setCantidadBotellones(1);
        setRepartidorId('');
        setMetodoPago('EFECTIVO');
        setNumeroRemision('');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Registrar Nuevo Pedido</h2>
              <p className="text-xs text-sky-100 font-medium">Búsqueda rápida o nuevo cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-100 hover:text-white p-1.5 rounded-xl hover:bg-sky-500/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-sm font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¡Pedido registrado y asignado con éxito!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Existing Client */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Buscar Cliente Frecuente (Teléfono o Nombre)
              </label>
              {selectedClient && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Cliente Seleccionado
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escribe teléfono o nombre para buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-medium bg-slate-50/50"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => selectClient(client)}
                    className="w-full text-left px-4 py-3 hover:bg-sky-50 transition flex items-center justify-between text-sm group"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 group-hover:text-sky-700">{client.nombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">📞 {client.telefono} - 📍 {client.direccion}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase shrink-0 ${
                      client.tipoCliente === 'VIEJO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {client.tipoCliente === 'VIEJO' ? 'Frecuente ($7k)' : 'Nuevo ($8k)'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900 text-xs sm:text-sm font-semibold">
                <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Cliente Autocompletado: <strong>{selectedClient.nombre}</strong></span>
              </div>
              <button
                type="button"
                onClick={clearSelectedClient}
                className="text-xs text-emerald-700 underline font-bold hover:text-emerald-900"
              >
                Limpiar / Nuevo
              </button>
            </div>
          )}

          {/* Client Details Section */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Datos del Cliente
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Perez"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="300 000 0000"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección Exacta de Entrega *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle 123 # 45-67"
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Barrio / Sector</label>
                <input
                  type="text"
                  value={barrioSector}
                  onChange={(e) => setBarrioSector(e.target.value)}
                  placeholder="Ej. San Antonio"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Acordado por Botellón</label>
                <select
                  value={precioUnitario}
                  onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-sky-50 font-black text-sky-900 shadow-sm"
                >
                  <option value={5000}>$5.000 COP (Descuento Mayorista)</option>
                  <option value={6000}>$6.000 COP (Descuento Preferencial)</option>
                  <option value={7000}>$7.000 COP (Frecuente Estándar)</option>
                  <option value={8000}>$8.000 COP (Nuevo Estándar)</option>
                  <option value={9000}>$9.000 COP (Tarifa Especial)</option>
                  <option value={10000}>$10.000 COP (Larga Distancia)</option>
                  <option value={11000}>$11.000 COP (Premium)</option>
                  <option value={12000}>$12.000 COP (Máxima Especial)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Indicaciones de Ubicación</label>
              <input
                type="text"
                value={notasUbicacion}
                onChange={(e) => setNotasUbicacion(e.target.value)}
                placeholder="Ej. Casa blanca con portón negro, golpear fuerte"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>
          </div>

          <hr className="border-slate-200 my-2" />

          {/* Order Details & Fast Quantity Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              3. Detalle del Pedido & Asignación
            </label>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">Cantidad de Botellones (20L)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 5, 10].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setCantidadBotellones(qty)}
                      className={`text-xs px-2.5 py-0.5 rounded-lg font-bold transition ${
                        cantidadBotellones === qty
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidadBotellones(Math.max(1, cantidadBotellones - 1))}
                    className="w-9 h-9 bg-white hover:bg-slate-100 rounded-xl text-slate-800 font-extrabold border border-slate-300 flex items-center justify-center text-base shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-black text-xl w-10 text-center text-slate-900">{cantidadBotellones}</span>
                  <button
                    type="button"
                    onClick={() => setCantidadBotellones(cantidadBotellones + 1)}
                    className="w-9 h-9 bg-white hover:bg-slate-100 rounded-xl text-slate-800 font-extrabold border border-slate-300 flex items-center justify-center text-base shadow-xs"
                  >
                    +
                  </button>
                </div>

                <div className="ml-auto text-right">
                  <span className="text-xs text-slate-500 font-medium block">Precio unitario:</span>
                  <span className="text-sm font-extrabold text-sky-800">
                    ${precioUnitario.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Método de Pago Esperado</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="NEQUI">📲 Nequi</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="CREDITO">📝 A Crédito (Por Cobrar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Asignar Repartidor en Despacho</label>
                <select
                  value={repartidorId}
                  onChange={(e) => setRepartidorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="">-- Asignar Luego --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d._count?.pedidosAsignados || 0} activos)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Número de Remisión / Control Interno <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={numeroRemision}
                onChange={(e) => setNumeroRemision(e.target.value)}
                placeholder="Ej. R-1049 o Nº de talonario físico"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Total Calculation Banner */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-2xl border border-sky-200 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-sky-900 font-bold uppercase tracking-wider">Total del Pedido:</p>
              <p className="text-xs text-sky-700 font-medium">
                {cantidadBotellones} x ${precioUnitario.toLocaleString('es-CO')} COP
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-sky-950">
                ${totalPrice.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-2xl text-sm font-black text-white bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/30 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isSubmitting ? 'Guardando Pedido...' : '🚀 CREAR & ASIGNAR PEDIDO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
