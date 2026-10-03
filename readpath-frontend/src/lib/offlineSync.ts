// ─── Lisan Offline-First PWA Sync Engine ─────────────────────────────────────
// Uses IndexedDB to safely store voice recordings offline when internet drops,
// and auto-syncs to the backend as soon as connectivity returns.

import { apiUrl } from './apiBase'

export interface OfflineRecordingItem {
  id: string
  passageId: string
  passageTitle: string
  audioBlob: Blob
  wpm?: number
  accuracy?: number
  durationSec?: number
  createdAt: string
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED'
}

const DB_NAME = 'lisan_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'recordings_queue'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Save Recording to Offline Storage ───────────────────────────────────────
export async function saveOfflineRecording(item: OfflineRecordingItem): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(item)
      tx.oncomplete = () => {
        // Broadcast storage event for reactive UI
        window.dispatchEvent(new CustomEvent('lisan:offline-recordings-updated'))
        resolve(true)
      }
      tx.onerror = () => resolve(false)
    })
  } catch (err) {
    console.warn('[OfflineSync] Failed to store in IndexedDB:', err)
    return false
  }
}

// ─── Retrieve All Offline Recordings ─────────────────────────────────────────
export async function getOfflineRecordings(): Promise<OfflineRecordingItem[]> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

// ─── Remove Synced Recording ────────────────────────────────────────────────
export async function deleteOfflineRecording(id: string): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete(id)
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('lisan:offline-recordings-updated'))
        resolve(true)
      }
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

// ─── Auto-Sync Engine (Called on `online` event) ─────────────────────────────
export async function syncPendingRecordings(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const pending = await getOfflineRecordings()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const item of pending) {
    try {
      const formData = new FormData()
      formData.append('audio', item.audioBlob, `${item.id}.webm`)
      formData.append('passageId', item.passageId)
      formData.append('passageTitle', item.passageTitle || 'Live Reading Practice')
      if (item.wpm) formData.append('wpm', String(item.wpm))
      if (item.accuracy) formData.append('accuracy', String(item.accuracy))
      if (item.durationSec) formData.append('durationSeconds', String(item.durationSec))

      const token = localStorage.getItem('lisan_token') || ''
      const res = await fetch(apiUrl('/api/recordings/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      })

      if (res.ok) {
        await deleteOfflineRecording(item.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

// Auto-register window listener for online reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingRecordings().then(({ synced }) => {
      if (synced > 0) {
        window.dispatchEvent(
          new CustomEvent('lisan:toast', {
            detail: { message: `✅ Successfully synced ${synced} offline recordings!` },
          })
        )
      }
    })
  })
}
