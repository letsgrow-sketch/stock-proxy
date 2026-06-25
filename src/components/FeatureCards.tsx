"use client"

import { FeatureCardItem, View } from "@/types"
import { formatPercent } from "@/data/mock"
import { TrendingUp, Star, ArrowDownToLine, Search, Gauge } from "lucide-react"

interface FeatureCardsProps {
  momentum: FeatureCardItem[]
  undervalued: FeatureCardItem[]
  buyOnWeakness: FeatureCardItem[]
  watchlist: FeatureCardItem[]
  onViewChange: (v: View) => void
  onSelectStock: (code: string) => void
}

function MiniCard({ title, icon: Icon, items, color, subtitle, onSelect }: {
  title: string
  icon: typeof TrendingUp
  items: FeatureCardItem[]
  color: string
  subtitle?: string
  onSelect: (code: string) => void
}) {
  return (
    <div className="glass rounded-xl overflow-hidden transition-all duration-200 hover:border-green/20 hover:shadow-lg hover:shadow-green/[0.02]">
      <div className="px-4 pt-3.5 pb-1 flex items-center gap-2 border-b border-white/[0.04]">
        <Icon size={14} className={color} />
        <span className="text-xs font-semibold text-text-primary">{title}</span>
        {subtitle && <span className="text-[9px] text-text-muted ml-auto">{subtitle}</span>}
      </div>
      <div className="p-1">
        {items.slice(0, 5).map((item, idx) => (
          <div
            key={item.code}
            onClick={() => onSelect(item.code)}
            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[9px] text-text-muted/50 font-mono w-3.5 text-right shrink-0">{idx + 1}</span>
              <span className="text-xs font-semibold text-text-primary group-hover:text-green transition-colors">{item.code}</span>
              <span className="text-[10px] text-text-muted truncate hidden sm:block max-w-[90px]">{item.name}</span>
            </div>
            <span className={`text-xs font-mono font-semibold shrink-0 ${
              item.changePercent >= 0 ? "text-green" : "text-red"
            }`}>
              {item.changePercent >= 0 ? "+" : ""}{formatPercent(item.changePercent)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FeatureCards({ momentum, undervalued, buyOnWeakness, watchlist, onViewChange, onSelectStock }: FeatureCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slideUp">
      <MiniCard title="Top Momentum" icon={Gauge} items={momentum} color="text-green" subtitle="Leading gainers" onSelect={onSelectStock} />
      <MiniCard title="Undervalued" icon={Search} items={undervalued} color="text-blue-400" subtitle="Lowest PBV" onSelect={onSelectStock} />
      <MiniCard title="Buy on Weakness" icon={ArrowDownToLine} items={buyOnWeakness} color="text-orange-400" subtitle="RSI oversold" onSelect={onSelectStock} />
      <div
        onClick={() => onViewChange("watchlist")}
        className="glass rounded-xl overflow-hidden transition-all duration-200 hover:border-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/[0.02] cursor-pointer"
      >
        <div className="px-4 pt-3.5 pb-1 flex items-center gap-2 border-b border-white/[0.04]">
          <Star size={14} className="text-yellow-500" />
          <span className="text-xs font-semibold text-text-primary">Watchlist Saya</span>
          <span className="text-[9px] text-text-muted ml-auto">{watchlist.length} items</span>
        </div>
        <div className="p-1">
          {watchlist.slice(0, 5).map((item, idx) => (
            <div
              key={item.code}
              onClick={e => { e.stopPropagation(); onSelectStock(item.code) }}
              className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[9px] text-text-muted/50 font-mono w-3.5 text-right shrink-0">{idx + 1}</span>
                <span className="text-xs font-semibold text-text-primary group-hover:text-green transition-colors">{item.code}</span>
                <span className="text-[10px] text-text-muted truncate hidden sm:block max-w-[90px]">{item.name}</span>
              </div>
              <span className={`text-xs font-mono font-semibold shrink-0 ${
                item.changePercent >= 0 ? "text-green" : "text-red"
              }`}>
                {item.changePercent >= 0 ? "+" : ""}{formatPercent(item.changePercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
