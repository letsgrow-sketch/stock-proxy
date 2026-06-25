"use client"

import { useState, useEffect, useMemo } from "react"
import { Stock, PortfolioHolding } from "@/types"
import {
  loadHoldings, saveHoldings, addHolding, removeHolding,
  averageDown, getCurrentValue, getTotalPnL, getTotalReturn,
  calcRiskReward, getSectorAllocation, formatRupiah, updateHoldingPrice,
} from "@/lib/portfolio"
import { useAuth } from "@/context/AuthContext"
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator, Target, PieChart, BarChart3, X } from "lucide-react"

interface PortfolioProps {
  stocks: Stock[]
  setSelectedStock: (s: Stock) => void
}

export default function Portfolio({ stocks, setSelectedStock }: PortfolioProps) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const { user, syncPortfolio } = useAuth()

  useEffect(() => { setHoldings(loadHoldings()) }, [])

  useEffect(() => { saveHoldings(holdings) }, [holdings])

  useEffect(() => {
    if (!user || !holdings.length) return
    const timer = setTimeout(() => {
      syncPortfolio(holdings.map(h => ({
        id: h.id, stockCode: h.stockCode, shares: h.shares,
        averageBuyPrice: h.averageBuyPrice, totalInvested: h.totalInvested,
      })))
    }, 5000)
    return () => clearTimeout(timer)
  }, [holdings, user])

  const totalInvested = useMemo(() => holdings.reduce((s, h) => s + h.totalInvested, 0), [holdings])
  const currentValue = useMemo(() => getCurrentValue(holdings, stocks), [holdings, stocks])
  const totalPnL = useMemo(() => getTotalPnL(holdings, stocks), [holdings, stocks])
  const totalReturn = useMemo(() => getTotalReturn(holdings, stocks), [holdings, stocks])
  const sectorAlloc = useMemo(() => getSectorAllocation(holdings, stocks), [holdings, stocks])

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const va = getCurrentValue([a], stocks)
      const vb = getCurrentValue([b], stocks)
      return vb - va
    })
  }, [holdings, stocks])

  return (
    <div className="space-y-4">
      {holdings.length === 0 ? (
        <EmptyState stocks={stocks} onAdd={(h) => setHoldings(h)} holdings={holdings} />
      ) : (
        <>
          <SummaryCards
            totalInvested={totalInvested}
            currentValue={currentValue}
            totalPnL={totalPnL}
            totalReturn={totalReturn}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioChart
              holdings={sortedHoldings}
              stocks={stocks}
              label="Portfolio Allocation"
              type="holding"
            />
            <PortfolioChart
              holdings={sortedHoldings}
              stocks={stocks}
              sectorAlloc={sectorAlloc}
              label="Sector Allocation"
              type="sector"
            />
          </div>

          <HoldingsTable
            holdings={sortedHoldings}
            stocks={stocks}
            onRemove={(id) => setHoldings(removeHolding(holdings, id))}
            onEdit={(id, shares, price) => setHoldings(updateHoldingPrice(holdings, id, shares, price))}
            onSelect={(code) => {
              const s = stocks.find(st => st.code === code)
              if (s) setSelectedStock(s)
            }}
            onAverageDown={(code, shares, price) => setHoldings(averageDown(holdings, code, shares, price))}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AverageDownCalculator
              holdings={holdings}
              stocks={stocks}
              onApply={(code, shares, price) => setHoldings(averageDown(holdings, code, shares, price))}
            />
            <RiskRewardCalculator />
          </div>

          <AddHoldingForm
            stocks={stocks}
            holdings={holdings}
            onAdd={(h) => setHoldings(h)}
          />
        </>
      )}
    </div>
  )
}

