'use client';

import React, { useState } from 'react';
import { X, Send, Bot, CheckCircle2, Zap, Smartphone, ArrowRight } from 'lucide-react';

interface WhatsappNetlifySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function WhatsappNetlifySimulator({
  isOpen,
  onClose,
  onOrderCreated,
}: WhatsappNetlifySimulatorProps) {
  const [nombre, setNombre] = useState('Mariana Gomez');
  const [telefono, setTelefono] = useState('3129876543');
  const [direccion, setDireccion] = useState('Av. 5 # 10-25 Barrio Obrero');
  const [cantidad, setCantidad] = useState(2);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'NEQUI'>('EFECTIVO');

  const [isLoading, setIsLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setWebhookResult(null);

    try {
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: nombre,
          clienteTelefono: telefono,
          clienteDireccion: direccion,
          cantidadBotellones: cantidad,
          metodoPago,
          source: 'SIMULADOR_NETLIFY',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWebhookResult(data);
        onOrderCreated();
      } else {
        alert(data.error || 'Error al ejecutar Webhook');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Simulador Netlify + WhatsApp Webhook</h3>
              <p className="text-xs text-emerald-100 font-medium">Demostración de pedido 100% automático</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1.5 rounded-xl hover:bg-emerald-500/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Step Banner */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-2 font-black text-sm">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Simula un pedido enviado por un cliente en WhatsApp:</span>
            </div>
            <p className="text-emerald-700">
              Al hacer clic en <strong>"Enviar Webhook a Netlify"</strong>, la orden se creará sola en el tablero de Agua YA y asignará al repartidor más desocupado.
            </p>
          </div>

          <form onSubmit={handleSimulateWebhook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono WhatsApp</label>
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Dirección de Entrega</label>
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Cantidad Botellones</label>
                <select
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                >
                  <option value={1}>1 Botellón (20L)</option>
                  <option value={2}>2 Botellones (20L)</option>
                  <option value={3}>3 Botellones (20L)</option>
                  <option value={5}>5 Botellones (20L)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="NEQUI">📲 Nequi</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Procesando Webhook Netlify...' : '⚡ ENVIAR WEBHOOK DESDE NETLIFY'}</span>
            </button>
          </form>

          {/* Webhook Response Preview */}
          {webhookResult && (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Webhook procesado! Pedido #{webhookResult.pedido.numeroPedido} creado y asignado a {webhookResult.pedido.repartidor}.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Respuesta Automática de WhatsApp Retornada por Netlify:
                </label>
                <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl font-mono text-xs whitespace-pre-wrap shadow-inner border border-emerald-700 leading-relaxed">
                  {webhookResult.whatsappReply}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
