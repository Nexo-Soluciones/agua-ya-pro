/**
 * Helper library for Web Push Notifications & Audio Chimes
 */

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function sendPushNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notificationOptions: any = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      };

      const notification = new Notification(title, notificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Push Notification error:', e);
    }
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        sendPushNotification(title, options);
      }
    });
  }
}

/**
 * Sintetizador acústico de gotas y burbujas de agua usando Web Audio API
 * Genera el sonido físico "plop / bloop" de gotas de agua sin depender de archivos externos
 */
function synthesizeWaterDroplet(
  ctx: AudioContext,
  startTime: number,
  startFreq: number = 380,
  peakFreq: number = 1450,
  duration: number = 0.13,
  volume: number = 0.35
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';

  // Curva de frecuencia característica del choque hidrodinámico de una gota de agua ("bloop")
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(peakFreq, startTime + duration * 0.65);
  osc.frequency.exponentialRampToValueAtTime(peakFreq * 0.88, startTime + duration);

  // Envolvente de amplitud rápida y natural
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Play notification sound chime using Web Audio API (efectos acuáticos puros)
export function playNotificationSound(type: 'NEW_ORDER' | 'DELAY_ALERT' = 'NEW_ORDER') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'NEW_ORDER') {
      // Doble gota de agua cristalina y refrescante (Plop - Plop)
      synthesizeWaterDroplet(ctx, now, 420, 1400, 0.12, 0.35);
      synthesizeWaterDroplet(ctx, now + 0.13, 560, 1850, 0.15, 0.4);
    } else {
      // 🚨 Alerta de Retraso Acuática: Cascada de 4 gotas de advertencia rápidas con eco de agua
      synthesizeWaterDroplet(ctx, now, 480, 1650, 0.11, 0.45);
      synthesizeWaterDroplet(ctx, now + 0.13, 650, 2050, 0.11, 0.5);
      synthesizeWaterDroplet(ctx, now + 0.26, 850, 2500, 0.12, 0.55);
      synthesizeWaterDroplet(ctx, now + 0.40, 580, 1800, 0.18, 0.38);

      // Resonancia suave de onda de agua de fondo
      const rippleOsc = ctx.createOscillator();
      const rippleGain = ctx.createGain();
      rippleOsc.type = 'sine';
      rippleOsc.frequency.setValueAtTime(520, now + 0.1);
      rippleOsc.frequency.exponentialRampToValueAtTime(260, now + 0.6);

      rippleGain.gain.setValueAtTime(0.001, now);
      rippleGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      rippleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      rippleOsc.connect(rippleGain);
      rippleGain.connect(ctx.destination);

      rippleOsc.start(now);
      rippleOsc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}
