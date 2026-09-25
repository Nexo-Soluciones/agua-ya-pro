'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Zap } from 'lucide-react';

interface DriverLocation {
  id: number;
  nombre: string;
  telefono: string;
  lat: number | null;
  lng: number | null;
  speed?: number | null;
  heading?: number | null;
  lastLocationUpdate?: string | null;
  pedidosAsignados?: any[];
}

interface LiveDriverMapProps {
  drivers: DriverLocation[];
}

export function LiveDriverMap({ drivers }: LiveDriverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});
  const [isSeedingGps, setIsSeedingGps] = useState(false);

  // Comprueba si un repartidor está realmente conectado y transmitiendo en vivo (últimos 2 minutos)
  const isDriverOnline = (driver: DriverLocation) => {
    if (driver.lat === null || driver.lng === null || !driver.lastLocationUpdate) return false;
    const lastUpdateMs = new Date(driver.lastLocationUpdate).getTime();
    const nowMs = new Date().getTime();
    return nowMs - lastUpdateMs < 120000; // 2 minutos
  };

  const onlineDrivers = drivers.filter(isDriverOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const L = window.L;
      if (!L || !mapContainerRef.current) return;

      const defaultCenter: [number, number] =
        onlineDrivers.length > 0
          ? [onlineDrivers[0].lat!, onlineDrivers[0].lng!]
          : [7.8939, -72.5078]; // Coordenadas de Cúcuta

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current).setView(defaultCenter, 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        leafletMapRef.current = map;
      }

      const map = leafletMapRef.current;

      // Limpiar marcadores de repartidores que ya no están online
      Object.keys(markersRef.current).forEach((driverIdStr) => {
        const driverId = parseInt(driverIdStr, 10);
        if (!onlineDrivers.some((d) => d.id === driverId)) {
          map.removeLayer(markersRef.current[driverId]);
          delete markersRef.current[driverId];
        }
      });

      // Renderizar o actualizar marcadores de repartidores online
      onlineDrivers.forEach((driver) => {
        if (driver.lat === null || driver.lng === null) return;

        const activeOrder =
          driver.pedidosAsignados && driver.pedidosAsignados.length > 0
            ? driver.pedidosAsignados[0]
            : null;

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 200px;">
            <div style="font-weight: 900; color: #0f172a; font-size: 14px;">
              🚚 ${driver.nombre}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Teléfono: ${driver.telefono}
            </div>
            <div style="font-size: 10px; color: #059669; font-weight: bold; margin-top: 2px;">
              🟢 Conectado en tiempo real
            </div>
            ${
              activeOrder
                ? `<div style="margin-top: 8px; padding: 6px; background: #e0f2fe; border-radius: 8px; font-size: 11px; color: #0369a1;">
                    <strong>En ruta a:</strong> ${activeOrder.cliente?.nombre || 'Entrega'}<br/>
                    📍 ${activeOrder.cliente?.direccion}
                  </div>`
                : `<div style="margin-top: 6px; font-size: 11px; color: #059669; font-weight: bold;">
                    ✅ Sin entregas pendientes
                  </div>`
            }
          </div>
        `;

        if (markersRef.current[driver.id]) {
          markersRef.current[driver.id].setLatLng([driver.lat, driver.lng]);
          markersRef.current[driver.id].setPopupContent(popupContent);
        } else {
          const customIcon = L.divIcon({
            className: 'custom-driver-pin',
            html: `
              <div style="
                background: #059669;
                color: white;
                padding: 6px 10px;
                border-radius: 20px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                font-weight: 800;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 4px;
                white-space: nowrap;
                border: 2px solid white;
              ">
                <span>🚚</span>
                <span>${driver.nombre}</span>
              </div>
            `,
            iconSize: [95, 30],
            iconAnchor: [47, 15],
          });

          const marker = L.marker([driver.lat, driver.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(popupContent);

          markersRef.current[driver.id] = marker;
        }
      });
    };

    initMap();
  }, [onlineDrivers]);

  const handleSimulateGps = async () => {
    setIsSeedingGps(true);
    try {
      const res = await fetch('/api/drivers/seed-gps', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeedingGps(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${onlineDrivers.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            <Navigation className={`w-6 h-6 ${onlineDrivers.length > 0 ? 'animate-pulse text-emerald-600' : ''}`} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Mapa de Repartidores en Tiempo Real</h3>
            <p className="text-xs text-slate-500">
              {onlineDrivers.length > 0 ? (
                <span className="text-emerald-700 font-bold">
                  🟢 {onlineDrivers.length} de {drivers.length} repartidores conectados y transmitiendo GPS
                </span>
              ) : (
                <span className="text-slate-500 font-medium">
                  ⚪ Ningún repartidor conectado en este momento (Esperando conexión del móvil)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateGps}
            disabled={isSeedingGps}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Activar coordenadas ficticias solo para grabar demostraciones"
          >
            <Zap className="w-4 h-4 text-sky-200" />
            <span>{isSeedingGps ? 'Cargando GPS...' : '⚡ Activar Simulación GPS (Para Demos)'}</span>
          </button>
        </div>
      </div>

      {/* Driver Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {drivers.map((driver) => {
          const isOnline = isDriverOnline(driver);
          const activeOrdersCount = driver.pedidosAsignados?.length || 0;

          return (
            <div
              key={driver.id}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                isOnline ? 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white font-black text-xs ${isOnline ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300 text-slate-600'}`}>
                  🚚
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{driver.nombre}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block w-max ${
                      isOnline ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isOnline ? '🟢 En Línea (GPS)' : '⚪ Desconectado'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {activeOrdersCount} pedido{activeOrdersCount !== 1 ? 's' : ''} asignado{activeOrdersCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Display */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden relative min-h-[420px] flex flex-col">
        <div ref={mapContainerRef} className="w-full h-[450px] z-10" />

        {onlineDrivers.length === 0 && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 pointer-events-none">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
              <Navigation className="w-10 h-10 text-sky-200" />
            </div>
            <h4 className="font-extrabold text-xl">Ningún repartidor conectado en este momento</h4>
            <p className="text-xs text-sky-100 max-w-md">
              Apenas un repartidor ingrese a la aplicación desde su teléfono móvil (ej. <strong>Repartidor 1</strong>), su ubicación GPS se transmitirá en tiempo real y aparecerá aquí automáticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
declare global {
  interface Window {
    L: any;
  }
}
