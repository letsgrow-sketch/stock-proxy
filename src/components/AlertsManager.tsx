"use client"

import { AlertRule, AlertEvent, AlertType, Stock } from "@/types"
import { ALERT_LABELS } from "@/lib/alerts"
import { useState } from "react"
import { Bell, BellOff, Check, RefreshCw } from "lucide-react"

interface AlertsManagerProps {
  rules: AlertRule[]
  events: AlertEvent[]
  stocks: Stock[]
  onToggleRule: (ruleId: string) => void
  onSetRuleStock: (ruleId: string, stockCode: string) => void
  onReset: () => void
  onMarkRead: (eventId: string) => void
  onMarkAllRead: () => void
  onClearEvents: () => void
  onSelectStock: (code: string) => void
}

export default function AlertsManager({
  rules, events, stocks, onToggleRule, onSetRuleStock, onReset,
  onMarkRead, onMarkAllRead, onClearEvents, onSelectStock,
}: AlertsManagerProps) {
  const [tab, setTab] = useState<"rules" | "history">("rules")

  const unread = events.filter(e => !e.read).length
  const todayEvents = events.filter(e => e.timestamp.startsWith(new Date().toISOString().slice(0, 10)))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-text-primary">Smart Alerts</h2>
        {unread > 0 && (
          <span className="bg-accent/20 text-accent-light text-[10px] px-2 py-0.5 rounded-full font-semibold">{unread} new</span>
        )}
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setTab("rules")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${tab === "rules" ? "bg-accent/10 text-accent-light border border-accent/20" : "text-text-muted/60 hover:text-text-primary"}`}>
            Rules
          </button>
          <button onClick={() => setTab("history")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${tab === "history" ? "bg-accent/10 text-accent-light border border-accent/20" : "text-text-muted/60 hover:text-text-primary"}`}>
            History {unread > 0 && `(${unread})`}
          </button>
        </div>
      </div>

      {tab === "rules" ? (
        <RulesTab
          rules={rules}
          stocks={stocks}
          onToggleRule={onToggleRule}
          onSetRuleStock={onSetRuleStock}
          onReset={onReset}
        />
      ) : (
        <HistoryTab
          events={events}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
          onClearEvents={onClearEvents}
          onSelectStock={onSelectStock}
        />
      )}
    </div>
  )
}

function RulesTab({ rules, stocks, onToggleRule, onSetRuleStock, onReset }: {
  rules: AlertRule[]; stocks: Stock[]; onToggleRule: (id: string) => void
  onSetRuleStock: (id: string, stockCode: string) => void; onReset: () => void
}) {
  const enabledCount = rules.filter(r => r.enabled).length

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={13} className="text-accent-light" />
          <span className="text-xs font-semibold text-text-primary">{enabledCount} of {rules.length} active</span>
        </div>
        <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-text-muted/50 hover:text-accent-light transition-all">
          <RefreshCw size={11} /> Reset
        </button>
      </div>
      <div className="divide-y divide-border/20">
        {rules.map(rule => {
          const meta = ALERT_LABELS[rule.type]
          return (
            <div key={rule.id} className="px-4 py-3 flex items-center gap-3 hover:bg-surface-50/20 transition-colors">
              <button onClick={() => onToggleRule(rule.id)}
                className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${rule.enabled ? "bg-accent/60" : "bg-border/30"}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${rule.enabled ? "left-[18px]" : "left-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">{meta.icon}</span>
                  <span className="text-xs font-medium text-text-primary">{meta.label}</span>
                </div>
                <p className="text-[10px] text-text-muted/60 mt-0.5">{meta.desc}</p>
              </div>
              <select
                value={rule.stockCode}
                onChange={e => onSetRuleStock(rule.id, e.target.value)}
                className="h-7 max-w-[110px] bg-[#0a0b10] border border-border/30 rounded px-2 text-[10px] text-text-muted/70 focus:outline-none focus:border-accent/40"
              >
                <option value="">All stocks</option>
                {stocks.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HistoryTab({ events, onMarkRead, onMarkAllRead, onClearEvents, onSelectStock }: {
  events: AlertEvent[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void
  onClearEvents: () => void; onSelectStock: (code: string) => void
}) {
  const unread = events.filter(e => !e.read).length

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs text-text-muted/70">{events.length} events</span>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={onMarkAllRead} className="text-[10px] text-accent-light hover:underline">Mark all read</button>
          )}
          {events.length > 0 && (
            <button onClick={onClearEvents} className="text-[10px] text-text-muted/50 hover:text-red transition-colors">Clear</button>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <BellOff size={20} className="mx-auto text-text-muted/30" />
          <p className="text-xs text-text-muted/50 mt-2">No alerts yet</p>
          <p className="text-[10px] text-text-muted/30 mt-0.5">Enable rules and wait for market conditions</p>
        </div>
      ) : (
        <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
          {events.map(event => {
            const meta = ALERT_LABELS[event.type]
            const timeAgo = getTimeAgo(event.timestamp)
            return (
              <div key={event.id} className={`px-4 py-2.5 transition-colors ${!event.read ? "bg-accent/[0.02]" : ""}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-xs mt-0.5">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onSelectStock(event.stockCode)}
                        className="text-xs font-semibold text-accent-light hover:underline">{event.stockCode}</button>
                      <span className="text-[10px] text-text-muted/50">{event.sector}</span>
                      <span className={`text-[10px] font-mono ${event.changePercent >= 0 ? "text-green" : "text-red"}`}>
                        {event.changePercent >= 0 ? "+" : ""}{event.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-text-primary mt-0.5">{event.message}</p>
                    <p className="text-[10px] text-text-muted/60 mt-0.5 leading-relaxed">{event.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-text-muted/40">{timeAgo}</span>
                      <span className="text-[9px] text-text-muted/30 capitalize">{event.type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  {!event.read && (
                    <button onClick={() => onMarkRead(event.id)}
                      className="p-1 rounded text-text-muted/30 hover:text-accent-light transition-colors shrink-0">
                      <Check size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
