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
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Brand Gradient & Uploaded Logo */}
        <div className="bg-gradient-to-r from-[#123c2d] via-[#1a4a38] to-[#123c2d] p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-sm cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md flex-shrink-0 flex items-center justify-center border border-white/20">
              <img 
                src="/icon-192.png" 
                alt="LiSAN Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4a017]/25 text-[#f3ca52] text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-[#d4a017]/30">
                ✦ Easy 1-Step Install
              </div>
              <h2 className="text-xl font-black tracking-tight text-white leading-tight">Install LiSAN App</h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Works offline on any iPhone, Android, or PC
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Quick Perks */}
          <div className="flex items-center justify-around bg-[#faf7f2] border border-amber-900/10 rounded-2xl p-2 text-center text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#123c2d]">
              <span className="text-base">⚡</span> No App Store needed
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5 font-bold text-[#123c2d]">
              <span className="text-base">📡</span> Reads Offline
            </div>
          </div>

          {/* If already running in standalone mode */}
          {isInstalled ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
              <span className="text-3xl block">🎉</span>
              <h4 className="text-base font-extrabold text-emerald-950">LiSAN is Already Installed!</h4>
              <p className="text-xs text-emerald-800">
                You are currently running the full app on your device with offline support enabled.
              </p>
            </div>
          ) : (
            <>
              {/* 1-Click Fast Button (shown when browser supports prompt) */}
              {canPrompt && (
                <button
                  type="button"
                  onClick={handle1ClickInstall}
                  disabled={installing}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#123c2d] to-[#1e5842] hover:from-[#1a4a38] hover:to-[#256c52] text-white font-black text-sm shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <span className="text-lg">📲</span>
                  <span>{installing ? 'Setting up…' : success ? '✓ Installed!' : 'Tap Here to Install App (1 Tap)'}</span>
                </button>
              )}

              {/* Simple Device Switcher */}
              <div className="pt-1">
                <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform('ios')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlatform === 'ios'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>🍏</span> iPhone / iPad
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform('android')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlatform === 'android'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>🤖</span> Android
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform('desktop')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlatform === 'desktop'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>💻</span> PC / Mac
                  </button>
                </div>
              </div>

              {/* ── IPHONE INSTRUCTIONS ── */}
              {selectedPlatform === 'ios' && (
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#123c2d]">
                    Takes only 5 seconds on iPhone:
                  </p>

                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-[#123c2d] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs text-gray-800 leading-snug">
                      In <strong>Safari</strong>, tap the <strong className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-900 border border-gray-200">Share button ⎋</strong> at the bottom.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-[#123c2d] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs text-gray-800 leading-snug">
                      Scroll down and tap <strong className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-900 border border-gray-200">Add to Home Screen ⊞</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-[#123c2d] text-[#d4a017] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="text-xs text-gray-800 leading-snug">
                      Tap <strong className="text-emerald-700 font-bold">Add</strong> (top right). LiSAN is now on your home screen!
                    </div>
                  </div>
                </div>
              )}

              {/* ── ANDROID INSTRUCTIONS ── */}
              {selectedPlatform === 'android' && (
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#123c2d]">
                    Quick Android Install:
                  </p>

                  {canPrompt ? (
                    <button
                      type="button"
                      onClick={handle1ClickInstall}
                      className="w-full py-3 px-4 rounded-xl bg-[#123c2d] hover:bg-[#1a4a38] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>📲</span> Tap to Add to Home Screen
                    </button>
                  ) : (
                    <div className="space-y-2 text-xs text-gray-700">
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="font-bold text-[#123c2d]">1.</span>
                        <span>Tap the <strong>⋮ Menu (three dots)</strong> in Chrome at the top right.</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-100 shadow-xs">
                        <span className="font-bold text-[#123c2d]">2.</span>
                        <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── DESKTOP INSTRUCTIONS ── */}
              {selectedPlatform === 'desktop' && (
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#123c2d]">
                    Computer App:
                  </p>

                  {canPrompt ? (
                    <button
                      type="button"
                      onClick={handle1ClickInstall}
                      className="w-full py-3 px-4 rounded-xl bg-[#123c2d] hover:bg-[#1a4a38] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>💻</span> Install LiSAN on PC / Mac
                    </button>
                  ) : (
                    <div className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-1">
                      <p>In Chrome or Edge, click the <strong>Install icon ⊕ / 💻</strong> in your address bar.</p>
                      <p className="text-gray-500 text-[11px]">LiSAN opens in its own window pinned to your taskbar.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer close */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
              Close
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
    return Date.now() - time < 24 * 60 * 60 * 1000;
  });

  if (isInstalled || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('lisan_install_pill_dismissed', Date.now().toString());
  };

  return (
    <>
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div 
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-2.5 bg-gradient-to-r from-[#123c2d] to-[#1a4a38] text-white pl-3 pr-2 py-2 rounded-full shadow-xl border border-[#d4a017]/40 hover:border-[#d4a017] transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-full bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs">
            <img src="/icon-192.png" alt="LiSAN" className="w-full h-full object-contain" />
          </div>
          <div className="text-left pr-1">
            <p className="text-[11px] font-black tracking-wide leading-none text-white">
              {isIOS ? 'Install on iPhone' : canPrompt ? 'Install LiSAN' : 'Download App'}
            </p>
            <p className="text-[9px] text-[#f3ca52] leading-tight font-medium mt-0.5">
              1-tap simple install
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-5 h-5 rounded-full hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center text-[10px] ml-1 transition-colors cursor-pointer"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
