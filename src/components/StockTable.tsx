"use client"

import { useState, useMemo, useEffect } from "react"
import { Stock, TechnicalData, FundamentalData, SortField, SortDirection, StockScore } from "@/types"
import { formatCurrency, formatPercent } from "@/data/mock"
import { Star, ArrowUpDown, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from "lucide-react"

interface StockTableProps {
  stocks: Stock[]
  selectedStock: Stock | null
  setSelectedStock: (s: Stock | null) => void
  isInWatchlist: (code: string) => boolean
  toggleWatchlist: (s: Stock) => void
  technicalData?: Record<string, TechnicalData>
  fundamentalData?: Record<string, FundamentalData>
}

const columns: { key: string; label: string; align?: string; sortable: boolean; sortKey?: SortField }[] = [
  { key: "code", label: "Code", sortable: true, sortKey: "code" },
  { key: "name", label: "Company", sortable: true, sortKey: "name" },
  { key: "sector", label: "Sector", sortable: false },
  { key: "score", label: "Score", align: "right", sortable: true, sortKey: "score" },
  { key: "trend", label: "Trend", align: "center", sortable: false },
  { key: "price", label: "Price", align: "right", sortable: true, sortKey: "price" },
  { key: "rsi", label: "RSI", align: "right", sortable: true, sortKey: "rsi" },
  { key: "ma50", label: "MA50", align: "right", sortable: true, sortKey: "ma50" },
  { key: "ma200", label: "MA200", align: "right", sortable: true, sortKey: "ma200" },
  { key: "pbv", label: "PBV", align: "right", sortable: true, sortKey: "pbv" },
  { key: "per", label: "PER", align: "right", sortable: true, sortKey: "per" },
  { key: "yield", label: "Yield", align: "right", sortable: true, sortKey: "yield" },
  { key: "action", label: "Action", align: "center", sortable: false },
]

function computeScores(stocks: Stock[], technicalData: Record<string, TechnicalData>, fundamentalData: Record<string, FundamentalData>): StockScore[] {
  return stocks.map(s => {
    const ta = technicalData[s.code]
    const fa = fundamentalData[s.code]
    const rsi = ta?.rsi ?? 50
    const ma50 = ta?.ma50 ?? s.price
    const ma200 = ta?.ma200 ?? s.price
    const pbv = fa?.pbv ?? 1
    const per = fa?.per ?? 15
    const yieldVal = fa?.dividendYield ?? 0

    const trend: "up" | "down" | "sideways" = rsi > 55 ? "up" : rsi < 45 ? "down" : "sideways"

    let score = 50
    if (s.changePercent > 2) score += 15
    else if (s.changePercent > 0) score += 8
    else if (s.changePercent < -2) score -= 15
    else if (s.changePercent < 0) score -= 8

    if (rsi > 30 && rsi < 70) score += 10
    if (rsi > 70) score -= 5
    if (rsi < 30) score += 5
    if (s.price > ma50) score += 10
    else score -= 5
    if (ma50 > ma200) score += 10
    else score -= 5
    if (pbv < 2) score += 10
    if (pbv > 5) score -= 5
    if (per > 0 && per < 15) score += 10
    if (yieldVal > 3) score += 5
    if (s.volume > 50000000) score += 5

    score = Math.max(0, Math.min(100, score))

    let action: "Buy" | "Hold" | "Sell" = "Hold"
    if (score >= 70) action = "Buy"
    else if (score <= 35) action = "Sell"

    return {
      code: s.code, name: s.name, sector: s.sector,
      price: s.price, change: s.change, changePercent: s.changePercent,
      score, trend, rsi, ma50, ma200, pbv, per, yield: yieldVal,
      volume: s.volume, marketCap: s.marketCap, isSyariah: s.isSyariah, action,
      stock: s,
    }
  })
}

export default function StockTable({
  stocks, selectedStock, setSelectedStock, isInWatchlist, toggleWatchlist, technicalData = {}, fundamentalData = {},
}: StockTableProps) {
  console.log("[DEBUG StockTable] received stocks count=%d codes=%s", stocks.length, stocks.map(s => s.code).join(","))

  const [sort, setSort] = useState<{ field: SortField; dir: SortDirection }>({ field: "score", dir: "desc" })
  const [page, setPage] = useState(0)
  const perPage = 15

  useEffect(() => { setPage(0) }, [stocks.length])

  const scored = useMemo(() => computeScores(stocks, technicalData, fundamentalData), [stocks, technicalData, fundamentalData])

  const sorted = useMemo(() => {
    const arr = [...scored]
    arr.sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1
      const va = a[sort.field as keyof StockScore]
      const vb = b[sort.field as keyof StockScore]
      return (va > vb ? 1 : -1) * mul
    })
    return arr
  }, [scored, sort])

  const paged = useMemo(() => sorted.slice(page * perPage, (page + 1) * perPage), [sorted, page])
  const totalPages = Math.ceil(sorted.length / perPage)

  const toggleSort = (field: SortField) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === "desc" ? "asc" : "desc" }))
  }

  const startRow = page * perPage + 1
  const endRow = Math.min((page + 1) * perPage, sorted.length)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Screener</h2>
          <span className="text-xs text-text-muted">{stocks.length} stocks</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="hidden sm:inline">
            Sorted by <span className="font-semibold text-text-secondary capitalize">{sort.field}</span>
            <span className="ml-1">({sort.dir === "asc" ? "↑" : "↓"})</span>
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span>{startRow}–{endRow} of {sorted.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50 bg-surface-50/30">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30 bg-surface-50/80">
              <th className="w-8 px-2 py-3"></th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && col.sortKey && toggleSort(col.sortKey)}
                  className={`px-2 py-3 text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em] whitespace-nowrap ${
                    col.sortable ? "cursor-pointer hover:text-text-secondary select-none" : ""
                  } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && col.sortKey && (
                      <ArrowUpDown size={10} className={sort.field === col.sortKey ? "text-green" : "text-text-muted/30"} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => (
              <tr
                key={item.code}
                onClick={() => setSelectedStock(item.stock)}
                className={`border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors duration-150 ${
                  selectedStock?.code === item.code ? "bg-green/[0.03]" : ""
                }`}
              >
                <td className="px-2 py-2.5">
                  <button
                    onClick={e => { e.stopPropagation(); toggleWatchlist(item.stock) }}
                    className="hover:scale-110 transition-transform p-1 -m-1"
                  >
                    <Star size={11} className={isInWatchlist(item.code) ? "fill-yellow-500 text-yellow-500" : "text-text-muted/40"} />
                  </button>
                </td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-text-primary">{item.code}</span>
                    {item.isSyariah && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-green/15 text-green font-bold leading-none">S</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-text-muted max-w-[140px] truncate">{item.name}</td>
                <td className="px-2 py-2.5 text-text-muted text-[10px]">{item.sector}</td>
                <td className="px-2 py-2.5 text-right">
                  <span className={`font-mono font-bold text-sm tabular-nums ${
                    item.score >= 70 ? "text-green" : item.score <= 35 ? "text-red" : "text-yellow-500"
                  }`}>
                    {item.score}
                  </span>
                </td>
                <td className="px-2 py-2.5 text-center">
                  {item.trend === "up" ? (
                    <TrendingUp size={14} className="text-green inline-block" />
                  ) : item.trend === "down" ? (
                    <TrendingDown size={14} className="text-red inline-block" />
                  ) : (
                    <Minus size={14} className="text-text-muted inline-block" />
                  )}
                </td>
                <td className={`px-2 py-2.5 font-mono text-right font-medium tabular-nums ${item.change >= 0 ? "text-green" : "text-red"}`}>
                  {item.price.toLocaleString("id-ID")}
                </td>
                <td className="px-2 py-2.5 font-mono text-right text-text-secondary tabular-nums">{item.rsi.toFixed(1)}</td>
                <td className="px-2 py-2.5 font-mono text-right tabular-nums">
                  <span className={item.price >= item.ma50 ? "text-green" : "text-red"}>{item.ma50.toLocaleString("id-ID")}</span>
                </td>
                <td className="px-2 py-2.5 font-mono text-right tabular-nums">
                  <span className={item.ma50 >= item.ma200 ? "text-green" : "text-red"}>{item.ma200.toLocaleString("id-ID")}</span>
                </td>
                <td className="px-2 py-2.5 font-mono text-right text-text-secondary tabular-nums">{item.pbv.toFixed(2)}</td>
                <td className="px-2 py-2.5 font-mono text-right text-text-secondary tabular-nums">{item.per > 0 ? item.per.toFixed(1) : "—"}</td>
                <td className="px-2 py-2.5 font-mono text-right text-text-secondary tabular-nums">{item.yield > 0 ? `${item.yield.toFixed(1)}%` : "—"}</td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold ${
                    item.action === "Buy" ? "bg-green/10 text-green" :
                    item.action === "Sell" ? "bg-red/10 text-red" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {item.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <div className="text-[10px] text-text-muted">Page {page + 1} of {totalPages}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-50 border border-border/30 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i
              } else if (page <= 3) {
                pageNum = i
              } else if (page >= totalPages - 4) {
                pageNum = totalPages - 7 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                    page === pageNum ? "bg-green/10 text-green border border-green/20" : "text-text-muted hover:text-text-primary hover:bg-surface-50 border border-border/30"
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-50 border border-border/30 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
