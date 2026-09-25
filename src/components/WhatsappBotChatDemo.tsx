'use client';

import React, { useState } from 'react';
import { X, Send, Bot, CheckCheck, Smartphone, Copy, Check, Sparkles, AlertCircle, HeartHandshake } from 'lucide-react';

interface WhatsappBotChatDemoProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function WhatsappBotChatDemo({
  isOpen,
  onClose,
  onOrderCreated,
}: WhatsappBotChatDemoProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<
    Array<{ id: number; sender: 'CLIENT' | 'BOT'; text: string; time: string }>
  >([
    {
      id: 1,
      sender: 'BOT',
      text: '¡Hola! 💧 Te habla *Sofía* de la oficina de Agua YA. Estoy aquí para atenderte con mucho gusto. ¿En qué te podemos colaborar hoy?',
      time: '10:00 AM',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'NETLIFY_CODE'>('CHAT');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Preset Scenario: Cliente Molesto
  const loadUpsetClientScenario = async () => {
    setMessages([
      {
        id: 1,
        sender: 'BOT',
        text: '¡Hola! 💧 Te habla *Sofía* de la oficina de Agua YA. Estoy aquí para atenderte con mucho gusto. ¿En qué te podemos colaborar hoy?',
        time: '10:00 AM',
      },
      {
        id: 2,
        sender: 'CLIENT',
        text: '¡Oigan llevo más de 1 hora esperando mi botellón y nadie me responde por aquí! ¡Qué mal servicio la verdad, tengo a la familia sin agua!',
        time: '10:01 AM',
      },
    ]);

    setIsTyping(true);
    setTimeout(async () => {
      // Trigger Webhook Order in Agua YA
      try {
        const res = await fetch('/api/webhooks/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNombre: 'Familia Ramírez (Cliente Molesto Solucionado)',
            clienteTelefono: '3159988776',
            clienteDireccion: 'Carrera 18 # 7-89 Apt 302',
            barrioSector: 'Prados del Norte',
            cantidadBotellones: 2,
            metodoPago: 'EFECTIVO',
            source: 'DEMO_CLIENTE_MOLESTO_SOFIA',
          }),
        });

        const data = await res.json();
        onOrderCreated();

        const botReply = `¡Hola! Entiendo perfectamente tu molestia y te pido disculpas de todo corazón 🙏. No queremos que tu familia se quede sin agua ni un minuto más.

Ya he verificado en nuestro sistema Agua YA y prioricé personalmente tu pedido:

📦 *Pedido Prioritario #${data.pedido?.numeroPedido || 1008}*
• 2 Botellones de 20L ($14.000 COP)
• 🚚 *Repartidor Asignado*: ${data.pedido?.repartidor || 'Repartidor 1'} (¡Ya va en camino exclusivo hacia tu dirección!)
• 📍 *Dirección*: Carrera 18 # 7-89 Apt 302

Tu repartidor llegará en aproximadamente 8 minutos. ¿Te puedo colaborar con algo más para que estés 100% tranquilo/a? ❤️`;

        setMessages((prev) => [
          ...prev,
          {
            id: 3,
            sender: 'BOT',
            text: botReply,
            time: '10:02 AM',
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(false);
      }
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgText = inputText;
    setInputText('');

    const userMsg = {
      id: Date.now(),
      sender: 'CLIENT' as const,
      text: userMsgText,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: 'Cliente WhatsApp',
          clienteTelefono: '3001122334',
          clienteDireccion: userMsgText,
          barrioSector: 'Centro',
          cantidadBotellones: 2,
          metodoPago: userMsgText.toLowerCase().includes('nequi') ? 'NEQUI' : 'EFECTIVO',
          source: 'CHAT_SOFIA',
        }),
      });

      const data = await res.json();
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Empathy logic if client is upset or complaining
      const isComplaining =
        userMsgText.toLowerCase().includes('molesto') ||
        userMsgText.toLowerCase().includes('tarde') ||
        userMsgText.toLowerCase().includes('esperando') ||
        userMsgText.toLowerCase().includes('malo') ||
        userMsgText.toLowerCase().includes('demora');

      let sofiaResponse = '';
      if (isComplaining) {
        sofiaResponse = `Entiendo completamente tu frustración y te ofrezco una disculpa sincera 🙏. En Agua YA tu tranquilidad es nuestra prioridad.

He registrado y colocado tu pedido en estado **PRIORITARIO ALTA** en nuestro panel de despacho:

📦 *Pedido #${data.pedido?.numeroPedido || 1009}*
• 2 Botellones (20L) - Total: $${(data.pedido?.montoTotal || 14000).toLocaleString('es-CO')}
• 🚚 *Repartidor en Ruta*: ${data.pedido?.repartidor || 'Repartidor 1'}
• 📍 *Destino*: ${userMsgText}

El repartidor acaba de iniciar ruta hacia tu ubicación. Muchas gracias por tu paciencia con nosotros ❤️.`;
      } else {
        sofiaResponse = data.whatsappReply || `¡Hola! Con mucho gusto te atiende Sofía 💧. Tu pedido ha sido registrado con éxito en Agua YA y tu repartidor va en camino.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'BOT',
          text: sofiaResponse,
          time: botTime,
        },
      ]);
      onOrderCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const netlifyCodeSnippet = `// netlify/functions/whatsapp-sofia-bot.js
// Netlify Function: AI Agent 'Sofía' (Secretaria Virtual Empática) + Agua YA Webhook

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const payload = JSON.parse(event.body);
    const clientPhone = payload.from || '3000000000';
    const clientMessage = payload.text || '';
    const clientName = payload.name || 'Cliente';

    // 1. Detectar intención y tono (Manejo de Cliente Molesto con Empatía)
    const isAngry = /molesto|esperando|tarde|demora|mal servicio|pésimo/i.test(clientMessage);

    // 2. Enviar Webhook a Agua YA para crear el pedido y asignar repartidor GPS
    const resAguaYa = await fetch('https://tu-dominio-aguaya.vercel.app/api/webhooks/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteNombre: clientName,
        clienteTelefono: clientPhone,
        clienteDireccion: clientMessage,
        cantidadBotellones: 2,
        metodoPago: 'EFECTIVO'
      })
    });

    const data = await resAguaYa.json();

    // 3. Respuesta empática de Sofía (Secretaria Virtual)
    let replyText = "";
    if (isAngry) {
      replyText = \`Entiendo perfectamente tu molestia y te pido disculpas sinceras 🙏. En Agua YA tu tranquilidad es nuestra prioridad.

Ya priorizamos tu pedido en el sistema:
📦 Pedido Prioritario #\${data.pedido.numeroPedido}
🚚 Repartidor Asignado: \${data.pedido.repartidor} (¡En ruta exclusiva!)
📍 Dirección: \${clientMessage}

Llegará en aprox. 8 minutos. ¿Te puedo colaborar con algo más? ❤️\`;
    } else {
      replyText = data.whatsappReply;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ messaging_product: "whatsapp", to: clientPhone, text: { body: replyText } })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm">
              <HeartHandshake className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Sofía - Secretaria Virtual Empática (AI + Netlify)</h3>
              <p className="text-xs text-emerald-200">Manejo natural e inclusivo de clientes molestos y cierre de venta</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Preset Controls */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 px-6">
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'CHAT'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>📱 Vista Chat Celular</span>
            </button>
            <button
              onClick={() => setActiveTab('NETLIFY_CODE')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'NETLIFY_CODE'
                  ? 'bg-white text-sky-800 shadow-xs border border-slate-200 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>⚡ Código Netlify Sofía</span>
            </button>
          </div>

          {/* Quick Preset Button */}
          {activeTab === 'CHAT' && (
            <button
              onClick={loadUpsetClientScenario}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 animate-pulse"
            >
              <AlertCircle className="w-4 h-4 text-rose-200" />
              <span>🔥 Cargar Escenario: Cliente Molesto</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'CHAT' ? (
            <div className="space-y-4">
              {/* WhatsApp Smartphone Frame */}
              <div className="bg-[#e5ddd5] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl max-w-sm mx-auto flex flex-col h-[490px] relative">
                {/* Phone Top Bar */}
                <div className="bg-[#075e54] text-white p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm border-2 border-white shadow-xs">
                      👩🏻‍💼
                    </div>
                    <div>
                      <p className="font-black text-sm leading-tight flex items-center gap-1">
                        <span>Sofía (Agua YA)</span>
                        <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 rounded font-medium">Oficina</span>
                      </p>
                      <p className="text-[10px] text-emerald-200 font-medium">En línea | Atención empática 24/7</p>
                    </div>
                  </div>
                </div>

                {/* Messages Chat Stream */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'CLIENT' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          msg.sender === 'CLIENT'
                            ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200/50'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                          <span>{msg.time}</span>
                          {msg.sender === 'CLIENT' && <CheckCheck className="w-3 h-3 text-sky-600" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start">
                      <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-none text-xs text-slate-500 shadow-xs border border-slate-200 animate-pulse flex items-center gap-1.5">
                        <span>Sofía está escribiendo con atención...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="bg-slate-100 p-2 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe o prueba ponerte molesto..."
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#075e54] hover:bg-[#064e46] text-white rounded-full transition shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Código Netlify Function: Bot Sofía</h4>
                  <p className="text-xs text-slate-500">Manejo de clientes molestos + Webhook Agua YA</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(netlifyCodeSnippet);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-96 shadow-inner border border-slate-800 leading-relaxed">
                <pre>{netlifyCodeSnippet}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Perfecto para grabar el video demo de 2 minutos para tus clientes</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
          >
            Cerrar Demostración
          </button>
        </div>
      </div>
    </div>
  );
}
