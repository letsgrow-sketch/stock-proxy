"use client"

import { Stock, TechnicalData } from "@/types"
import { formatNumber } from "@/data/mock"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TechnicalAnalysisProps {
  stock: Stock
  technicalData: Record<string, TechnicalData>
}

const SignalIcon = ({ val, threshold }: { val: number; threshold: number }) =>
  val > threshold ? <TrendingUp size={14} className="text-green" /> :
  val < 100 - threshold ? <TrendingDown size={14} className="text-red" /> :
  <Minus size={14} className="text-text-muted/60" />

function signalText(val: number, threshold: number): string {
  if (val > threshold) return "Overbought"
  if (val < 100 - threshold) return "Oversold"
  return "Neutral"
}

const RiskBar = ({ value, invert }: { value: number; invert?: boolean }) => {
  const pct = invert ? 100 - value : value
  const color = pct > 70 ? "bg-red" : pct > 30 ? "bg-yellow-500" : "bg-green"
  return (
    <div className="w-full h-1.5 bg-[#0a0b10] rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
    </div>
  )
}

export default function TechnicalAnalysis({ stock, technicalData }: TechnicalAnalysisProps) {
  const data: TechnicalData | undefined = technicalData[stock.code]

  if (!data) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center py-20 text-text-muted">
        <p className="text-base font-medium text-text-secondary">No technical data available</p>
        <p className="text-sm mt-1 text-text-muted/70">Select a different stock to view technical analysis</p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-text-primary">Technical Analysis</h2>
        <span className="text-text-muted/40">—</span>
        <span className="font-bold text-text-primary">{stock.code}</span>
        <span className="text-sm text-text-muted/60 hidden sm:inline">{stock.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">RSI (14)</span>
            <SignalIcon val={data.rsi} threshold={70} />
          </div>
          <p className={`text-2xl font-bold font-mono mt-1.5 ${data.rsi > 70 ? "text-red" : data.rsi < 30 ? "text-green" : "text-text-primary"}`}>
            {data.rsi.toFixed(1)}
          </p>
          <p className="text-xs text-text-muted/60 mt-0.5">{signalText(data.rsi, 70)}</p>
          <RiskBar value={data.rsi} />
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">MACD</span>
            <span className={data.macd.histogram >= 0 ? "text-green" : "text-red"}>
              {data.macd.histogram >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">MACD Line</span>
              <span className="font-mono text-text-primary">{data.macd.value.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">Signal Line</span>
              <span className="font-mono text-text-primary">{data.macd.signal.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">Histogram</span>
              <span className={`font-mono ${data.macd.histogram >= 0 ? "text-green" : "text-red"}`}>
                {data.macd.histogram >= 0 ? "+" : ""}{data.macd.histogram.toFixed(1)}
              </span>
            </div>
          </div>
          <RiskBar value={50 + data.macd.histogram} />
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Moving Averages</span>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 rounded bg-accent/50" />
                <span className="text-xs text-text-muted/60">MA 50</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs ${stock.price >= data.ma50 ? "text-green" : "text-red"}`}>{formatNumber(data.ma50)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stock.price >= data.ma50 ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                  {stock.price >= data.ma50 ? "Above" : "Below"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 rounded bg-accent" />
                <span className="text-xs text-text-muted/60">MA 200</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs ${stock.price >= data.ma200 ? "text-green" : "text-red"}`}>{formatNumber(data.ma200)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stock.price >= data.ma200 ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
                  {stock.price >= data.ma200 ? "Above" : "Below"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Bollinger Bands (20,2)</span>
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">Upper</span>
              <span className="font-mono text-text-primary">{formatNumber(data.bb.upper)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">Middle (SMA)</span>
              <span className="font-mono text-green">{formatNumber(data.bb.middle)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">Lower</span>
              <span className="font-mono text-text-primary">{formatNumber(data.bb.lower)}</span>
            </div>
          </div>
          <RiskBar value={((stock.price - data.bb.lower) / (data.bb.upper - data.bb.lower)) * 100} invert />
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Stochastic</span>
            <SignalIcon val={data.stochastic.k} threshold={80} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">%K</span>
              <span className="font-mono text-text-primary">{data.stochastic.k.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted/60">%D</span>
              <span className="font-mono text-text-primary">{data.stochastic.d.toFixed(1)}</span>
            </div>
          </div>
          <p className="text-xs text-text-muted/60 mt-1">{signalText(data.stochastic.k, 80)}</p>
          <RiskBar value={data.stochastic.k} />
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-[#0c0d14] flex flex-col justify-center items-center">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Signal</span>
          <span className={`text-2xl font-bold ${data.recommendation === "Buy" ? "text-green" : data.recommendation === "Sell" ? "text-red" : "text-yellow-500"}`}>
            {data.recommendation}
          </span>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-text-muted/60">Strength:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-1.5 rounded-full ${
                  i <= (data.rsi > 60 ? 3 : data.rsi > 40 ? 2 : 1)
                    ? data.recommendation === "Buy" ? "bg-green" : data.recommendation === "Sell" ? "bg-red" : "bg-yellow-500"
                    : "bg-[#0a0b10]"
                }`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
