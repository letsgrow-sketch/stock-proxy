"use client"

import { LayoutGrid, Star, Filter, Briefcase, Menu } from "lucide-react"
import { View } from "@/types"

interface BottomNavProps {
  view: View
  setView: (v: View) => void
}

const tabs: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "table", label: "Stocks", icon: LayoutGrid },
  { id: "watchlist", label: "Watchlist", icon: Star },
  { id: "screener", label: "Screener", icon: Filter },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
]

export default function BottomNav({ view, setView }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-around px-1 safe-area-bottom" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className={`flex flex-col items-center gap-0.5 py-2 px-4 min-w-0 rounded-lg transition-all min-h-[48px] justify-center ${
            view === tab.id ? "text-green" : "text-text-muted"
          }`}
        >
          <tab.icon size={20} />
          <span className="text-[9px] font-semibold">{tab.label}</span>
        </button>
      ))}
      <button
        onClick={() => setView("alerts")}
        className={`flex flex-col items-center gap-0.5 py-2 px-4 min-w-0 rounded-lg transition-all min-h-[48px] justify-center ${
          view === "alerts" ? "text-green" : "text-text-muted"
        }`}
      >
        <Menu size={20} />
        <span className="text-[9px] font-semibold">More</span>
      </button>
    </nav>
  )
}
