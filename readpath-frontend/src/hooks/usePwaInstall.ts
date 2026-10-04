import { useState, useEffect } from 'react';

export interface PwaInstallState {
  isInstalled: boolean;
  canPrompt: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  promptInstall: () => Promise<boolean>;
}

let globalDeferredPrompt: any = null;
const listeners = new Set<() => void>();

// Register global listener once
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach(fn => fn());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach(fn => fn());
  });
}

export function usePwaInstall(): PwaInstallState {
  const [promptAvailable, setPromptAvailable] = useState<boolean>(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  useEffect(() => {
    const update = () => {
      setPromptAvailable(!!globalDeferredPrompt);
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(standalone);
    };

    listeners.add(update);
    update();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      listeners.delete(update);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  const promptInstall = async (): Promise<boolean> => {
    if (!globalDeferredPrompt) {
      return false;
    }
    try {
      globalDeferredPrompt.prompt();
      const choice = await globalDeferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        globalDeferredPrompt = null;
        setPromptAvailable(false);
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Install prompt error:', err);
      return false;
    }
  };

  return {
    isInstalled,
    canPrompt: promptAvailable,
    isIOS,
    isAndroid,
    isDesktop,
    promptInstall
  };
}