function EmptyState({ stocks, onAdd, holdings }: { stocks: Stock[]; onAdd: (h: PortfolioHolding[]) => void; holdings: PortfolioHolding[] }) {
  const [code, setCode] = useState("")
  const [shares, setShares] = useState("")
  const [price, setPrice] = useState("")

  const stock = stocks.find(s => s.code === code.toUpperCase())

  const handleAdd = () => {
    const sh = parseInt(shares)
    const pr = parseFloat(price)
    if (!stock || isNaN(sh) || isNaN(pr) || sh <= 0 || pr <= 0) return
    onAdd(addHolding(holdings, stock, sh, pr))
    setShares(""); setPrice("")
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center mx-auto">
          <PieChart size={24} className="text-accent-light" />
        </div>
        <h3 className="text-base font-bold text-text-primary mt-4">No Holdings Yet</h3>
        <p className="text-xs text-text-muted/70 mt-1.5 leading-relaxed">
          Track your investments by adding stocks you own. Monitor P&L, sector allocation, and more.
        </p>
        <div className="mt-6 space-y-2.5 max-w-xs mx-auto">
          <select value={code} onChange={e => setCode(e.target.value)}
            className="w-full h-9 bg-[#0c0d14] border border-border/40 rounded-lg px-3 text-xs text-text-primary focus:outline-none focus:border-accent/40">
            <option value="">Select a stock...</option>
            {stocks.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={shares} onChange={e => setShares(e.target.value)} placeholder="Shares" type="number"
              className="flex-1 h-9 bg-[#0c0d14] border border-border/40 rounded-lg px-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Buy price" type="number"
              className="flex-1 h-9 bg-[#0c0d14] border border-border/40 rounded-lg px-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
          </div>
          <button onClick={handleAdd} disabled={!stock || !shares || !price}
            className="w-full h-9 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-30 hover:bg-accent-light transition-all flex items-center justify-center gap-1.5">
            <Plus size={13} /> Add to Portfolio
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCards({ totalInvested, currentValue, totalPnL, totalReturn }: {
  totalInvested: number; currentValue: number; totalPnL: number; totalReturn: number
}) {
  const cards = [
    { label: "Total Invested", value: formatRupiah(totalInvested) },
    { label: "Current Value", value: formatRupiah(currentValue) },
    { label: "Total P&L", value: formatRupiah(totalPnL), class: totalPnL >= 0 ? "text-green" : "text-red" },
    { label: "Total Return", value: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`, class: totalReturn >= 0 ? "text-green" : "text-red" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-[#0c0d14] border border-border/30 rounded-xl px-4 py-3.5">
          <p className="text-[10px] text-text-muted/60 uppercase tracking-wider">{c.label}</p>
          <p className={`text-sm font-bold font-mono mt-1 ${c.class || "text-text-primary"}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function HoldingsTable({ holdings, stocks, onRemove, onEdit, onSelect, onAverageDown }: {
  holdings: PortfolioHolding[]; stocks: Stock[]; onRemove: (id: string) => void
  onEdit: (id: string, shares: number, price: number) => void
  onSelect: (code: string) => void
  onAverageDown: (code: string, shares: number, price: number) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editShares, setEditShares] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [avgCode, setAvgCode] = useState("")
  const [avgShares, setAvgShares] = useState("")
  const [avgPrice, setAvgPrice] = useState("")

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <h3 className="text-xs font-bold text-text-primary">Holdings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/20">
              {["Stock", "Shares", "Avg Price", "Current", "Invested", "Value", "P&L", "Return", "Alloc %", "Actions"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted/60 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map(h => {
              const cp = stocks.find(s => s.code === h.stockCode)?.price ?? h.averageBuyPrice
              const cv = cp * h.shares
              const pnl = (cp - h.averageBuyPrice) * h.shares
              const ret = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0
              const alloc = holdings.reduce((s, x) => s + (stocks.find(st => st.code === x.stockCode)?.price ?? x.averageBuyPrice) * x.shares, 0)
              const allocPct = alloc > 0 ? (cv / alloc) * 100 : 0
              const isEditing = editingId === h.id

              return (
                <tr key={h.id} className="border-b border-border/10 hover:bg-surface-50/30 transition-colors group">
                  <td className="px-3 py-2">
                    <button onClick={() => onSelect(h.stockCode)} className="text-xs font-semibold text-accent-light hover:underline">{h.stockCode}</button>
                    <div className="text-[9px] text-text-muted/50 truncate max-w-[100px]">{h.sector}</div>
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input value={editShares} onChange={e => setEditShares(e.target.value)} type="number"
                        className="w-20 h-7 bg-[#0a0b10] border border-border/30 rounded px-2 text-[11px] font-mono text-text-primary focus:outline-none focus:border-accent/40" />
                    ) : (
                      <span className="text-xs font-mono text-text-primary">{h.shares.toLocaleString("id-ID")}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input value={editPrice} onChange={e => setEditPrice(e.target.value)} type="number"
                        className="w-24 h-7 bg-[#0a0b10] border border-border/30 rounded px-2 text-[11px] font-mono text-text-primary focus:outline-none focus:border-accent/40" />
                    ) : (
                      <span className="text-xs font-mono text-text-primary">{formatRupiah(h.averageBuyPrice)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-text-primary">{formatRupiah(cp)}</td>
                  <td className="px-3 py-2 text-xs font-mono text-text-muted">{formatRupiah(h.totalInvested)}</td>
                  <td className="px-3 py-2 text-xs font-mono text-text-primary">{formatRupiah(cv)}</td>
                  <td className={`px-3 py-2 text-xs font-mono ${pnl >= 0 ? "text-green" : "text-red"}`}>
                    {pnl >= 0 ? "+" : ""}{formatRupiah(pnl)}
                  </td>
                  <td className={`px-3 py-2 text-xs font-mono ${ret >= 0 ? "text-green" : "text-red"}`}>
                    {ret >= 0 ? "+" : ""}{ret.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pnl >= 0 ? "bg-green" : "bg-red"}`} style={{ width: `${Math.min(allocPct, 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">{allocPct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => { onEdit(h.id, parseInt(editShares) || h.shares, parseFloat(editPrice) || h.averageBuyPrice); setEditingId(null) }}
                            className="p-1 rounded text-green hover:bg-green/10">✓</button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded text-text-muted/50 hover:text-text-primary">✕</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(h.id); setEditShares(h.shares.toString()); setEditPrice(h.averageBuyPrice.toString()) }}
                            className="p-1 rounded text-text-muted/30 hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100">✎</button>
                          <button onClick={() => { setAvgCode(h.stockCode); setAvgShares(""); setAvgPrice("") }}
                            className="p-1 rounded text-text-muted/30 hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100" title="Average down">
                            <Calculator size={11} />
                          </button>
                          <button onClick={() => onRemove(h.id)} className="p-1 rounded text-text-muted/30 hover:text-red transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PortfolioChart({ holdings, stocks, sectorAlloc, label, type }: {
  holdings: PortfolioHolding[]; stocks: Stock[];   sectorAlloc?: { sector: string; totalValue: number; percentage: number }[]
  label: string; type: "holding" | "sector"
}) {
  const totalValue = holdings.reduce((s, h) => s + (stocks.find(st => st.code === h.stockCode)?.price ?? h.averageBuyPrice) * h.shares, 0)
  const items = type === "holding"
    ? holdings.map(h => {
        const cp = stocks.find(s => s.code === h.stockCode)?.price ?? h.averageBuyPrice
        const v = cp * h.shares
        return { label: h.stockCode, value: v, pct: totalValue > 0 ? (v / totalValue) * 100 : 0 }
      }).sort((a, b) => b.pct - a.pct)
    : (sectorAlloc ?? []).map(s => ({ label: s.sector, value: s.totalValue, pct: s.percentage }))

  const colors = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#10b981","#f97316","#6366f1"]

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {type === "holding" ? <BarChart3 size={13} className="text-accent-light" /> : <PieChart size={13} className="text-accent-light" />}
        <h3 className="text-xs font-bold text-text-primary">{label}</h3>
      </div>
      <div className="space-y-2">
        {items.slice(0, 8).map((item, i) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-text-secondary">{item.label}</span>
              <span className="text-text-muted font-mono">{item.pct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-border/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.pct}%`, backgroundColor: colors[i % colors.length] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AverageDownCalculator({ holdings, stocks, onApply }: {
  holdings: PortfolioHolding[]; stocks: Stock[]; onApply: (code: string, shares: number, price: number) => void
}) {
  const [code, setCode] = useState("")
  const [addShares, setAddShares] = useState("")
  const [addPrice, setAddPrice] = useState("")

  const holding = holdings.find(h => h.stockCode === code)
  const cp = code ? (stocks.find(s => s.code === code)?.price ?? 0) : 0
  const newShares = parseInt(addShares) || 0
  const newPrice = parseFloat(addPrice) || 0
  const totalShares = (holding?.shares ?? 0) + newShares
  const totalCost = (holding?.totalInvested ?? 0) + (newShares * newPrice)
  const newAvg = totalShares > 0 ? totalCost / totalShares : 0
  const newPnL = newAvg > 0 && cp > 0 ? ((cp - newAvg) * totalShares) : 0
  const savings = holding && newPrice > 0 ? holding.averageBuyPrice - newAvg : 0

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={13} className="text-accent-light" />
        <h3 className="text-xs font-bold text-text-primary">Average Down Calculator</h3>
      </div>
      <div className="space-y-2.5">
        <select value={code} onChange={e => setCode(e.target.value)}
          className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] text-text-primary focus:outline-none focus:border-accent/40">
          <option value="">Select holding...</option>
          {holdings.map(h => <option key={h.stockCode} value={h.stockCode}>{h.stockCode} — avg {formatRupiah(h.averageBuyPrice)}</option>)}
        </select>
        {holding && (
          <div className="text-[10px] text-text-muted bg-[#0a0b10] rounded-lg px-2.5 py-1.5">
            Current: {holding.shares} shares @ {formatRupiah(holding.averageBuyPrice)} | Invested: {formatRupiah(holding.totalInvested)}
          </div>
        )}
        <div className="flex gap-2">
          <input value={addShares} onChange={e => setAddShares(e.target.value)} placeholder="Additional shares" type="number"
            className="flex-1 h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
          <input value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="Buy price" type="number"
            className="flex-1 h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
        </div>
        {newShares > 0 && newPrice > 0 && (
          <div className="bg-[#0a0b10] border border-border/20 rounded-lg p-2.5 space-y-1">
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">New Avg Price</span><span className="text-text-primary font-mono font-semibold">{formatRupiah(newAvg)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">New Total Shares</span><span className="text-text-primary font-mono">{totalShares.toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">New Total Cost</span><span className="text-text-primary font-mono">{formatRupiah(totalCost)}</span></div>
            {savings > 0 && <div className="flex justify-between text-[10px]"><span className="text-green">Avg Price Reduced By</span><span className="text-green font-mono">{formatRupiah(savings)}</span></div>}
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">Est. P&L at {formatRupiah(cp)}</span><span className={newPnL >= 0 ? "text-green font-mono" : "text-red font-mono"}>{newPnL >= 0 ? "+" : ""}{formatRupiah(newPnL)}</span></div>
            <button onClick={() => { onApply(code, newShares, newPrice); setAddShares(""); setAddPrice("") }}
              className="w-full mt-1.5 h-7 rounded-lg bg-accent text-white text-[10px] font-semibold hover:bg-accent-light transition-all">Apply</button>
          </div>
        )}
      </div>
    </div>
  )
}

function RiskRewardCalculator() {
  const [entry, setEntry] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [target, setTarget] = useState("")

  const e = parseFloat(entry); const sl = parseFloat(stopLoss); const t = parseFloat(target)
  const result = (e > 0 && sl > 0 && t > 0) ? calcRiskReward(e, sl, t) : null

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} className="text-accent-light" />
        <h3 className="text-xs font-bold text-text-primary">Risk / Reward Calculator</h3>
      </div>
      <div className="space-y-2.5">
        <input value={entry} onChange={e => setEntry(e.target.value)} placeholder="Entry price" type="number"
          className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
        <div className="flex gap-2">
          <input value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Stop loss" type="number"
            className="flex-1 h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
          <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target" type="number"
            className="flex-1 h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
        </div>
        {result && (
          <div className="bg-[#0a0b10] border border-border/20 rounded-lg p-2.5 space-y-1">
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">Risk (per share)</span><span className="text-red font-mono">{formatRupiah(result.risk)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-text-muted/70">Reward (per share)</span><span className="text-green font-mono">{formatRupiah(result.reward)}</span></div>
            <div className="flex justify-between text-[10px] pt-1 border-t border-border/20"><span className="text-text-primary font-semibold">R:R Ratio</span>
              <span className={`font-mono font-bold ${result.ratio >= 2 ? "text-green" : result.ratio >= 1 ? "text-yellow-500" : "text-red"}`}>
                1:{result.ratio.toFixed(2)}
              </span>
            </div>
            {result.ratio >= 2 && <p className="text-[9px] text-green mt-0.5">Good risk/reward</p>}
            {result.ratio < 1 && <p className="text-[9px] text-red mt-0.5">Poor risk/reward — consider skipping</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function AddHoldingForm({ stocks, holdings, onAdd }: {
  stocks: Stock[]; holdings: PortfolioHolding[]; onAdd: (h: PortfolioHolding[]) => void
}) {
  const [code, setCode] = useState("")
  const [shares, setShares] = useState("")
  const [price, setPrice] = useState("")
  const [open, setOpen] = useState(false)

  const stock = stocks.find(s => s.code === code)
  const handleAdd = () => {
    const sh = parseInt(shares); const pr = parseFloat(price)
    if (!stock || isNaN(sh) || isNaN(pr) || sh <= 0 || pr <= 0) return
    onAdd(addHolding(holdings, stock, sh, pr))
    setShares(""); setPrice(""); setCode("")
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-border/30 text-xs text-text-muted/50 hover:text-accent-light hover:border-accent/30 transition-all flex items-center justify-center gap-1.5">
        <Plus size={13} /> Add Holding
      </button>
    )
  }

  return (
    <div className="bg-[#0c0d14] border border-border/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-text-primary">Add Holding</h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded text-text-muted/50 hover:text-text-primary"><X size={13} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={code} onChange={e => setCode(e.target.value)}
          className="h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] text-text-primary focus:outline-none focus:border-accent/40 min-w-[160px]">
          <option value="">Select stock...</option>
          {stocks.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
        </select>
        <input value={shares} onChange={e => setShares(e.target.value)} placeholder="Shares" type="number"
          className="h-8 w-24 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Buy price" type="number"
          className="h-8 w-28 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40" />
        <button onClick={handleAdd} disabled={!stock || !shares || !price}
          className="h-8 px-4 rounded-lg bg-accent text-white text-[11px] font-semibold disabled:opacity-30 hover:bg-accent-light transition-all">Add</button>
      </div>
    </div>
  )
}
