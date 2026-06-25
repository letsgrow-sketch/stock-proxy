"use client"

import { useState, useMemo } from "react"
import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"
import { StrategyType, STRATEGY_META, scanAllStrategies, StrategyRecommendation } from "@/lib/strategies"
import { TrendingUp, Shield, Zap, Activity, Globe, AlertTriangle, Target, Crosshair } from "lucide-react"

interface StrategyHubProps {
  stocks: Stock[]
  technicalData: Record<string, TechnicalData>
  fundamentalData: Record<string, FundamentalData>
  flowData: Record<string, FlowData>
  onSelectStock: (code: string) => void
}

const strategyList: StrategyType[] = ["swing_trade", "value_investing", "momentum", "breakout", "foreign_accumulation"]
const strategyIcons: Record<string, typeof TrendingUp> = { swing_trade: Zap, value_investing: Shield, momentum: TrendingUp, breakout: Activity, foreign_accumulation: Globe }

export default function StrategyHub({ stocks, technicalData, fundamentalData, flowData, onSelectStock }: StrategyHubProps) {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>("swing_trade")

  const results = useMemo(() => scanAllStrategies(stocks, technicalData, fundamentalData, flowData), [stocks, technicalData, fundamentalData, flowData])

  const activeRecs = results[activeStrategy]
  const totalOps = Object.values(results).reduce((s, recs) => s + recs.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {strategyList.map(key => {
          const meta = STRATEGY_META[key]
          const count = results[key].length
          const Icon = strategyIcons[key]
          return (
            <button key={key} onClick={() => setActiveStrategy(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeStrategy === key
                  ? "bg-accent/10 text-accent-light border border-accent/20"
                  : "text-text-muted/60 border border-transparent hover:text-text-primary hover:border-border/30"
              }`}
            >
              <Icon size={13} />
              {meta.label}
              {count > 0 && <span className="ml-0.5 text-[10px] bg-accent/20 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          )
        })}
        <span className="text-[10px] text-text-muted/50 ml-auto">{totalOps} opportunities found</span>
      </div>

      {activeRecs.length === 0 ? (
        <div className="bg-[#0c0d14] border border-border/30 rounded-xl flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <AlertTriangle size={20} className="mx-auto text-text-muted/30" />
            <p className="text-xs text-text-muted/50 mt-2">No {STRATEGY_META[activeStrategy].label.toLowerCase()} opportunities</p>
            <p className="text-[10px] text-text-muted/30 mt-0.5">Market conditions don't match this strategy right now</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {activeRecs.map(rec => (
            <StrategyCard key={rec.id} rec={rec} onSelectStock={onSelectStock} />
          ))}
        </div>
      )}
    </div>
  )
}

function StrategyCard({ rec, onSelectStock }: { rec: StrategyRecommendation; onSelectStock: (code: string) => void }) {
  const meta = STRATEGY_META[rec.strategy]
  const [expanded, setExpanded] = useState(false)

  const potentialReturn = ((rec.takeProfit - rec.price) / rec.price) * 100
  const maxLoss = ((rec.price - rec.stopLoss) / rec.price) * 100
  const rrRatio = maxLoss > 0 ? potentialReturn / maxLoss : 0

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl overflow-hidden hover:border-border/50 transition-colors">
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}15` }}>
          <TrendingUp size={14} style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => onSelectStock(rec.stockCode)} className="text-sm font-bold text-accent-light hover:underline">{rec.stockCode}</button>
            <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent-light font-semibold">{rec.action.toUpperCase()}</span>
            {rec.isSyariah && <span className="text-[8px] px-1 py-0.5 rounded bg-green/10 text-green">S</span>}
          </div>
          <p className="text-[10px] text-text-muted/60 truncate">{rec.stockName} · {rec.sector}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-mono text-text-primary">{fmtShort(rec.price)}</span>
            <span className={`text-[10px] font-mono ${rec.changePercent >= 0 ? "text-green" : "text-red"}`}>
              {rec.changePercent >= 0 ? "+" : ""}{rec.changePercent.toFixed(2)}%
            </span>
            <span className="text-[9px] text-text-muted/50 flex items-center gap-0.5">
              <Target size={9} /> {fmtShort(rec.entryZone.min)}-{fmtShort(rec.entryZone.max)}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-bold font-mono" style={{ color: meta.color }}>{rec.confidenceScore}%</div>
          <div className="text-[9px] text-text-muted/50">confidence</div>
          <div className="flex items-center gap-1 mt-1 justify-end">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className={`w-1 h-2.5 rounded-sm ${i <= rec.riskScore ? "bg-red/50" : "bg-border/20"}`} />
            ))}
          </div>
          <div className="text-[8px] text-text-muted/40 mt-0.5">Risk {rec.riskScore}/10</div>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {rec.reasoning.slice(0, 3).map((r, i) => (
          <span key={i} className="text-[9px] text-text-muted/70 bg-[#0a0b10] px-1.5 py-0.5 rounded border border-border/20">• {r}</span>
        ))}
      </div>

      <div className="px-4 pb-3 grid grid-cols-4 gap-2">
        <LevelBox label="Stop Loss" value={fmtShort(rec.stopLoss)} color="text-red" />
        <LevelBox label="Entry Zone" value={`${fmtShort(rec.entryZone.min)}`} color="text-accent-light" />
        <LevelBox label="Take Profit" value={fmtShort(rec.takeProfit)} color="text-green" />
        <LevelBox label="R:R" value={`1:${rrRatio.toFixed(1)}`} color={rrRatio >= 2 ? "text-green" : rrRatio >= 1 ? "text-yellow-500" : "text-red"} />
      </div>

      <div className="px-4 pb-3 flex items-center gap-2 text-[9px] text-text-muted/50">
        <span>{rec.timeframe}</span>
        <span className="ml-auto">
          {potentialReturn >= 0 ? "+" : ""}{potentialReturn.toFixed(1)}% potential · {maxLoss >= 0 ? "-" : ""}{maxLoss.toFixed(1)}% max loss
        </span>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-1.5 border-t border-border/20 text-[10px] text-text-muted/50 hover:text-text-primary hover:bg-surface-50/20 transition-all">
        {expanded ? "Hide signals" : `Show ${rec.signals.length} signals`}
      </button>

      {expanded && (
        <div className="px-4 py-2 bg-[#0a0b10] border-t border-border/20">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {rec.signals.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-text-muted/70">{s.name}</span>
                <span className={`font-mono ${s.bullish ? "text-green" : "text-red"}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LevelBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0b10] rounded-lg px-2 py-1.5 text-center border border-border/20">
      <div className="text-[8px] text-text-muted/50 uppercase tracking-wider">{label}</div>
      <div className={`text-[10px] font-mono font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function fmtShort(val: number): string {
  if (val >= 1e12) return `Rp${(val / 1e12).toFixed(1)}T`
  if (val >= 1e9) return `Rp${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `Rp${(val / 1e6).toFixed(1)}M`
  return `Rp${val.toLocaleString("id-ID")}`
}
