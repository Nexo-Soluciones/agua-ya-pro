'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if already installed / running in standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if dismissed previously today
    const dismissedAt = localStorage.getItem('aguaya_pwa_dismissed');
    if (dismissedAt) {
      const timeDiff = Date.now() - parseInt(dismissedAt, 10);
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    // Android & Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || isDismissed) {
    return null;
  }

  // If not iOS and no install prompt available yet, don't show
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó instalar la aplicación');
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('aguaya_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-400/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Instalar App Repartidor</p>
              <p className="text-xs text-sky-200/80">Acceso rápido a pantalla completa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-400 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl border border-sky-500/30 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-sky-400">Instalar en iPhone</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ol className="space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                  1
                </span>
                <span>
                  Toca el botón <strong className="text-sky-300">Compartir</strong>{' '}
                  <Share2 className="inline h-4 w-4 text-sky-400" /> en la barra inferior de Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                  2
                </span>
                <span>
                  Baja y selecciona <strong className="text-sky-300">Agregar a pantalla de inicio</strong>{' '}
                  <PlusSquare className="inline h-4 w-4 text-sky-400" />.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                  3
                </span>
                <span>
                  Toca <strong className="text-sky-300">Agregar</strong> en la esquina superior derecha. ¡Listo!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-sky-500 py-2.5 font-bold text-white transition hover:bg-sky-400"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
