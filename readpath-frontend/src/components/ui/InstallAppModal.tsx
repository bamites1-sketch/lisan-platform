import React, { useState } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { isInstalled, canPrompt, isIOS, isAndroid, promptInstall } = usePwaInstall();
  
  // Default selected tab to detected platform
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });

  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handle1ClickInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emerald Gradient */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24513b] to-[#1a3a2a] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4a017] to-[#b88912] p-0.5 shadow-lg flex-shrink-0">
              <img 
                src="/icon-192.png" 
                alt="LiSAN Icon" 
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d4a017]/25 text-[#f3ca52] text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-[#d4a017]/30">
                <span>✦ Official Web App</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">Download LiSAN</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Install on any Phone, Tablet, or Desktop without an app store
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 text-center">
              <span className="text-lg block mb-1">⚡</span>
              <p className="text-[11px] font-bold text-[#1a3a2a]">Fast & Light</p>
              <p className="text-[9px] text-gray-500">Takes under 1 MB</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-2.5 text-center">
              <span className="text-lg block mb-1">📡</span>
              <p className="text-[11px] font-bold text-amber-900">Works Offline</p>
              <p className="text-[9px] text-gray-500">Read & record voice</p>
            </div>
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-2.5 text-center">
              <span className="text-lg block mb-1">📱</span>
              <p className="text-[11px] font-bold text-blue-900">Full Screen</p>
              <p className="text-[9px] text-gray-500">Native app feel</p>
            </div>
          </div>

          {/* If already running in standalone mode */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <span className="text-2xl">🎉</span>
              <h4 className="text-sm font-bold text-emerald-900">LiSAN is Already Installed!</h4>
              <p className="text-xs text-emerald-700">
                You are currently running the full standalone app version with offline reading support.
              </p>
            </div>
          ) : (
            <>
              {/* Direct 1-Click Install Button if browser supports it */}
              {canPrompt && (
                <div className="bg-gradient-to-r from-emerald-50 to-amber-50/40 border border-emerald-200 rounded-2xl p-4 text-center space-y-2.5">
                  <p className="text-xs font-semibold text-gray-700">
                    Your browser supports 1-click instant installation:
                  </p>
                  <button
                    onClick={handle1ClickInstall}
                    disabled={installing}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#1a3a2a] via-[#24513b] to-[#1a3a2a] hover:from-[#24513b] hover:to-[#2d6a4f] text-white font-extrabold text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <span>{installing ? '⏳ Setting up...' : success ? '✓ Installed!' : '📲 Install LiSAN App Now'}</span>
                  </button>
                </div>
              )}

              {/* Platform Selector Tabs */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Device Installation Guide:</p>
                <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
                  <button
                    onClick={() => setSelectedPlatform('ios')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      selectedPlatform === 'ios'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>🍏</span> iPhone / iPad
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('android')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      selectedPlatform === 'android'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>🤖</span> Android
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('desktop')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      selectedPlatform === 'desktop'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>💻</span> PC / Mac
                  </button>
                </div>
              </div>

              {/* Instructions by Platform */}
              {selectedPlatform === 'ios' && (
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs text-gray-700">
                      Open this website in <strong>Safari</strong> on your iPhone or iPad, then tap the <strong className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900">Share button ⎋</strong> at the bottom of the screen.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs text-gray-700">
                      Scroll down the menu and tap <strong className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900">Add to Home Screen ⊞</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs text-gray-700">
                      Tap <strong className="text-emerald-700 font-bold">Add</strong> in the top right. LiSAN will appear on your home screen with its own app icon!
                    </div>
                  </div>
                </div>
              )}

              {selectedPlatform === 'android' && (
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs text-gray-700">
                      Open in <strong>Chrome</strong>, <strong>Samsung Internet</strong>, or <strong>Edge</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs text-gray-700">
                      Tap the <strong className="bg-white px-1.5 py-0.5 rounded border border-gray-200">⋮ Menu (three dots)</strong> in the top right corner.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs text-gray-700">
                      Select <strong className="text-emerald-700 font-bold">"Install app"</strong> or <strong className="text-emerald-700 font-bold">"Add to Home screen"</strong>.
                    </div>
                  </div>
                </div>
              )}

              {selectedPlatform === 'desktop' && (
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs text-gray-700">
                      In <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, look at the right end of the address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs text-gray-700">
                      Click the <strong className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-900">Install icon ⊕ / 💻</strong> in the address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs text-gray-700">
                      Confirm <strong className="text-emerald-700 font-bold">"Install"</strong>. LiSAN launches in its own dedicated, clean window pinned to your taskbar or dock!
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer close button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Version 2.1.0 • PWA Standard</span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating Install Button Pill
 * Automatically disappears if already running inside installed standalone mode
 */
export function FloatingInstallPill() {
  const { isInstalled, canPrompt, isIOS } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    const item = localStorage.getItem('lisan_install_pill_dismissed');
    if (!item) return false;
    const time = parseInt(item, 10);
    return Date.now() - time < 24 * 60 * 60 * 1000; // 24 hours
  });

  if (isInstalled || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('lisan_install_pill_dismissed', Date.now().toString());
  };

  return (
    <>
      <div 
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div 
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-[#1a3a2a] to-[#24513b] text-white pl-3.5 pr-2.5 py-2.5 rounded-full shadow-xl border border-[#d4a017]/40 hover:border-[#d4a017] transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <div className="w-6 h-6 rounded-full bg-[#d4a017] text-[#1a3a2a] flex items-center justify-center text-xs font-black shadow-xs group-hover:rotate-12 transition-transform">
            📲
          </div>
          <div className="text-left pr-1">
            <p className="text-[11px] font-black tracking-wide leading-none text-white">
              {isIOS ? 'Add to Home Screen' : canPrompt ? 'Install LiSAN App' : 'Download App'}
            </p>
            <p className="text-[9px] text-[#f3ca52] leading-tight font-medium mt-0.5">
              Works offline on any device
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-5 h-5 rounded-full hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-[10px] ml-1 transition-colors"
            title="Hide for 24h"
          >
            ✕
          </button>
        </div>
      </div>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
