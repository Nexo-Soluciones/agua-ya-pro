'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, MoreVertical } from 'lucide-react';

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if already installed / running in standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect OS & mobile environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const mobileScreen = window.innerWidth <= 820;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isIosDevice || isAndroidDevice || mobileScreen);

    // Check if dismissed in this session
    const dismissedInSession = sessionStorage.getItem('aguaya_pwa_dismissed') === 'true';
    setIsDismissed(dismissedInSession);

    // Android & Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt capturado con éxito');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // If running installed or dismissed in session, do not render
  if (isStandalone || isDismissed) {
    return null;
  }

  // Show banner on mobile or if deferred prompt is available
  if (!isMobile && !deferredPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('[PWA] Usuario aceptó instalar la app');
          setDeferredPrompt(null);
          setIsDismissed(true);
          return;
        }
      } catch (err) {
        console.warn('[PWA] Error disparando prompt nativo:', err);
      }
    }

    // If no direct prompt, show step-by-step visual guide
    setShowGuide(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('aguaya_pwa_dismissed', 'true');
  };

  return (
    <>
      <div className="fixed bottom-3 left-3 right-3 z-[9999] mx-auto max-w-md transition-all duration-300">
        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-sky-400 bg-slate-900/98 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/30">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Instalar App Repartidor</p>
              <p className="text-xs text-sky-300">Modo nativo a pantalla completa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/40 transition-all hover:bg-sky-400 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Guide Modal (Android or iOS fallback) */}
      {showGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl border border-sky-500/40 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-bold text-sky-400">
                  {isIOS ? 'Instalar en iPhone' : 'Instalar en tu Celular'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isIOS ? (
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
                    Baja y toca <strong className="text-sky-300">Agregar a pantalla de inicio</strong>{' '}
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
            ) : (
              <ol className="space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                    1
                  </span>
                  <span>
                    Toca el menú de <strong className="text-sky-300">3 puntos</strong>{' '}
                    <MoreVertical className="inline h-4 w-4 text-sky-400" /> en la esquina superior de Chrome.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                    2
                  </span>
                  <span>
                    Selecciona <strong className="text-sky-300">Instalar aplicación</strong> (o <em>"Agregar a la pantalla principal"</em>).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-bold text-sky-400">
                    3
                  </span>
                  <span>
                    Confirma en <strong className="text-sky-300">Instalar</strong>. La app se abrirá automáticamente sin barra de navegador.
                  </span>
                </li>
              </ol>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full rounded-xl bg-sky-500 py-3 font-bold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

