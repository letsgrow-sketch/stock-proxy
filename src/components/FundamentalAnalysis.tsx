"use client"

import { Stock, FundamentalData } from "@/types"
import { formatCurrency, formatNumber } from "@/data/mock"

interface FundamentalAnalysisProps {
  stock: Stock
  fundamentalData: Record<string, FundamentalData>
}

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  positive?: boolean
  negative?: boolean
  info?: string
}

const MetricCard = ({ label, value, unit, positive, negative, info }: MetricCardProps) => (
  <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
    <div className="flex items-baseline gap-1.5 mt-1.5">
      <span className={`text-xl font-bold font-mono tracking-tight ${positive ? "text-green" : negative ? "text-red" : "text-text-primary"}`}>
        {value}
      </span>
      {unit && <span className="text-xs text-text-muted/60">{unit}</span>}
    </div>
    {info && <span className="text-[10px] text-text-muted/60 mt-1 block">{info}</span>}
  </div>
)

const Gauge = ({ value, label, high }: { value: number; label: string; high?: boolean }) => {
  const pct = high ? Math.min(value / 100, 1) * 100 : Math.min(value / 50, 1) * 100
  const color = high
    ? pct > 70 ? "bg-green" : pct > 40 ? "bg-yellow-500" : "bg-red"
    : pct > 60 ? "bg-yellow-500" : pct > 30 ? "bg-green" : "bg-red"
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted/60 w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#0a0b10] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-text-primary w-12 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default function FundamentalAnalysis({ stock, fundamentalData }: FundamentalAnalysisProps) {
  const data = fundamentalData[stock.code]

  if (!data) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center py-20 text-text-muted">
        <p className="text-base font-medium text-text-secondary">No fundamental data available</p>
        <p className="text-sm mt-1 text-text-muted/70">Select a different stock to view fundamental analysis</p>
      </div>
    )
  }

  const peRating = data.per > 0
    ? data.per < 15 ? "Undervalued" : data.per < 25 ? "Fair" : "Overvalued"
    : "N/A"

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-text-primary">Fundamental Analysis</h2>
        <span className="text-text-muted/40">—</span>
        <span className="font-bold text-text-primary">{stock.code}</span>
        <span className="text-sm text-text-muted/60 hidden sm:inline">{stock.name}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} unit="x" info={peRating} />
        <MetricCard label="PBV" value={data.pbv.toFixed(1)} unit="x" positive={data.pbv < 3} negative={data.pbv > 5} />
        <MetricCard label="ROE" value={data.roe.toFixed(1)} unit="%" positive={data.roe > 15} negative={data.roe < 8} />
        <MetricCard label="DER" value={data.der.toFixed(2)} unit="x" positive={data.der < 0.5} negative={data.der > 1.5} />
        <MetricCard label="EPS" value={data.eps > 0 ? formatNumber(data.eps) : "—"} info={data.eps > 0 ? "Rp / share" : "Negative earnings"} />
        <MetricCard label="Div. Yield" value={data.dividendYield > 0 ? data.dividendYield.toFixed(1) : "—"} unit="%" positive={data.dividendYield > 3} />
        <MetricCard label="Market Cap" value={formatCurrency(data.marketCap)} positive={data.marketCap > 100e12} negative={data.marketCap < 10e12} />
        <MetricCard label="Sector" value={stock.sector} />
      </div>

      <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
        <h3 className="text-sm font-medium text-text-primary mb-3">Health Score</h3>
        <div className="space-y-2.5">
          <Gauge value={data.roe} label="ROE" high />
          <Gauge value={data.per > 0 ? Math.min(data.per, 30) : 0} label="PER" />
          <Gauge value={data.pbv * 10} label="PBV" />
          <Gauge value={(1 - data.der / 3) * 100} label="Leverage" high />
        </div>
      </div>
    </div>
  )
}
