import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '../types'
import { apiUrl } from '../lib/apiBase'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  isLoading: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  grade?: string
}

/** Decode the `exp` claim without verifying signature. Returns expiry Date or null. */
function getTokenExpiry(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (typeof payload.exp === 'number') return new Date(payload.exp * 1000)
    return null
  } catch {
    return null
  }
}

/** True if token is expired or expires within the next 30 s. */
function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token)
  if (!exp) return true
  return exp.getTime() - 30_000 < Date.now()
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<User | null>(null)
  const [token, setToken]       = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Persist helpers ──────────────────────────────────────────────────────
  const persistSession = useCallback((newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('lisan_token', newToken)
    localStorage.setItem('lisan_user', JSON.stringify(newUser))
  }, [])

  const clearSession = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('lisan_token')
    localStorage.removeItem('lisan_user')
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }, [])

  // ── Silent refresh via HttpOnly cookie ───────────────────────────────────
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(apiUrl('/api/auth/refresh'), { method: 'POST', credentials: 'include' })
      if (!res.ok) return null
      const data = await res.json()
      return data?.data?.token ?? null
    } catch {
      return null
    }
  }, [])

  /** Schedule a proactive token refresh 60 s before expiry. */
  const scheduleRefresh = useCallback((currentToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const exp = getTokenExpiry(currentToken)
    if (!exp) return
    const delay = exp.getTime() - Date.now() - 60_000
    if (delay <= 0) return
    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await silentRefresh()
      if (newToken) {
        setToken(newToken)
        localStorage.setItem('lisan_token', newToken)
        scheduleRefresh(newToken)
      } else {
        clearSession()
      }
    }, delay)
  }, [silentRefresh, clearSession])

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const savedToken = localStorage.getItem('lisan_token')
      const savedUser  = localStorage.getItem('lisan_user')
      if (!savedToken || !savedUser) { setIsLoading(false); return }

      try {
        const parsedUser = JSON.parse(savedUser) as User
        if (isTokenExpired(savedToken)) {
          const newToken = await silentRefresh()
          if (newToken) {
            persistSession(newToken, parsedUser)
            scheduleRefresh(newToken)
          } else {
            clearSession()
          }
        } else {
          persistSession(savedToken, parsedUser)
          scheduleRefresh(savedToken)
        }
      } catch {
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Global 401 interceptor ───────────────────────────────────────────────
  useEffect(() => {
    const original = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const response = await original(...args)
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        if (!url.includes('/api/auth/')) clearSession()
      }
      return response
    }
    return () => { window.fetch = original }
  }, [clearSession])

  // ── login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    let res: Response
    try {
      const loginUrl = apiUrl('/api/auth/login')
      console.log('🔐 Login attempt:', { loginUrl, email })
      
      res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      
      console.log('📥 Login response:', { status: res.status, ok: res.ok })
    } catch (err) {
      console.error('❌ Login network error:', err)
      throw new Error('The login service is unavailable. Please check your connection.')
    }

    const responseText = await res.text()
    console.log('📄 Response text:', responseText.substring(0, 200))
    
    let data: { success?: boolean; message?: string; data?: { token: string; user: User } } = {}
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr)
      throw new Error(`Invalid response from server (${res.status}). Please try again.`)
    }
    
    if (!res.ok || !data.success) {
      console.error('❌ Login failed:', data)
      throw new Error(data.message || `Login failed (${res.status}). Please try again.`)
    }
    
    if (!data.data?.token || !data.data.user) {
      console.error('❌ Incomplete response:', data)
      throw new Error('Login response was incomplete. Please try again.')
    }
    
    console.log('✅ Login successful:', { user: data.data.user.email, role: data.data.user.role })
    persistSession(data.data.token, data.data.user)
    scheduleRefresh(data.data.token)
  }, [persistSession, scheduleRefresh])

  // ── register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterData) => {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Registration failed. Please try again.')
    }
    persistSession(result.data.token, result.data.user)
    scheduleRefresh(result.data.token)
  }, [persistSession, scheduleRefresh])

  // ── changePassword ───────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Not authenticated.')
    const res = await fetch(apiUrl('/api/auth/change-password'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Password change failed.')
  }, [token])

  // ── logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => {})
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, changePassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
