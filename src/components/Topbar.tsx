"use client"

import { Search, Bot, X, LogIn, Bell } from "lucide-react"
import SyariahToggle from "./SyariahToggle"
import UserMenu from "./UserMenu"
import { useAuth } from "@/context/AuthContext"

interface TopbarProps {
  search: string
  setSearch: (v: string) => void
  syariahOnly: boolean
  setSyariahOnly: (v: boolean) => void
  aiOpen: boolean
  setAiOpen: (v: boolean) => void
  isLoading?: boolean
  alertUnread?: number
  onAlertsClick?: () => void
  onAuthClick?: () => void
  onEditProfile?: () => void
  onNotifications?: () => void
}

export default function Topbar({ search, setSearch, syariahOnly, setSyariahOnly, aiOpen, setAiOpen, isLoading, alertUnread = 0, onAlertsClick, onAuthClick, onEditProfile, onNotifications }: TopbarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 h-14 bg-surface/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 lg:pl-4 lg:pr-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => { console.log("[DEBUG Topbar] onChange value='%s' target=%O", e.target.value, e.target); setSearch(e.target.value) }}
            placeholder="Search stocks..."
           className="flex-1 min-w-0 h-8 bg-surface-50 border border-border/50 rounded-lg pl-8 pr-3
           text-xs text-text-primary placeholder:text-text-muted
           focus:outline-none focus:border-green/30 focus:ring-1 focus:ring-green/10
           transition-all"
          />
        </div>
        <SyariahToggle enabled={syariahOnly} onChange={setSyariahOnly} />
      </div>

      <div className="flex items-center gap-1.5">
        {isLoading && (
          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green/60 animate-pulse-dot" />
            <span className="text-[10px] text-text-muted hidden sm:inline">Live</span>
          </div>
        )}

        <button
          onClick={onAlertsClick}
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-all"
          aria-label="Alerts"
        >
          <Bell size={16} />
          {alertUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-surface">
              {alertUnread > 9 ? "9+" : alertUnread}
            </span>
          )}
        </button>

        <button
          onClick={() => setAiOpen(!aiOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
            aiOpen
              ? "bg-green/10 text-green border border-green/20"
              : "bg-surface-50/50 border border-border/50 text-text-secondary hover:text-text-primary hover:bg-surface-50"
          }`}
        >
          {aiOpen ? <X size={14} /> : <Bot size={14} />}
          <span className="hidden sm:inline">AI</span>
        </button>

        {user ? (
          <UserMenu onEditProfile={onEditProfile!} onNotifications={onNotifications} />
        ) : (
          <button onClick={onAuthClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-50/50 border border-border/50 text-text-secondary hover:text-green hover:border-green/30 transition-all">
            <LogIn size={13} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
