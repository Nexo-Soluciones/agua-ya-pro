'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DriverView } from '@/components/DriverView';
import { NewOrderModal } from '@/components/NewOrderModal';
import { GatekeeperAuthScreen } from '@/components/GatekeeperAuthScreen';
import {
  requestNotificationPermission,
  sendPushNotification,
  playNotificationSound,
} from '@/lib/notifications';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'UNAUTHENTICATED' | string>('UNAUTHENTICATED');
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isInitialAuthChecked, setIsInitialAuthChecked] = useState(false);

  const prevOrdersCountRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const currentRoleRef = useRef(currentRole);
  const lastAlertedMinuteMapRef = useRef<Record<number, number>>({});

  useEffect(() => {
    currentRoleRef.current = currentRole;
  }, [currentRole]);

  // Check initial authentication state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeDriverId = localStorage.getItem('agua_ya_active_driver_id');
      const isAdminAuth = localStorage.getItem('aguaya_admin_authenticated') === 'true';

      if (activeDriverId) {
        setCurrentRole(activeDriverId);
      } else if (isAdminAuth) {
        setCurrentRole('ADMIN');
      } else {
        setCurrentRole('UNAUTHENTICATED');
      }
      setIsInitialAuthChecked(true);
    }
  }, []);

  // Request Notification Permissions on load
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManual) setIsRefreshing(true);

    try {
      const [ordersRes, driversRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/drivers'),
      ]);

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();

        // Check if new order arrived
        if (
          prevOrdersCountRef.current !== null &&
          ordersData.length > prevOrdersCountRef.current
        ) {
          const newestOrder = ordersData[0];
          playNotificationSound('NEW_ORDER');

          sendPushNotification(
            `🔔 ¡Nuevo Pedido #${newestOrder.numeroPedido}!`,
            {
              body: `${newestOrder.cantidadBotellones} Botellón(es) para ${newestOrder.cliente.nombre} (${newestOrder.cliente.direccion})`,
            }
          );
        }

        prevOrdersCountRef.current = ordersData.length;

        // Check for delayed orders (> 90 minutes / 1h 30m in EN_CAMINO)
        // Recordatorio acústico y notificación push EXCLUSIVAMENTE para repartidores sobre sus pedidos asignados.
        // Los usuarios administrativos quedan 100% libres del sonido de alarma.
        const now = new Date().getTime();
        const role = currentRoleRef.current;
        const isDriver = role !== 'ADMIN' && role !== 'UNAUTHENTICATED';
        const activeDriverId = isDriver ? parseInt(role, 10) : null;

        ordersData.forEach((order: any) => {
          if (order.estadoEntrega !== 'EN_CAMINO' && lastAlertedMinuteMapRef.current[order.id]) {
            delete lastAlertedMinuteMapRef.current[order.id];
          }

          if (order.estadoEntrega === 'EN_CAMINO' && order.updatedAt) {
            const updatedTime = new Date(order.updatedAt).getTime();
            const minutesInRoute = Math.floor((now - updatedTime) / 60000);

            // Recordatorio exclusivo para el repartidor asignado a este pedido
            if (
              isDriver &&
              activeDriverId &&
              order.repartidorId === activeDriverId &&
              minutesInRoute >= 90 &&
              minutesInRoute % 15 === 0
            ) {
              const lastAlerted = lastAlertedMinuteMapRef.current[order.id];
              if (lastAlerted !== minutesInRoute) {
                lastAlertedMinuteMapRef.current[order.id] = minutesInRoute;
                playNotificationSound('DELAY_ALERT');
                sendPushNotification(
                  `🔔 Recordatorio de Entrega: Pedido #${order.numeroPedido}`,
                  {
                    body: `Lleva ${minutesInRoute} minutos en ruta. Recuerda entregar o reportar novedades.`,
                  }
                );
              }
            }
          }
        });

        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      isFetchingRef.current = false;
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic polling (every 6 seconds)
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 6000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateOrder = async (
    orderId: number,
    data: {
      estadoEntrega?: string;
      repartidorId?: number | null;
      estadoPago?: string;
      metodoPago?: string;
      comprobanteRef?: string;
      numeroRemision?: string;
      numeroFactura?: string | null;
      notasEntrega?: string;
      cantidadBotellones?: number;
      montoTotal?: number;
      precioUnitario?: number;
    }
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const activeDriver =
    currentRole !== 'ADMIN' && currentRole !== 'UNAUTHENTICATED'
      ? drivers.find((d) => d.id === parseInt(currentRole, 10)) || {
          id: parseInt(currentRole, 10) || 1,
          nombre: `Repartidor #${currentRole}`,
          telefono: '3000000000',
        }
      : null;

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden">
      {/* Crystalline Water Animated Background with Glassmorphism */}
      <div className="water-bg-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/water-bg.jpg"
          alt="Water Background"
          className="water-bg-image"
        />
        <div className="water-bg-overlay" />
        <div className="water-wave-1" />
        <div className="water-wave-2" />
        <div className="water-bubble bubble-1" />
        <div className="water-bubble bubble-2" />
        <div className="water-bubble bubble-3" />
        <div className="water-bubble bubble-4" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col">
        {currentRole !== 'UNAUTHENTICATED' && (
          <Header
            currentRole={currentRole}
            setCurrentRole={setCurrentRole}
            drivers={drivers}
            onRefresh={fetchData}
            isRefreshing={isRefreshing}
          />
        )}

        <main className="flex-1 pb-12">
          {currentRole === 'UNAUTHENTICATED' ? (
            <GatekeeperAuthScreen
              drivers={drivers}
              onAuthenticatedAsAdmin={() => setCurrentRole('ADMIN')}
              onAuthenticatedAsDriver={(driverId) => setCurrentRole(driverId.toString())}
            />
          ) : currentRole === 'ADMIN' ? (
            <AdminDashboard
              orders={orders}
              drivers={drivers}
              onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
              onRefreshDrivers={fetchData}
              onUpdateOrder={handleUpdateOrder}
            />
          ) : activeDriver ? (
            <DriverView
              driver={activeDriver}
              orders={orders}
              onUpdateOrder={handleUpdateOrder}
            />
          ) : (
            <GatekeeperAuthScreen
              drivers={drivers}
              onAuthenticatedAsAdmin={() => setCurrentRole('ADMIN')}
              onAuthenticatedAsDriver={(driverId) => setCurrentRole(driverId.toString())}
            />
          )}
        </main>
      </div>

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={fetchData}
        drivers={drivers}
      />
    </div>
  );
}

