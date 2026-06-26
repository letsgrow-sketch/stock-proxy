"use client"

import { MarketOverviewData } from "@/types"
import { formatCurrency } from "@/data/mock"
import { TrendingDown, ArrowUpRight, ArrowDownRight, Building2, DollarSign, TrendingUp } from "lucide-react"

interface MarketOverviewProps {
  data: MarketOverviewData
}

function MiniChart({ change }: { change: number }) {
  const day = new Date().getDate()
  const bars = Array.from({ length: 14 }, (_, i) => {
    const seed = (day * (i + 1) * 7) % 29 + 35
    return Math.max(30, Math.min(90, seed + (change > 0 ? 5 : -5)))
  })
  return (
    <div className="mt-2.5 h-7 flex items-end gap-[2px]">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 bg-green/20 rounded-sm hover:bg-green/40 transition-colors" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default function MarketOverview({ data }: MarketOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slideUp">
      <div className="glass rounded-xl p-4 card-gradient card-gradient-hover transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-orange-400" />
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">USD/IDR</span>
          </div>
          <span className={`text-xs font-mono font-semibold flex items-center gap-0.5 ${
            data.usdIdr.change >= 0 ? "text-green" : "text-red"
          }`}>
            {data.usdIdr.change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {data.usdIdr.changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-text-primary tracking-tight">
            {data.usdIdr.value.toLocaleString("id-ID")}
          </span>
        </div>
        <MiniChart change={data.usdIdr.change} />
      </div>

      <div className="glass rounded-xl p-4 hover:border-green/20 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={14} className="text-green" />
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">Sektor Inflow</span>
          </div>
        </div>
        <span className="text-xl font-bold font-mono text-green tracking-tight">{data.topInflow.sector}</span>
        <p className="text-xs text-text-muted mt-1.5">Net Buy: <span className="font-mono text-text-secondary">{formatCurrency(data.topInflow.netBuy)}</span></p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.topInflow.topStocks.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-green/10 text-green font-semibold">{s}</span>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 hover:border-red/20 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowDownRight size={14} className="text-red" />
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">Sektor Outflow</span>
          </div>
        </div>
        <span className="text-xl font-bold font-mono text-red tracking-tight">{data.topOutflow.sector}</span>
        <p className="text-xs text-text-muted mt-1.5">Net Sell: <span className="font-mono text-text-secondary">{formatCurrency(data.topOutflow.netSell)}</span></p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.topOutflow.topStocks.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-red/10 text-red font-semibold">{s}</span>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-4 hover:border-blue-500/20 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-blue-400" />
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">Konglomerasi</span>
          </div>
        </div>
        <span className="text-xl font-bold font-mono text-text-primary tracking-tight">{data.topConglomerate.name}</span>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-text-muted">Score</span>
          <span className="text-sm font-mono font-bold text-green">{data.topConglomerate.score}</span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green to-green-light transition-all duration-500" style={{ width: `${data.topConglomerate.score}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.topConglomerate.companies.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold">{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
