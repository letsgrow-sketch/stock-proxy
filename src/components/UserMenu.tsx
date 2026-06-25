"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { LogOut, User, Settings, Bell, ChevronDown } from "lucide-react"

interface UserMenuProps {
  onEditProfile: () => void
  onNotifications?: () => void
}

export default function UserMenu({ onEditProfile, onNotifications }: UserMenuProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!user) return null

  const initial = user.name.charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-50/50 transition-all">
        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent-light text-xs font-bold">{initial}</div>
        <span className="text-xs text-text-secondary hidden sm:block max-w-[80px] truncate">{user.name}</span>
        <ChevronDown size={11} className="text-text-muted/50" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-[#0c0d14] border border-border/40 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3.5 py-2.5 border-b border-border/20">
            <p className="text-xs font-semibold text-text-primary truncate">{user.name}</p>
            <p className="text-[10px] text-text-muted/60 truncate">{user.email}</p>
          </div>
          <div className="p-1.5">
            {onNotifications && (
              <button onClick={() => { setOpen(false); onNotifications() }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary hover:bg-surface-50/50 hover:text-text-primary transition-all">
                <Bell size={13} /> Notification Settings
              </button>
            )}
            <button onClick={() => { setOpen(false); onEditProfile() }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary hover:bg-surface-50/50 hover:text-text-primary transition-all">
              <Settings size={13} /> Edit Profile
            </button>
            <button onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary hover:bg-red/10 hover:text-red transition-all">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
