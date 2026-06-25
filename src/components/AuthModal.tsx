"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { X, Mail, Lock, User, Eye, EyeOff, Chrome } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register, loginWithGoogle } = useAuth()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setBusy(true)
    const err = tab === "login" ? await login(email, password) : await register(email, name, password)
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  const handleGoogle = async () => {
    setError("")
    const msg = await loginWithGoogle()
    if (msg) setError(msg)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#0c0d14] border border-border/40 rounded-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
          <div className="flex gap-1">
            <button onClick={() => setTab("login")} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${tab === "login" ? "bg-accent/10 text-accent-light" : "text-text-muted/60 hover:text-text-primary"}`}>Sign In</button>
            <button onClick={() => setTab("register")} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${tab === "register" ? "bg-accent/10 text-accent-light" : "text-text-muted/60 hover:text-text-primary"}`}>Register</button>
          </div>
          <button onClick={onClose} className="p-1 rounded text-text-muted/50 hover:text-text-primary"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {tab === "register" && (
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required
                className="w-full h-10 bg-[#0a0b10] border border-border/40 rounded-xl pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all" />
            </div>
          )}

          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required
              className="w-full h-10 bg-[#0a0b10] border border-border/40 rounded-xl pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all" />
          </div>

          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type={showPw ? "text" : "password"} required minLength={6}
              className="w-full h-10 bg-[#0a0b10] border border-border/40 rounded-xl pl-9 pr-9 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-muted/80">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && <p className="text-[11px] text-red bg-red/5 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={busy}
            className="w-full h-10 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent-light transition-all flex items-center justify-center">
            {busy ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : tab === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
            <div className="relative flex justify-center"><span className="text-[10px] text-text-muted/40 bg-[#0c0d14] px-2">or continue with</span></div>
          </div>

          <button type="button" onClick={handleGoogle}
            className="w-full h-10 rounded-xl border border-border/40 text-xs font-medium text-text-secondary hover:bg-surface-50/50 hover:border-border/60 transition-all flex items-center justify-center gap-2">
            <Chrome size={15} /> Google
          </button>
        </form>
      </div>
    </div>
  )
}
