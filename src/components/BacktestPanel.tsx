"use client"

import { useState, useEffect } from "react"
import type { BacktestStrategy, BacktestResult, BacktestTrade, BacktestConfig, EquityPoint } from "@/lib/backtest"
import { strategyLabel, strategyDescription } from "@/lib/backtest"
import { STOCK_NAMES, STOCK_SECTORS, STOCK_SYMBOLS } from "@/lib/constants"
import {
  BarChart3, TrendingUp, Download, Play, Loader2, AlertTriangle,
  ChevronDown, ChevronUp, DollarSign, Percent, Target, Activity,
} from "lucide-react"

const STRATEGIES: { id: BacktestStrategy; label: string }[] = [
  { id: "sma_crossover", label: "SMA Crossover" },
  { id: "rsi_mean_reversion", label: "RSI Mean Reversion" },
  { id: "macd_crossover", label: "MACD Crossover" },
  { id: "bollinger_bands", label: "Bollinger Bands" },
  { id: "breakout", label: "Breakout" },
]

const RANGES = [
  { id: "1y", label: "1 Year" },
  { id: "2y", label: "2 Years" },
  { id: "5y", label: "5 Years" },
  { id: "max", label: "Max" },
]

export default function BacktestPanel() {
  const [strategy, setStrategy] = useState<BacktestStrategy>("sma_crossover")
  const [stockCode, setStockCode] = useState("BBCA")
  const [range, setRange] = useState("2y")
  const [initialCapital, setInitialCapital] = useState(100_000_000)
  const [positionSize, setPositionSize] = useState(1)
  const [stopLoss, setStopLoss] = useState(0)
  const [takeProfit, setTakeProfit] = useState(0)
  const [smaShort, setSmaShort] = useState(20)
  const [smaLong, setSmaLong] = useState(50)
  const [rsiPeriod, setRsiPeriod] = useState(14)
  const [rsiOversold, setRsiOversold] = useState(30)
  const [rsiOverbought, setRsiOverbought] = useState(70)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showTrades, setShowTrades] = useState(false)
  const [showParams, setShowParams] = useState(false)
  const [chartType, setChartType] = useState<"equity" | "drawdown">("equity")

  const stockOptions = STOCK_SYMBOLS.map(code => ({
    code,
    name: STOCK_NAMES[code] || code,
    sector: STOCK_SECTORS[code] || "",
  }))

  async function runBacktest() {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode,
          range,
          strategy,
          initialCapital,
          positionSize: positionSize || 1,
          stopLoss: stopLoss > 0 ? stopLoss / 100 : 0,
          takeProfit: takeProfit > 0 ? takeProfit / 100 : 0,
          smaShort: strategy === "sma_crossover" ? smaShort : undefined,
          smaLong: strategy === "sma_crossover" ? smaLong : undefined,
          rsiPeriod: strategy === "rsi_mean_reversion" ? rsiPeriod : undefined,
          rsiOversold: strategy === "rsi_mean_reversion" ? rsiOversold : undefined,
          rsiOverbought: strategy === "rsi_mean_reversion" ? rsiOverbought : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Backtest failed")
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run backtest")
    }
    setLoading(false)
  }

  function downloadCSV() {
    return
  }

  const m = result?.metrics

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-text-primary text-lg font-bold">Backtesting Engine</h2>
          <p className="text-text-muted text-xs mt-0.5">Test trading strategies against historical data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-[#13151d] border border-border/50 rounded-xl p-4 space-y-3">
            <h3 className="text-text-primary text-sm font-semibold flex items-center gap-1.5">
              <Play size={13} className="text-accent-light" /> Config
            </h3>

            <div>
              <label className="text-text-muted text-[10px] block mb-1">Stock</label>
              <select value={stockCode} onChange={e => setStockCode(e.target.value)}
                className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2 text-xs text-text-primary focus:outline-none focus:border-accent/40">
                {stockOptions.map(s => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted text-[10px] block mb-1">Strategy</label>
              <select value={strategy} onChange={e => setStrategy(e.target.value as BacktestStrategy)}
                className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2 text-xs text-text-primary focus:outline-none focus:border-accent/40">
                {STRATEGIES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <p className="text-[9px] text-text-muted/60 mt-1 leading-relaxed">{strategyDescription(strategy)}</p>
            </div>

            <div>
              <label className="text-text-muted text-[10px] block mb-1">Data Range</label>
              <div className="flex gap-1">
                {RANGES.map(r => (
                  <button key={r.id}
                    onClick={() => setRange(r.id)}
                    className={`flex-1 h-7 rounded text-[10px] font-medium transition-all ${
                      range === r.id
                        ? "bg-accent text-white"
                        : "bg-[#2a2c35] text-text-muted hover:bg-[#353845]"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-text-muted text-[10px] block mb-1">Initial Capital</label>
              <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))}
                className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2 text-xs text-text-primary focus:outline-none focus:border-accent/40" />
            </div>

            <div>
              <label className="text-text-muted text-[10px] block mb-1">Position Size</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0.1" max="1" step="0.1" value={positionSize} onChange={e => setPositionSize(Number(e.target.value))}
                  className="flex-1 accent-accent h-1" />
                <span className="text-text-secondary text-[10px] w-8 text-right">{(positionSize * 100).toFixed(0)}%</span>
              </div>
            </div>

            <button onClick={showParams ? () => setShowParams(false) : () => setShowParams(true)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0c0d14] border border-border/20 text-text-muted text-[10px] hover:text-text-primary transition-all">
              Strategy Parameters
              {showParams ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showParams && (
              <div className="space-y-2.5 pt-1 border-t border-border/20">
                {strategy === "sma_crossover" && (
                  <>
                    <ParamField label="Fast SMA" value={smaShort} onChange={setSmaShort} min={5} max={50} />
                    <ParamField label="Slow SMA" value={smaLong} onChange={setSmaLong} min={20} max={200} />
                  </>
                )}
                {strategy === "rsi_mean_reversion" && (
                  <>
                    <ParamField label="RSI Period" value={rsiPeriod} onChange={setRsiPeriod} min={5} max={30} />
                    <ParamField label="Oversold" value={rsiOversold} onChange={setRsiOversold} min={10} max={40} />
                    <ParamField label="Overbought" value={rsiOverbought} onChange={setRsiOverbought} min={60} max={90} />
                  </>
                )}
                <div className="border-t border-border/20 pt-2">
                  <ParamField label="Stop Loss %" value={stopLoss} onChange={v => setStopLoss(v)} min={0} max={50} step={0.5} />
                  <ParamField label="Take Profit %" value={takeProfit} onChange={v => setTakeProfit(v)} min={0} max={100} step={0.5} />
                </div>
              </div>
            )}

            <button onClick={runBacktest} disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-light transition-all disabled:opacity-40">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              {loading ? "Running..." : "Run Backtest"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red/5 border border-red/20 text-red text-xs">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 size={40} className="text-text-muted/30 mb-3" />
              <p className="text-text-muted text-sm">Configure and run a backtest to see results</p>
              <p className="text-text-muted/50 text-[10px] mt-1">Select a stock and strategy, then click Run Backtest</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={24} className="text-accent animate-spin mb-3" />
              <p className="text-text-muted text-sm">Downloading historical data and running simulation...</p>
            </div>
          )}

          {result && m && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="Net Profit" value={`Rp ${m.netProfit.toLocaleString("id-ID")}`}
                  change={m.totalReturnPercent} icon={DollarSign} />
                <MetricCard label="Total Return" value={`${(m.totalReturnPercent * 100).toFixed(2)}%`}
                  change={m.totalReturnPercent} icon={Percent} />
                <MetricCard label="CAGR" value={`${(m.cagr * 100).toFixed(2)}%`}
                  change={m.cagr} icon={TrendingUp} />
                <MetricCard label="Sharpe Ratio" value={m.sharpeRatio.toFixed(2)}
                  change={m.sharpeRatio - 1} threshold={1} />
                <MetricCard label="Sortino Ratio" value={m.sortinoRatio.toFixed(2)}
                  change={m.sortinoRatio - 1} threshold={1} />
                <MetricCard label="Max DD" value={`${(m.maxDrawdownPercent * 100).toFixed(2)}%`}
                  change={-m.maxDrawdownPercent} invert />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SimpleCard label="Win Rate" value={`${(m.winRate * 100).toFixed(1)}%`} sub={`${m.winningTrades}/${m.totalTrades}`} />
                <SimpleCard label="Profit Factor" value={m.profitFactor === 999 ? "∞" : m.profitFactor.toFixed(2)} />
                <SimpleCard label="Total Trades" value={String(m.totalTrades)} sub={`Avg ${m.avgHoldingPeriod.toFixed(0)} days`} />
                <SimpleCard label="Calmar Ratio" value={m.calmarRatio.toFixed(2)} />
                <SimpleCard label="Avg Win" value={`${(m.avgWin * 100).toFixed(2)}%`} />
                <SimpleCard label="Avg Loss" value={`${(m.avgLoss * 100).toFixed(2)}%`} />
                <SimpleCard label="Best Trade" value={`${(m.bestTrade * 100).toFixed(2)}%`} />
                <SimpleCard label="Worst Trade" value={`${(m.worstTrade * 100).toFixed(2)}%`} />
              </div>

              <div className="bg-[#13151d] border border-border/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-text-primary text-sm font-semibold">Equity Curve</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setChartType("equity")}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${chartType === "equity" ? "bg-accent text-white" : "bg-[#2a2c35] text-text-muted hover:bg-[#353845]"}`}>
                      Equity
                    </button>
                    <button onClick={() => setChartType("drawdown")}
                      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${chartType === "drawdown" ? "bg-accent text-white" : "bg-[#2a2c35] text-text-muted hover:bg-[#353845]"}`}>
                      Drawdown
                    </button>
                  </div>
                </div>
                <EquityChart curve={result.equityCurve} type={chartType} />
              </div>

              <div className="bg-[#13151d] border border-border/50 rounded-xl">
                <button onClick={() => setShowTrades(!showTrades)}
                  className="w-full flex items-center justify-between px-4 py-3">
                  <h3 className="text-text-primary text-sm font-semibold">
                    Trade Log ({result.trades.length} trades)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); downloadCSV() }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-accent/10 text-accent-light text-[10px] font-medium hover:bg-accent/20 transition-all">
                      <Download size={10} /> CSV
                    </button>
                    {showTrades ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                  </div>
                </button>
                {showTrades && (
                  <div className="overflow-x-auto border-t border-border/30">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-text-muted/60 text-[10px] border-b border-border/20">
                          <th className="text-left px-3 py-2 font-medium">Entry</th>
                          <th className="text-right px-3 py-2 font-medium">Entry Price</th>
                          <th className="text-left px-3 py-2 font-medium">Exit</th>
                          <th className="text-right px-3 py-2 font-medium">Exit Price</th>
                          <th className="text-right px-3 py-2 font-medium">Shares</th>
                          <th className="text-right px-3 py-2 font-medium">P&L</th>
                          <th className="text-right px-3 py-2 font-medium">Return</th>
                          <th className="text-right px-3 py-2 font-medium">Days</th>
                          <th className="text-right px-3 py-2 font-medium">Exit Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.map(t => (
                          <tr key={t.id} className="border-b border-border/10 hover:bg-surface-50/30 transition-all">
                            <td className="px-3 py-2 text-text-primary">{t.entryDate}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">Rp {t.entryPrice.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2 text-text-primary">{t.exitDate}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">Rp {t.exitPrice.toLocaleString("id-ID")}</td>
                            <td className="px-3 py-2 text-right text-text-secondary">{t.shares}</td>
                            <td className={`px-3 py-2 text-right font-medium ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}Rp {t.pnl.toLocaleString("id-ID")}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${t.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {t.pnlPercent >= 0 ? "+" : ""}{(t.pnlPercent * 100).toFixed(2)}%
                            </td>
                            <td className="px-3 py-2 text-right text-text-secondary">{t.holdingPeriod}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                t.exitReason === "take_profit" ? "bg-green-400/10 text-green-400" :
                                t.exitReason === "stop_loss" ? "bg-red-400/10 text-red-400" :
                                "bg-surface-50/50 text-text-muted"
                              }`}>{t.exitReason.replace(/_/g, " ")}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, icon, threshold, invert }: {
  label: string; value: string; change?: number; icon?: any; threshold?: number; invert?: boolean
}) {
  const isPositive = change !== undefined
    ? invert ? change < 0 : change > (threshold ?? 0)
    : null
  const Icon = icon
  return (
    <div className="bg-[#13151d] border border-border/50 rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center"><Icon size={11} className="text-accent-light" /></div>}
        <span className="text-text-muted/70 text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-text-primary text-sm font-bold">{value}</span>
        {isPositive !== null && (
          <span className={`text-[10px] font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  )
}

function SimpleCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#13151d] border border-border/50 rounded-xl p-3">
      <div className="text-text-muted/70 text-[9px] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-text-primary text-sm font-bold">{value}</div>
      {sub && <div className="text-text-muted/50 text-[9px] mt-0.5">{sub}</div>}
    </div>
  )
}

function ParamField({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number
}) {
  return (
    <div>
      <label className="text-text-muted text-[10px] block mb-0.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        min={min} max={max} step={step || 1}
        className="w-full h-7 bg-[#0a0b10] border border-border/30 rounded px-2 text-[10px] text-text-primary focus:outline-none focus:border-accent/40" />
    </div>
  )
}

function EquityChart({ curve, type }: { curve: EquityPoint[]; type: "equity" | "drawdown" }) {
  if (!curve.length) return null
  const width = 700
  const height = 220
  const pad = { top: 20, right: 20, bottom: 25, left: 60 }

  const values = type === "equity" ? curve.map(c => c.equity) : curve.map(c => c.drawdownPercent * 100)
  const labels = curve.map(c => c.date)
  const minVal = type === "drawdown" ? 0 : Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const xStep = (width - pad.left - pad.right) / Math.max(curve.length - 1, 1)
  const yScale = (v: number) => pad.top + (height - pad.top - pad.bottom) * (1 - (v - minVal) / range)

  const points = curve.map((c, i) => `${pad.left + i * xStep},${yScale(values[i])}`).join(" ")

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks }, (_, i) => minVal + (range * i) / (yTicks - 1))

  const xLabelCount = Math.min(curve.length, 6)
  const xLabelStep = Math.floor(curve.length / (xLabelCount - 1))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {yTickValues.map(v => (
        <g key={v}>
          <line x1={pad.left} y1={yScale(v)} x2={width - pad.right} y2={yScale(v)}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pad.left - 6} y={yScale(v) + 3} textAnchor="end" fill="#64748b" fontSize="9">
            {type === "equity" ? `Rp ${Math.round(v).toLocaleString("id-ID")}` : `${v.toFixed(1)}%`}
          </text>
        </g>
      ))}
      {Array.from({ length: xLabelCount }, (_, i) => {
        const idx = Math.min(i * xLabelStep, curve.length - 1)
        return (
          <text key={labels[idx]} x={pad.left + idx * xStep} y={height - 5} textAnchor="middle" fill="#64748b" fontSize="8">
            {labels[idx]?.substring(2) || ""}
          </text>
        )
      })}
      <polyline points={points}
        fill="none"
        stroke={type === "drawdown" ? "#ef4444" : "#6366f1"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round" />
      {type === "equity" && (
        <line x1={pad.left} y1={yScale(curve[0].equity)} x2={width - pad.right} y2={yScale(curve[0].equity)}
          stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeDasharray="4,3" />
      )}
    </svg>
  )
}
