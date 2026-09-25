'use client';

import React, { useState } from 'react';
import { X, Truck, Plus, Edit2, Trash2, Check, UserCheck, AlertCircle, Phone } from 'lucide-react';

interface Driver {
  id: number;
  nombre: string;
  telefono: string;
  estado: string;
  _count?: { pedidosAsignados: number };
}

interface ManageDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: Driver[];
  onDriversUpdated: () => void;
}

export function ManageDriversModal({
  isOpen,
  onClose,
  drivers,
  onDriversUpdated,
}: ManageDriversModalProps) {
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newTelefono, setNewTelefono] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const startEdit = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setEditNombre(driver.nombre);
    setEditTelefono(driver.telefono);
    setIsAddingNew(false);
    setErrorMsg('');
  };

  const cancelEdit = () => {
    setEditingDriverId(null);
    setEditNombre('');
    setEditTelefono('');
  };

  const handleSaveEdit = async (driverId: number) => {
    if (!editNombre.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          telefono: editTelefono.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar repartidor');
      }

      cancelEdit();
      onDriversUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          telefono: newTelefono.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear repartidor');
      }

      setNewNombre('');
      setNewTelefono('');
      setIsAddingNew(false);
      onDriversUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async (driverId: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al repartidor "${nombre}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar repartidor');
      }

      onDriversUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Gestionar Equipo de Repartidores</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Edita nombres, teléfonos o añade nuevos choferes a la flota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Flota Actual ({drivers.length} Choferes)
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingDriverId(null);
                }}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Añadir Repartidor</span>
              </button>
            )}
          </div>

          {/* Add New Driver Form */}
          {isAddingNew && (
            <form onSubmit={handleAddNewDriver} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
              <p className="text-xs font-black text-emerald-900">Registrar Nuevo Repartidor</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre (ej: Carlos)"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (ej: 3001234567)"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Repartidor'}
                </button>
              </div>
            </form>
          )}

          {/* Drivers List */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {drivers.map((driver, index) => {
              const isEditing = editingDriverId === driver.id;

              return (
                <div
                  key={driver.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    isEditing
                      ? 'bg-sky-50/80 border-sky-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-sky-800 uppercase">
                          Editar Repartidor #{index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Nombre"
                        />
                        <input
                          type="tel"
                          value={editTelefono}
                          onChange={(e) => setEditTelefono(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Teléfono"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleSaveEdit(driver.id)}
                          className="px-3.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{driver.nombre}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{driver.telefono}</span>
                            </p>
                            <span className="text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-200 px-2 py-0.2 rounded-md flex items-center gap-1">
                              <span>🔑 PIN:</span>
                              <span>{driver.id === 1 ? '1111' : driver.id === 2 ? '2222' : driver.id === 3 ? '3333' : driver.id === 4 ? '4444' : driver.telefono ? driver.telefono.slice(-4) : `${driver.id}${driver.id}${driver.id}${driver.id}`}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(driver)}
                          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition"
                          title="Editar nombre / teléfono"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {drivers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(driver.id, driver.nombre)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Eliminar repartidor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
