"use client"

import { WatchlistItem } from "@/types"
import { formatCurrency, formatPercent } from "@/data/mock"
import { Trash2, TrendingUp, BarChart3, Activity } from "lucide-react"
import { Stock, View } from "@/types"

interface WatchlistProps {
  items: WatchlistItem[]
  selectedStock: Stock | null
  setSelectedStock: (s: Stock) => void
  setView: (v: View) => void
  removeItem: (id: string) => void
}

export default function Watchlist({ items, selectedStock, setSelectedStock, setView, removeItem }: WatchlistProps) {
  if (items.length === 0) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center py-20 text-text-muted">
        <p className="text-base font-medium text-text-secondary">Watchlist is empty</p>
        <p className="text-sm mt-1 text-text-muted/70">Click the star icon on any stock to add it here</p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">
          Watchlist
          <span className="text-sm font-normal text-text-muted ml-2">{items.length} stocks</span>
        </h2>
      </div>

      <div className="grid gap-2">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setSelectedStock(item.stock)}
            className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
              selectedStock?.code === item.stock.code
                ? "border-accent/40 bg-accent/[0.04]"
                : "border-border/40 bg-[#0c0d14] hover:bg-[#0c0d14]/80 hover:border-border/60"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text-primary">{item.stock.code}</span>
                {item.stock.isSyariah && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-green/10 text-green font-medium leading-none">S</span>
                )}
                <span className="text-xs text-text-muted/60 truncate">{item.stock.name}</span>
              </div>
              <p className="text-[11px] text-text-muted/50 mt-0.5">{item.stock.sector}</p>
            </div>

            <div className="text-right shrink-0">
              <p className={`font-mono font-semibold text-sm ${item.stock.change >= 0 ? "text-green" : "text-red"}`}>
                {item.stock.price.toLocaleString("id-ID")}
              </p>
              <p className={`font-mono text-xs ${item.stock.changePercent >= 0 ? "text-green" : "text-red"}`}>
                {formatPercent(item.stock.changePercent)}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
              {([["technical", TrendingUp], ["fundamental", BarChart3], ["flow", Activity]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => { setSelectedStock(item.stock); setView(v) }}
                  className="p-1.5 rounded-md text-text-muted/60 hover:text-accent-light hover:bg-accent/[0.08] transition-all duration-150"
                >
                  <Icon size={13} />
                </button>
              ))}
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-md text-text-muted/60 hover:text-red hover:bg-red/[0.08] transition-all duration-150"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
