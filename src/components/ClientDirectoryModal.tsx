'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  User,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  FileText,
  Edit,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowLeft,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface ClientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated?: () => void;
}

export function ClientDirectoryModal({
  isOpen,
  onClose,
  onClientUpdated,
}: ClientDirectoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientToEdit, setSelectedClientToEdit] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields for editing/creating
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
  const [successToast, setSuccessToast] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial load & search debounce
  useEffect(() => {
    if (isOpen) {
      fetchClients(searchQuery);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchClients(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const fetchClients = async (query: string) => {
    setIsLoading(true);
    try {
      const url = query.trim().length >= 2
        ? `/api/clients?q=${encodeURIComponent(query.trim())}`
        : `/api/clients`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditClient = (client: any) => {
    setSelectedClientToEdit(client);
    setIsCreatingNew(false);
    setErrorMsg('');
    setSuccessToast('');

    setNombre(client.nombre || '');
    setTelefono(client.telefono || '');
    setDireccion(client.direccion || '');
    setBarrioSector(client.barrioSector || '');
    setTipoCliente(client.tipoCliente || 'VIEJO');
    setPrecioAcordado(client.precioAcordado !== undefined && client.precioAcordado !== null ? client.precioAcordado : 7000);
    setNotasUbicacion(client.notasUbicacion || '');
    setRequiereFactura(Boolean(client.requiereFactura));
    setNumeroFactura(client.numeroFactura || '');
  };

  const startCreateClient = () => {
    setSelectedClientToEdit(null);
    setIsCreatingNew(true);
    setErrorMsg('');
    setSuccessToast('');

    setNombre('');
    setTelefono('');
    setDireccion('');
    setBarrioSector('');
    setTipoCliente('VIEJO');
    setPrecioAcordado(7000);
    setNotasUbicacion('');
    setRequiereFactura(false);
    setNumeroFactura('');
  };

  const cancelEditOrCreate = () => {
    setSelectedClientToEdit(null);
    setIsCreatingNew(false);
    setErrorMsg('');
    setSuccessToast('');
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg('Nombre, teléfono y dirección son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedClientToEdit) {
        // Edit existing client by ID
        const res = await fetch(`/api/clients/${selectedClientToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            direccion: direccion.trim(),
            barrioSector: barrioSector.trim() || null,
            tipoCliente,
            precioAcordado,
            notasUbicacion: notasUbicacion.trim() || null,
            requiereFactura,
            numeroFactura: requiereFactura ? numeroFactura.trim() || null : null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al actualizar el cliente');
        }

        setSuccessToast('¡Cliente actualizado exitosamente!');
        fetchClients(searchQuery);
        if (onClientUpdated) onClientUpdated();

        setTimeout(() => {
          setSelectedClientToEdit(null);
          setSuccessToast('');
        }, 900);
      } else {
        // Create new client
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

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al registrar el cliente');
        }

        setSuccessToast('¡Cliente registrado exitosamente!');
        fetchClients(searchQuery);
        if (onClientUpdated) onClientUpdated();

        setTimeout(() => {
          setIsCreatingNew(false);
          setSuccessToast('');
        }, 900);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el cliente');
      }

      setSuccessToast(`¡Cliente "${clientToDelete.nombre}" eliminado exitosamente!`);
      if (selectedClientToEdit?.id === clientToDelete.id) {
        setSelectedClientToEdit(null);
      }
      setClientToDelete(null);
      fetchClients(searchQuery);
      if (onClientUpdated) onClientUpdated();

      setTimeout(() => {
        setSuccessToast('');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el cliente');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-sky-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                {selectedClientToEdit
                  ? `Modificar Ficha de Cliente (#${selectedClientToEdit.id})`
                  : isCreatingNew
                  ? 'Registrar Nuevo Cliente'
                  : 'Directorio & Gestión de Clientes'}
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                {selectedClientToEdit || isCreatingNew
                  ? 'Corrige el número de teléfono, dirección o tarifas asignadas'
                  : 'Búsqueda predictiva y edición de datos de clientes'}
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

        {/* Content View */}
        {selectedClientToEdit || isCreatingNew ? (
          /* Mode: Form Edit / Create */
          <form onSubmit={handleSaveClient} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={cancelEditOrCreate}
                className="text-xs font-bold text-slate-600 hover:text-sky-700 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Directorio</span>
              </button>

              {selectedClientToEdit && (
                <span className="text-xs bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                  Modificando ID: #{selectedClientToEdit.id}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successToast}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp <span className="text-rose-500">* (Editable)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="3001234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Exacta de Entrega <span className="text-rose-500">*</span>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clasificación de Cliente
                </label>
                <select
                  value={tipoCliente}
                  onChange={(e) => {
                    const val = e.target.value as 'VIEJO' | 'NUEVO';
                    setTipoCliente(val);
                    if (!selectedClientToEdit) {
                      setPrecioAcordado(val === 'NUEVO' ? 8000 : 7000);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="VIEJO">Cliente Frecuente</option>
                  <option value="NUEVO">Cliente Nuevo</option>
                </select>
              </div>

              {/* Pricing Selector ($5,000 to $12,000 & $0) */}
              <div>
                <label className="block text-xs font-bold text-sky-900 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  <span>Tarifa Acordada por Botellón</span>
                </label>
                <select
                  value={precioAcordado}
                  onChange={(e) => setPrecioAcordado(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-sky-50/70 border border-sky-300 rounded-xl text-sm font-black text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
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
                  <option value={0}>$0 COP (Cambio / Donación / Regalo)</option>
                </select>
              </div>
            </div>

            {/* Facturación: Check Sí/No y Número de Factura */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>¿Requiere Facturación?</span>
                </label>

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
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
              {selectedClientToEdit ? (
                <button
                  type="button"
                  onClick={() => setClientToDelete(selectedClientToEdit)}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  title="Eliminar este cliente definitivamente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Cliente</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditOrCreate}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : selectedClientToEdit ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Cliente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Mode: Directory List & Search */
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
            {/* Search Bar & Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por Nombre, Teléfono, Dirección o Barrio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs"
                />
              </div>

              <button
                onClick={startCreateClient}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 shrink-0 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Cliente</span>
              </button>
            </div>

            {/* Results Counter & Info */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>
                {isLoading ? (
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando en la base de datos...
                  </span>
                ) : (
                  `${clients.length} clientes encontrados`
                )}
              </span>
              <span className="text-[11px] text-slate-400">
                Presiona <strong>Editar</strong> para corregir teléfono o dirección
              </span>
            </div>

            {/* Client Cards List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 max-h-[55vh] pr-1">
              {clients.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <User className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No se encontraron clientes</p>
                  <p className="text-xs text-slate-400">
                    Intenta buscar con otro término o presiona <strong>+ Nuevo Cliente</strong> para agregarlo.
                  </p>
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3.5 bg-white hover:bg-sky-50/40 border border-slate-200 hover:border-sky-300 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm group-hover:text-sky-800">
                          {client.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{client.id}
                        </span>
                        {client.requiereFactura && (
                          <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-black">
                            📄 Factura {client.numeroFactura ? `#${client.numeroFactura}` : ''}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            client.tipoCliente === 'VIEJO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {client.tipoCliente === 'VIEJO' ? 'Frecuente' : 'Nuevo'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-sky-600" />
                          {client.telefono}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {client.direccion} {client.barrioSector ? `(${client.barrioSector})` : ''}
                        </span>
                        <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                          Tarifa: ${(client.precioAcordado || 7000).toLocaleString('es-CO')}
                        </span>
                      </div>

                      {client.notasUbicacion && (
                        <p className="text-[11px] text-slate-500 italic">
                          Nota: "{client.notasUbicacion}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => startEditClient(client)}
                        className="px-3 py-2 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                        title="Editar teléfono, dirección y datos de este cliente"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-2 bg-slate-50 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-200 hover:border-rose-600 rounded-xl transition flex items-center justify-center shadow-xs"
                        title="Eliminar cliente de la base de datos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Safety Dialog */}
        {clientToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0 border border-rose-200">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    ¿Eliminar cliente definitivamente?
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Esta acción eliminará el registro de la base de datos para sincerar el directorio.
                  </p>
                </div>
              </div>

              {/* Client summary pill */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-rose-950">
                <p className="font-black text-sm text-slate-900">
                  {clientToDelete.nombre} <span className="font-mono text-slate-500 font-normal">#{clientToDelete.id}</span>
                </p>
                <div className="flex items-center gap-2 text-slate-700 font-mono font-bold">
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>{clientToDelete.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{clientToDelete.direccion} {clientToDelete.barrioSector ? `(${clientToDelete.barrioSector})` : ''}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setClientToDelete(null);
                    setErrorMsg('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteClient}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/25 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, Eliminar Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
