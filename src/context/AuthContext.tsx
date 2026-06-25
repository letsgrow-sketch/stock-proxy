"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

interface SafeUser {
  id: string
  email: string
  name: string
  avatar: string
  createdAt: string
}

interface AuthContextType {
  user: SafeUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (email: string, name: string, password: string) => Promise<string | null>
  loginWithGoogle: () => Promise<string | null>
  logout: () => void
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<string | null>
  syncWatchlist: (items: { id: string; stockCode: string }[]) => Promise<void>
  syncPortfolio: (items: { id: string; stockCode: string; shares: number; averageBuyPrice: number; totalInvested: number }[]) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: async () => null, register: async () => null, loginWithGoogle: async () => null,
  logout: () => {}, updateProfile: async () => null,
  syncWatchlist: async () => {}, syncPortfolio: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const d = await r.json()
      if (d.error) return d.error
      setUser(d.user)
      return null
    } catch { return "Connection error" }
  }, [])

  const register = useCallback(async (email: string, name: string, password: string): Promise<string | null> => {
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      })
      const d = await r.json()
      if (d.error) return d.error
      setUser(d.user)
      return null
    } catch { return "Connection error" }
  }, [])

  const loginWithGoogle = useCallback(async (): Promise<string | null> => {
    return "Configure Google OAuth credentials in your Google Cloud Console"
  }, [])

  const logout = useCallback(() => {
    document.cookie = "token=; Path=/; Max-Age=0"
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data: { name?: string; avatar?: string }): Promise<string | null> => {
    try {
      const r = await fetch("/api/auth/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      })
      const d = await r.json()
      if (d.error) return d.error
      setUser(d.user)
      return null
    } catch { return "Connection error" }
  }, [])

  const syncWatchlist = useCallback(async (items: { id: string; stockCode: string }[]) => {
    if (!user) return
    try { await fetch("/api/user/watchlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }), credentials: "include" }) } catch {}
  }, [user])

  const syncPortfolio = useCallback(async (items: { id: string; stockCode: string; shares: number; averageBuyPrice: number; totalInvested: number }[]) => {
    if (!user) return
    try { await fetch("/api/user/portfolio", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }), credentials: "include" }) } catch {}
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateProfile, syncWatchlist, syncPortfolio }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
