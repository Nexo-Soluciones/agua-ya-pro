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
      const role = currentRoleRef.current;
      const isUnauthenticated = role === 'UNAUTHENTICATED';
      const isDriver = !isUnauthenticated && role !== 'ADMIN';
      const activeDriverId = isDriver ? parseInt(role, 10) : null;

      // 1. In Gatekeeper / Login view: only load drivers once for the dropdown/PIN screen; DO NOT fetch orders!
      if (isUnauthenticated) {
        if (drivers.length === 0 || isManual) {
          const driversRes = await fetch('/api/drivers');
          if (driversRes.ok) {
            const driversData = await driversRes.json();
            setDrivers(driversData);
          }
        }
        return;
      }

      // 2. Determine fetch promises based on role
      const ordersUrl = activeDriverId && !isNaN(activeDriverId)
        ? `/api/orders?driverId=${activeDriverId}`
        : '/api/orders';

      // Drivers do not need the /api/drivers fleet array (only Admin uses it for the map and assignments)
      const fetchPromises: [Promise<Response>, Promise<Response | null>] = [
        fetch(ordersUrl),
        !isDriver ? fetch('/api/drivers') : Promise.resolve(null),
      ];

      const [ordersRes, driversRes] = await Promise.all(fetchPromises);

      if (driversRes && driversRes.ok) {
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
        const now = new Date().getTime();

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
  }, [drivers.length]);

  // Initial load and smart role-based periodic polling (pauses when tab is hidden or user unauthenticated)
  useEffect(() => {
    fetchData(true);

    // If unauthenticated, do NOT run polling interval (stops background quota drain on idle tabs)
    if (currentRole === 'UNAUTHENTICATED') {
      return;
    }

    // Role-tailored polling frequency: 15s for Admin, 25s for Driver in route
    const pollIntervalMs = currentRole === 'ADMIN' ? 15000 : 25000;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      fetchData(false);
    }, pollIntervalMs);

    // Immediate fetch when user returns to this tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData, currentRole]);

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
      operadorNombre?: string;
      cantidadBotellones?: number;
      montoTotal?: number;
      precioUnitario?: number;
      items?: Array<{ id: number; precioUnitario: number; cantidad?: number }>;
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
      {/* Crystalline Water Animated Background with Glassmorphism (Pure CSS, 0 KB bandwidth) */}
      <div className="water-bg-container">
        <div className="water-bg-gradient" />
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

