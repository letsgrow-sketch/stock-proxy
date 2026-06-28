"use client"

import { IHSGData } from "@/types"
import { formatCurrency, formatPercent } from "@/data/mock"
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react"

interface HeroSectionProps {
  ihsg: IHSGData
  totalTurnover: number
}

export default function HeroSection({
  ihsg,
  totalTurnover,
}: HeroSectionProps) {
  return (
    <div className="glass rounded-2xl p-5 md:p-7 animate-scaleIn relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green/[0.04] to-transparent pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green/20 to-green/5 flex items-center justify-center ring-1 ring-green/30">
              <BarChart3 size={16} className="text-green" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-text-primary tracking-tight">
                Let's Grow
              </h1>

              <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                IDX Market Intelligence
              </p>
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed max-w-xl mt-1">
            Real-time stock screener with AI-powered analysis,
            technical indicators, and portfolio tracking for the
            Indonesian capital market.
          </p>
        </div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
  <div className="glass rounded-xl px-5 py-3.5 min-w-0 flex-1 w-full flex flex-col justify-center overflow-hidden">
    <div className="flex items-center gap-2 mb-1.5">
      <Activity size={13} className="text-text-muted" />
      <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">
        IHSG
      </span>
    </div>

    <div className="flex flex-wrap justify-between items-end gap-1 min-w-0">
      <span className="text-lg sm:text-xl lg:text-2xl font-bold font-mono text-text-primary tracking-tight">
        {ihsg.value.toLocaleString("id-ID")}
      </span>

      <span
        className={`text-sm font-semibold flex items-center gap-1 ${
          ihsg.change >= 0 ? "text-green" : "text-red"
        }`}
      >
        {ihsg.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {formatPercent(ihsg.changePercent)}
      </span>
    </div>
  </div>

  <div className="glass rounded-xl px-5 py-3.5 min-w-0 flex-1 w-full flex flex-col justify-center overflow-hidden">
    <div className="flex items-center gap-2 mb-1.5">
      <Activity size={13} className="text-text-muted" />
      <span className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.1em]">
        Turnover
      </span>
    </div>

    <span className="text-lg sm:text-xl lg:text-2xl font-bold font-mono text-text-primary tracking-tight">
      {formatCurrency(totalTurnover)}
    </span>
  </div>
</div>
              {formatCurrency(totalTurnover)}
            </span>

          </div>
        </div>
      </div>
    </div>
  )
}