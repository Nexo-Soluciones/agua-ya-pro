'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, History, Search, RefreshCw, UserCheck, Clock } from 'lucide-react';

interface AuditLogItem {
  id: number;
  usuarioId?: number | null;
  rol: string;
  accion: string;
  detalles: string | null;
  ipAddress?: string | null;
  createdAt: string;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  } | null;
}

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogsModal({ isOpen, onClose }: AuditLogsModalProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterUser, setFilterUser] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Acceso restringido a Administrador General.');
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesUser =
      filterUser === 'TODOS' ||
      (log.usuario?.nombre && log.usuario.nombre.toLowerCase().includes(filterUser.toLowerCase())) ||
      (log.detalles && log.detalles.toLowerCase().includes(filterUser.toLowerCase()));

    const matchesSearch =
      !searchQuery ||
      log.accion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.detalles && log.detalles.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.usuario?.nombre && log.usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesUser && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <History className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">Trazabilidad de Operaciones</h3>
                <span className="text-[10px] bg-sky-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Auditoría en Vivo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Historial cronológico de acciones por operadoras y administradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Operator filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['TODOS', 'Juliana', 'Thalia', 'Leidy', 'Maritza'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilterUser(name)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterUser === name
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {name === 'TODOS' ? '👥 Todas' : `👤 ${name}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar en auditoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 w-48 font-medium"
              />
            </div>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition"
              title="Actualizar registro"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-3">
          {errorMsg ? (
            <div className="py-12 text-center text-rose-600 bg-rose-50/50 rounded-2xl p-6 border border-rose-200 m-4">
              <Shield className="w-10 h-10 mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-black text-rose-900">Acceso Exclusivo de Admin General</p>
              <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{errorMsg}</p>
            </div>
          ) : loading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
              <p className="text-xs font-semibold">Cargando bitácora de auditoría...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Sin registros de auditoría</p>
              <p className="text-xs text-slate-400">Las acciones de los operadores aparecerán aquí en tiempo real.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const operatorName = log.usuario?.nombre || (log.detalles?.match(/\[(.*?)\]/)?.[1]) || 'Oficina';
              const isCreate = log.accion.includes('CREAR');
              const isUpdate = log.accion.includes('ACTUALIZAR');
              const isLogin = log.accion.includes('LOGIN');

              return (
                <div key={log.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                        isCreate
                          ? 'bg-emerald-100 text-emerald-800'
                          : isUpdate
                          ? 'bg-blue-100 text-blue-800'
                          : isLogin
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {isCreate ? '➕' : isUpdate ? '✏️' : isLogin ? '🔑' : '📌'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          👤 {operatorName}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isCreate
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isUpdate
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.accion}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium mt-1 leading-relaxed">{log.detalles}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-slate-400 text-[11px] font-mono">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total eventos auditados: <strong>{filteredLogs.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
}
