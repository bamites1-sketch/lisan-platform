import React, { useState, useEffect } from 'react'
import { getOfflineRecordings, syncPendingRecordings, type OfflineRecordingItem } from '../../lib/offlineSync'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { InstallAppModal } from './InstallAppModal'

export default function OfflinePwaBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const { isInstalled, canPrompt, isIOS } = usePwaInstall()
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingQueue, setPendingQueue] = useState<OfflineRecordingItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check offline queue
  const refreshQueue = async () => {
    const items = await getOfflineRecordings()
    setPendingQueue(items)
  }

  useEffect(() => {
    refreshQueue()
    const handleQueueUpdate = () => refreshQueue()
    window.addEventListener('lisan:offline-recordings-updated', handleQueueUpdate)
    return () => window.removeEventListener('lisan:offline-recordings-updated', handleQueueUpdate)
  }, [])

  // Trigger manual sync
  const handleManualSync = async () => {
    setIsSyncing(true)
    await syncPendingRecordings()
    await refreshQueue()
    setIsSyncing(false)
  }

  // Do not show banner if online, no queue items, and installed or dismissed
  if (isOnline && pendingQueue.length === 0 && (isInstalled || dismissed)) {
    return null
  }

  return (
    <>
      <div className="w-full bg-gradient-to-r from-emerald-950 via-[#1a3a2a] to-emerald-900 text-white px-4 py-2 text-xs border-b border-[#d4a017]/30 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left Status */}
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Offline Mode Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Back Online</span>
              </span>
            )}

            <span className="text-white/80 hidden sm:inline">
              {!isOnline
                ? 'Stories & passages are cached. Voice recordings will save locally and auto-sync when online.'
                : pendingQueue.length > 0
                ? `${pendingQueue.length} offline recording(s) ready to sync to your teacher.`
                : 'App ready for offline reading and assessments.'}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {pendingQueue.length > 0 && isOnline && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#d4a017] hover:bg-[#b88912] text-[#1a3a2a] font-bold rounded-lg transition-all cursor-pointer"
              >
                <span>{isSyncing ? '⏳ Syncing…' : `📤 Sync Now (${pendingQueue.length})`}</span>
              </button>
            )}

            {!isInstalled && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-semibold transition-all cursor-pointer"
              >
                <span>📲</span>
                <span>{isIOS ? 'Add to Home Screen' : canPrompt ? 'Install LiSAN App' : 'Download App'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-white/40 hover:text-white/80 text-xs px-1 cursor-pointer"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>

        </div>
      </div>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
