'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  UserCheck,
  AlertCircle,
  Phone,
  MapPin,
  Truck,
  CheckCircle2,
  Trash2,
  Package,
  Droplet,
  ShoppingBag,
  FileText,
} from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  drivers: Array<{ id: number; nombre: string; _count?: { pedidosAsignados: number } }>;
}

interface ProductItem {
  id: number;
  nombre: string;
  categoria: string;
  precioBase: number;
  preciosDisponibles?: string | null;
  icono?: string | null;
  descripcion?: string | null;
}

interface OrderCartItem {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  categoria: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 1, nombre: 'BOTELLON (20L)', categoria: 'BOTELLONES', precioBase: 10000, icono: '💧', preciosDisponibles: '[10500,10000,9500,9000,8933,8500,8000,7000,6000,5000]' },
  { id: 2, nombre: 'BOTELLON VC (Envase + Agua)', categoria: 'BOTELLONES', precioBase: 40000, icono: '🆕' },
  { id: 3, nombre: 'BANDEJA 620 ML', categoria: 'BANDEJAS', precioBase: 15000, icono: '📦' },
  { id: 4, nombre: 'BANDEJA 300 ML', categoria: 'BANDEJAS', precioBase: 14000, icono: '📦' },
  { id: 5, nombre: 'BANDEJA 250 ML', categoria: 'BANDEJAS', precioBase: 22000, icono: '📦' },
  { id: 6, nombre: 'BANDEJA 400 ML', categoria: 'BANDEJAS', precioBase: 14000, icono: '📦' },
  { id: 7, nombre: 'BANDEJA LITRO', categoria: 'BANDEJAS', precioBase: 16000, icono: '📦' },
  { id: 8, nombre: 'GARRAFA 5 L', categoria: 'GARRAFAS', precioBase: 3500, icono: '🪣' },
  { id: 9, PAQUETE: 'PAQUETE 360 ML', nombre: 'PAQUETE 360 ML', categoria: 'PAQUETES', precioBase: 3500, icono: '🥤' } as any,
  { id: 10, nombre: 'PERSONALIZADA', categoria: 'ESPECIAL', precioBase: 22000, icono: '🏷️' },
  { id: 11, nombre: 'DISPENSADOR DE AGUA', categoria: 'DISPENSADORES', precioBase: 40000, icono: '🚰' },
];

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
  const [precioAcordadoBotellon, setPrecioAcordadoBotellon] = useState<number>(7000);
  const [notasUbicacion, setNotasUbicacion] = useState('');
  const [requiereFactura, setRequiereFactura] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState('');

  // Products & Cart
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [cartItems, setCartItems] = useState<OrderCartItem[]>([
    {
      productoId: 1,
      nombreProducto: 'BOTELLON (20L)',
      cantidad: 1,
      precioUnitario: 7000,
      subtotal: 7000,
      categoria: 'BOTELLONES',
    },
  ]);

  const [repartidorId, setRepartidorId] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'NEQUI' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO');
  const [numeroRemision, setNumeroRemision] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Load products catalog
  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalogProducts(data);
        }
      })
      .catch(() => {
        setCatalogProducts(DEFAULT_PRODUCTS);
      });
  }, []);

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
    const agreedPrice = client.precioAcordado || (client.tipoCliente === 'NUEVO' ? 8000 : 7000);
    setPrecioAcordadoBotellon(agreedPrice);
    setNotasUbicacion(client.notasUbicacion || '');
    setRequiereFactura(Boolean(client.requiereFactura));
    setNumeroFactura(client.numeroFactura || '');
    setSearchResults([]);
    setSearchQuery('');

    // Update existing Botellon item price in cart
    setCartItems((prev) =>
      prev.map((item) =>
        item.nombreProducto.includes('BOTELLON (20L)')
          ? { ...item, precioUnitario: agreedPrice, subtotal: item.cantidad * agreedPrice }
          : item
      )
    );
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setNombre('');
    setTelefono('');
    setDireccion('');
    setBarrioSector('');
    setTipoCliente('NUEVO');
    setPrecioAcordadoBotellon(8000);
    setNotasUbicacion('');
    setRequiereFactura(false);
    setNumeroFactura('');
    setNumeroRemision('');
    setCartItems([
      {
        productoId: 1,
        nombreProducto: 'BOTELLON (20L)',
        cantidad: 1,
        precioUnitario: 8000,
        subtotal: 8000,
        categoria: 'BOTELLONES',
      },
    ]);
  };

  const addProductToCart = (product: ProductItem) => {
    const existingIndex = cartItems.findIndex((i) => i.productoId === product.id);
    const unitPrice =
      product.nombre === 'BOTELLON (20L)'
        ? precioAcordadoBotellon
        : product.precioBase;

    if (existingIndex > -1) {
      setCartItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          productoId: product.id,
          nombreProducto: product.nombre,
          cantidad: 1,
          precioUnitario: unitPrice,
          subtotal: unitPrice,
          categoria: product.categoria,
        },
      ]);
    }
  };

  const updateItemQty = (productoId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productoId === productoId) {
            const newQty = item.cantidad + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              cantidad: newQty,
              subtotal: newQty * item.precioUnitario,
            };
          }
          return item;
        })
        .filter(Boolean) as OrderCartItem[]
    );
  };

  const updateItemPrice = (productoId: number, newPrice: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productoId === productoId
          ? { ...item, precioUnitario: newPrice, subtotal: item.cantidad * newPrice }
          : item
      )
    );
  };

  const removeItemFromCart = (productoId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const grandTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const filteredCatalog = catalogProducts.filter((p) => {
    if (selectedCategory === 'TODOS') return true;
    if (selectedCategory === 'BOTELLONES') return p.categoria === 'BOTELLONES';
    if (selectedCategory === 'BANDEJAS') return p.categoria === 'BANDEJAS';
    if (selectedCategory === 'DISPENSADORES') return p.categoria === 'DISPENSADORES';
    if (selectedCategory === 'OTROS') return p.categoria === 'GARRAFAS' || p.categoria === 'PAQUETES' || p.categoria === 'ESPECIAL';
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setErrorMsg('Nombre, teléfono y dirección son campos obligatorios.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg('Debe agregar al menos un producto al pedido.');
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
          notasUbicacion,
          repartidorId: repartidorId || undefined,
          items: cartItems.map((item) => ({
            productoId: item.productoId,
            nombreProducto: item.nombreProducto,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
          })),
          metodoPago,
          numeroRemision: numeroRemision.trim() || undefined,
          creadoPor: typeof window !== 'undefined' ? (localStorage.getItem('aguaya_admin_name') || 'Administración') : 'Administración',
          requiereFactura,
          numeroFactura: requiereFactura ? numeroFactura.trim() || undefined : undefined,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Registrar Nuevo Pedido</h2>
              <p className="text-xs text-sky-100 font-medium">Catálogo Multiproducto & Despacho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sky-100 hover:text-white p-1.5 rounded-xl hover:bg-sky-500/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {successToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-sm font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¡Pedido registrado y asignado con éxito!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Search Existing Client */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Buscar Cliente (Teléfono o Nombre)
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
                placeholder="Escribe teléfono o nombre para autocompletar..."
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
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {client.requiereFactura && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                          📄 Factura {client.numeroFactura ? `#${client.numeroFactura}` : ''}
                        </span>
                      )}
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase shrink-0 ${
                        client.tipoCliente === 'VIEJO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {client.tipoCliente === 'VIEJO' ? `Frecuente ($${(client.precioAcordado || 7000).toLocaleString('es-CO')})` : 'Nuevo'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-emerald-900 text-xs sm:text-sm font-semibold">
                  <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Cliente: <strong>{selectedClient.nombre}</strong> (Tarifa: ${precioAcordadoBotellon.toLocaleString('es-CO')})</span>
                </div>
                {selectedClient.requiereFactura && (
                  <p className="text-xs text-emerald-800 font-bold pl-7 flex items-center gap-1">
                    📄 Factura Requerida: <span className="underline">{selectedClient.numeroFactura ? `#${selectedClient.numeroFactura}` : 'Sí'}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearSelectedClient}
                className="text-xs text-emerald-700 underline font-bold hover:text-emerald-900"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* 2. Client Details Section */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Datos del Cliente & Ubicación
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono / WhatsApp *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3001234567"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Facturación: Check Sí/No y Número de Factura */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>¿Factura?</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setRequiereFactura(false);
                      setNumeroFactura('');
                    }}
                    className={`px-3 py-0.5 rounded-md text-xs font-bold transition ${
                      !requiereFactura ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequiereFactura(true)}
                    className={`px-3 py-0.5 rounded-md text-xs font-bold transition ${
                      requiereFactura ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Sí
                  </button>
                </div>
              </div>
              {requiereFactura && (
                <div className="pt-1.5 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="Número de Factura (ej: 1045 o FAC-001)"
                    value={numeroFactura}
                    onChange={(e) => setNumeroFactura(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                  />
                </div>
              )}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Indicaciones de Ubicación</label>
                <input
                  type="text"
                  value={notasUbicacion}
                  onChange={(e) => setNotasUbicacion(e.target.value)}
                  placeholder="Ej. Casa blanca reja negra"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* 3. Products Catalogue & Cart Section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                3. Productos a Despachar
              </label>
              <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                {cartItems.reduce((s, i) => s + i.cantidad, 0)} ítems en pedido
              </span>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-xs">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'BOTELLONES', label: '💧 Botellones' },
                { id: 'BANDEJAS', label: '📦 Bandejas' },
                { id: 'DISPENSADORES', label: '🚰 Dispensadores' },
                { id: 'OTROS', label: '✨ Garrafas & Otros' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid for Quick Adding */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {filteredCatalog.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => addProductToCart(prod)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/50 text-left transition flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{prod.icono || '💧'}</span>
                    <span className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-sky-700">
                      {prod.nombre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-black text-sky-800">
                      ${prod.precioBase.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] bg-sky-500 text-white font-black px-1.5 py-0.5 rounded-md group-hover:bg-sky-600">
                      + Agregar
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Cart / Selected Items Table */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-1">
                Detalle del Pedido Actual:
              </span>

              {cartItems.map((item) => (
                <div
                  key={item.productoId}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-[140px] flex-1">
                    <span className="font-extrabold text-sm text-slate-900 block">
                      {item.nombreProducto}
                    </span>
                    {item.nombreProducto === 'BOTELLON (20L)' ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-500 font-semibold">Tarifa:</span>
                        <select
                          value={item.precioUnitario}
                          onChange={(e) => updateItemPrice(item.productoId, Number(e.target.value))}
                          className="text-xs font-black bg-sky-50 border border-sky-300 text-sky-900 rounded-lg px-2 py-0.5"
                        >
                          <option value={10500}>$10.500</option>
                          <option value={10000}>$10.000</option>
                          <option value={9500}>$9.500</option>
                          <option value={9000}>$9.000</option>
                          <option value={8933}>$8.933</option>
                          <option value={8500}>$8.500</option>
                          <option value={8000}>$8.000</option>
                          <option value={7000}>$7.000</option>
                          <option value={6000}>$6.000</option>
                          <option value={5000}>$5.000</option>
                        </select>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        ${item.precioUnitario.toLocaleString('es-CO')} c/u
                      </span>
                    )}
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.productoId, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-sm text-slate-900">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.productoId, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900 min-w-[70px] text-right">
                      ${item.subtotal.toLocaleString('es-CO')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemFromCart(item.productoId)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total Summary Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-600">Total a Cobrar:</span>
                <span className="text-xl font-black text-sky-700">
                  ${grandTotal.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          {/* 4. Dispatch & Payment Settings */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              4. Despacho & Pago
            </label>

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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Asignar Repartidor</label>
                <select
                  value={repartidorId}
                  onChange={(e) => setRepartidorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="">-- Asignar Luego --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} ({d._count?.pedidosAsignados || 0} pendientes)
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
                placeholder="Ej. REM-0428"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold shadow-md shadow-sky-600/20 transition flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Crear Pedido'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
