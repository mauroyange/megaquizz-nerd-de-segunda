// Detecção do ambiente onde o jogo corre: navegador, PWA instalada ou app Android (Capacitor).

/** Link fixo para o APK mais recente publicado no GitHub Releases. */
export const APK_URL = 'https://github.com/mauroyange/megaquizz-nerd-de-segunda/releases/latest/download/MegaQuizz.apk';

export function isNativeApp(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function isAndroidBrowser(): boolean {
  return /Android/i.test(navigator.userAgent) && !isNativeApp();
}

/** Regista o service worker só no site publicado (não na app nativa nem em desenvolvimento). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || isNativeApp() || !('serviceWorker' in navigator)) return;
  if (!document.querySelector('link[rel="manifest"]')) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sem service worker: o jogo continua a funcionar online */
    });
  });
}

/** Endereço público do jogo (usado nas partilhas). */
export const GAME_URL = 'https://mauroyange.github.io/megaquizz-nerd-de-segunda/';
export const GAME_URL_SHORT = 'bit.ly/megaquizz-nerd';
