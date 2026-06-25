"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { X, User } from "lucide-react"

interface ProfileEditModalProps {
  open: boolean
  onClose: () => void
}

export default function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  if (!open || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setBusy(true)
    const err = await updateProfile({ name })
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#0c0d14] border border-border/40 rounded-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
          <h3 className="text-xs font-bold text-text-primary">Edit Profile</h3>
          <button onClick={onClose} className="p-1 rounded text-text-muted/50 hover:text-text-primary"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/20">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent-light text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{user.name}</p>
              <p className="text-[10px] text-text-muted/60">{user.email}</p>
            </div>
          </div>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required
              className="w-full h-10 bg-[#0a0b10] border border-border/40 rounded-xl pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all" />
          </div>
          {error && <p className="text-[11px] text-red bg-red/5 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full h-10 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40 hover:bg-accent-light transition-all flex items-center justify-center">
            {busy ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  )
}
