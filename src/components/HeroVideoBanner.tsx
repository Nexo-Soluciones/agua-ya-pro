'use client';

import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Sparkles,
  ShieldCheck,
  Truck,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HeroVideoBannerProps {
  onOpenNewOrder?: () => void;
  totalBottlesToday?: number;
  activeDriversCount?: number;
}

export function HeroVideoBanner({
  onOpenNewOrder,
  totalBottlesToday = 0,
  activeDriversCount = 0,
}: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-mac-dark text-white">
      {/* Top Controls Bar */}
      <div className="px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 backdrop-blur-md flex items-center justify-between border-b border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shadow-sm shadow-sky-500/20">
            <Droplets className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base sm:text-lg tracking-tight text-white">
              AGUA <span className="text-sky-400">YA</span>
            </span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="hidden sm:inline text-xs font-semibold text-sky-200">
              Despacho & Distribución de Botellones
            </span>
          </div>
        </div>

        {/* Video Player Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Controls */}
          <button
            onClick={toggleMute}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold backdrop-blur-sm transition flex items-center gap-1.5 text-sky-100 border border-white/15 shadow-sm"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            <span>{isMuted ? 'Sin Audio' : 'Con Audio'}</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs backdrop-blur-sm transition text-sky-100 border border-white/15"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-300" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs backdrop-blur-sm transition text-sky-100 border border-white/15"
            title="Pantalla Completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Minimize / Maximize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-xs backdrop-blur-sm transition text-sky-200 border border-sky-400/30 ml-1"
            title={isMinimized ? 'Expandir Banner' : 'Minimizar Banner'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Section */}
      {!isMinimized && (
        <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-black overflow-hidden flex items-center justify-center">
          {/* Video Element */}
          <video
            ref={videoRef}
            src="/videos/botellon-promo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
          />

          {/* Vignette & Contrast Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-transparent to-slate-950/75 pointer-events-none" />

          {/* Overlay Content */}
          <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5 pointer-events-none">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/30 text-sky-200 border border-sky-400/40 backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  Botellón 20L Purificado
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Calidad & Pureza Garantizada
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 backdrop-blur-md">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  Logística Express
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg tracking-tight leading-tight">
                Agua Purificada de Alta Calidad & Despacho Inmediato
              </h3>
              <p className="text-sm sm:text-base text-slate-200 drop-shadow font-medium leading-relaxed">
                Monitoreo en vivo de pedidos, asignación rápida de rutas y despacho inteligente para empresas y hogares.
              </p>
            </div>

            {onOpenNewOrder && (
              <div className="pointer-events-auto shrink-0">
                <button
                  onClick={onOpenNewOrder}
                  className="px-5 py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-sky-500/30 hover:scale-[1.03] active:scale-[0.97] transition flex items-center gap-2.5 backdrop-blur-sm border border-sky-300/40"
                >
                  <Droplets className="w-5 h-5 fill-white" />
                  <span>Crear Pedido de Botellón</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
