"use client"

import { useState, useEffect } from "react"
import { LayoutGrid, Star, BarChart3, TrendingUp, PieChart, Activity, Menu, X, Filter, Briefcase, Bell, Lightbulb, History, ChevronLeft } from "lucide-react"
import { View } from "@/types"

interface SidebarProps {
  view: View
  setView: (v: View) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "table", label: "Stocks", icon: LayoutGrid },
  { id: "watchlist", label: "Watchlist", icon: Star },
  { id: "heatmap", label: "Heatmap", icon: PieChart },
  { id: "technical", label: "Technical", icon: TrendingUp },
  { id: "fundamental", label: "Fundamental", icon: BarChart3 },
  { id: "flow", label: "Flow", icon: Activity },
  { id: "screener", label: "Screener", icon: Filter },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "strategies", label: "Strategies", icon: Lightbulb },
  { id: "backtest", label: "Backtest", icon: History },
]

export default function Sidebar({ view, setView, collapsed, onToggleCollapse }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className={`flex items-center border-b border-border/50 ${collapsed ? "justify-center h-14 px-0" : "h-14 px-4 gap-2.5"}`}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center ring-1 ring-green/30 shrink-0">
          <BarChart3 size={13} className="text-green" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-text-primary tracking-tight leading-tight">Let's Grow</h1>
            <p className="text-[9px] text-text-muted font-medium uppercase tracking-wider">IDX Screener</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setView(item.id); setMobileOpen(false) }}
            className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${
              collapsed
                ? "justify-center h-10 px-0"
                : "gap-2.5 px-3 py-2"
            } ${
              view === item.id
                ? "bg-green/10 text-green"
                : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={collapsed ? 18 : 16} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-border/50">
        <div className={`rounded-lg bg-white/[0.03] ${collapsed ? "p-2 text-center" : "p-3"}`}>
          {collapsed ? (
            <div className="relative flex justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green/40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green/40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
                </span>
                <span className="text-xs text-text-primary font-medium">Market Open</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1">09:00 – 15:50 WIB</p>
            </>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-lg bg-surface border border-border/50 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <aside className={`
        hidden lg:flex flex-col shrink-0 bg-surface border-r border-border/50 relative
        transition-all duration-200 ease-out
        ${collapsed ? "w-16" : "w-52"}
      `}>
        {sidebarContent}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-50 border border-border/50 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-green/30 transition-all z-10"
        >
          <ChevronLeft size={12} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <div className={`
        fixed lg:hidden inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border/50 flex flex-col
        transition-transform duration-200 ease-out shadow-2xl
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center ring-1 ring-green/30">
              <BarChart3 size={13} className="text-green" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-tight leading-tight">Let's Grow</h1>
              <p className="text-[9px] text-text-muted font-medium uppercase tracking-wider">IDX Screener</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/[0.05]">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setMobileOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                view === item.id
                  ? "bg-green/10 text-green"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  )
}
