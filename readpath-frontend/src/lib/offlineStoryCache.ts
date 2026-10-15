// ─── Lisan Offline PWA Story Caching Engine (IndexedDB) ───────────────────────
// Pre-caches grade-appropriate bilingual stories, vocabulary glossaries, and audio
// clips directly into browser IndexedDB so learners can read and listen even with 0% internet.

import { BILINGUAL_STORIES, type BilingualStory } from './bilingualDictionary'

export interface CachedOfflineStory extends BilingualStory {
  cachedAt: string
  isOfflineReady: boolean
}

const DB_NAME = 'lisan_offline_db'
const DB_VERSION = 2
const STORIES_STORE = 'offline_stories'
const AUDIO_STORE = 'offline_audio_clips'

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'))
      return
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store 1: Recordings sync queue
      if (!db.objectStoreNames.contains('recordings_queue')) {
        db.createObjectStore('recordings_queue', { keyPath: 'id' })
      }

      // Store 2: Offline Bilingual Stories
      if (!db.objectStoreNames.contains(STORIES_STORE)) {
        db.createObjectStore(STORIES_STORE, { keyPath: 'id' })
      }

      // Store 3: Offline Audio Clips & Pronunciations
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Pre-caches built-in bilingual stories and vocabulary into IndexedDB on app launch.
 */
export async function initOfflineStoryCache(): Promise<number> {
  try {
    const db = await openOfflineDB()
    const now = new Date().toISOString()

    return new Promise((resolve) => {
      const tx = db.transaction(STORIES_STORE, 'readwrite')
      const store = tx.objectStore(STORIES_STORE)

      let count = 0
      for (const story of BILINGUAL_STORIES) {
        const item: CachedOfflineStory = {
          ...story,
          cachedAt: now,
          isOfflineReady: true,
        }
        store.put(item)
        count++
      }

      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('lisan:offline-stories-cached', { detail: { count } }))
        resolve(count)
      }
      tx.onerror = () => resolve(0)
    })
  } catch (err) {
    console.warn('[OfflineStoryCache] Failed to initialize IndexedDB cache:', err)
    return 0
  }
}

/**
 * Retrieves all cached offline stories from IndexedDB.
 */
export async function getOfflineStories(): Promise<CachedOfflineStory[]> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORIES_STORE, 'readonly')
      const store = tx.objectStore(STORIES_STORE)
      const req = store.getAll()
      req.onsuccess = () => {
        const results = req.result as CachedOfflineStory[]
        if (results && results.length > 0) {
          resolve(results)
        } else {
          // Fallback to in-memory BILINGUAL_STORIES
          resolve(
            BILINGUAL_STORIES.map((s) => ({
              ...s,
              cachedAt: new Date().toISOString(),
              isOfflineReady: true,
            }))
          )
        }
      }
      req.onerror = () => {
        resolve(
          BILINGUAL_STORIES.map((s) => ({
            ...s,
            cachedAt: new Date().toISOString(),
            isOfflineReady: true,
          }))
        )
      }
    })
  } catch {
    return BILINGUAL_STORIES.map((s) => ({
      ...s,
      cachedAt: new Date().toISOString(),
      isOfflineReady: true,
    }))
  }
}

/**
 * Stores an audio clip (e.g. passage narration or word pronunciation) for offline playback.
 */
export async function cacheOfflineAudioClip(id: string, audioBlob: Blob): Promise<boolean> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite')
      const store = tx.objectStore(AUDIO_STORE)
      store.put({ id, audioBlob, cachedAt: new Date().toISOString() })
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

/**
 * Retrieves a cached audio clip from IndexedDB.
 */
export async function getOfflineAudioClip(id: string): Promise<Blob | null> {
  try {
    const db = await openOfflineDB()
    return new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly')
      const store = tx.objectStore(AUDIO_STORE)
      const req = store.get(id)
      req.onsuccess = () => resolve(req.result ? req.result.audioBlob : null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}
