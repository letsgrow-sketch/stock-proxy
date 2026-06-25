"use client"

import { useState, useMemo } from "react"
import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"
import { STOCK_SECTORS } from "@/lib/constants"
import { formatCurrency, formatPercent } from "@/data/mock"
import {
  ScreenerFilters, defaultFilters, applyFilters, ScreenerResult,
  RSI_PRESETS, PER_PRESETS, PBV_PRESETS, MKT_CAP_PRESETS, DIVIDEND_PRESETS,
  RangeFilter,
} from "@/lib/screener"
import { Filter, ChevronDown, ChevronUp, Search, RotateCcw, Star } from "lucide-react"

interface StockScreenerProps {
  stocks: Stock[]
  technicalData: Record<string, TechnicalData>
  fundamentalData: Record<string, FundamentalData>
  flowData: Record<string, FlowData>
  setSelectedStock: (s: Stock) => void
  isInWatchlist: (code: string) => boolean
  toggleWatchlist: (s: Stock) => void
}

const sectors = Array.from(new Set(Object.values(STOCK_SECTORS))).sort()

type SortKey = "code" | "price" | "changePercent" | "volume" | "marketCap" | "per" | "pbv" | "roe" | "rsi" | "netForeign"

export default function StockScreener({ stocks, technicalData, fundamentalData, flowData, setSelectedStock, isInWatchlist, toggleWatchlist }: StockScreenerProps) {
  const [filters, setFilters] = useState<ScreenerFilters>({ ...defaultFilters })
  const [showFilters, setShowFilters] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    general: true,
    fundamental: false,
    technical: false,
    flow: false,
  })
  const [sortKey, setSortKey] = useState<SortKey>("changePercent")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const results = useMemo(() => {
    const filtered = applyFilters(stocks, filters, technicalData, fundamentalData, flowData)
    return filtered.sort((a, b) => {
      let va: number, vb: number
      switch (sortKey) {
        case "price": va = a.stock.price; vb = b.stock.price; break
        case "changePercent": va = a.stock.changePercent; vb = b.stock.changePercent; break
        case "volume": va = a.stock.volume; vb = b.stock.volume; break
        case "marketCap": va = a.stock.marketCap; vb = b.stock.marketCap; break
        case "per": va = a.fund?.per ?? 999; vb = b.fund?.per ?? 999; break
        case "pbv": va = a.fund?.pbv ?? 999; vb = b.fund?.pbv ?? 999; break
        case "roe": va = a.fund?.roe ?? -999; vb = b.fund?.roe ?? -999; break
        case "rsi": va = a.tech?.rsi ?? 0; vb = b.tech?.rsi ?? 0; break
        case "netForeign": va = a.flow?.netForeign ?? 0; vb = b.flow?.netForeign ?? 0; break
        default: va = a.stock.changePercent; vb = b.stock.changePercent
      }
      return sortDir === "desc" ? vb - va : va - vb
    })
  }, [stocks, filters, technicalData, fundamentalData, flowData, sortKey, sortDir])

  const toggleGroup = (g: string) => setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }))

  const setRange = (key: keyof ScreenerFilters, val: RangeFilter) => {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  const setSelect = (key: keyof ScreenerFilters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  const toggleSector = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector],
    }))
  }

  const clearAll = () => setFilters({ ...defaultFilters })

  const activeCount = useMemo(() => {
    let n = 0
    if (filters.sectors.length) n++
    if (filters.syariah !== "all") n++
    if (filters.marketCap.min !== undefined || filters.marketCap.max !== undefined) n++
    if (filters.per.min !== undefined || filters.per.max !== undefined) n++
    if (filters.pbv.min !== undefined || filters.pbv.max !== undefined) n++
    if (filters.roe.min !== undefined || filters.roe.max !== undefined) n++
    if (filters.der.min !== undefined || filters.der.max !== undefined) n++
    if (filters.revenueGrowth.min !== undefined || filters.revenueGrowth.max !== undefined) n++
    if (filters.netProfitGrowth.min !== undefined || filters.netProfitGrowth.max !== undefined) n++
    if (filters.dividendYield.min !== undefined || filters.dividendYield.max !== undefined) n++
    if (filters.volumeSpike) n++
    if (filters.breakout) n++
    if (filters.nearSupport) n++
    if (filters.nearResistance) n++
    if (filters.foreignNetBuy.min !== undefined || filters.foreignNetBuy.max !== undefined) n++
    if (filters.rsi.min !== undefined || filters.rsi.max !== undefined) n++
    if (filters.macd !== "any") n++
    if (filters.ema20 !== "any") n++
    if (filters.ema50 !== "any") n++
    if (filters.ema200 !== "any") n++
    return n
  }, [filters])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  function SortHeader({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <th className={`px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${active ? "text-accent-light" : "text-text-muted/60"} hover:text-accent-light/80 transition-colors`} onClick={() => toggleSort(k)}>
        <div className="flex items-center gap-1">
          {label}
          {active && <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
        </div>
      </th>
    )
  }

  return (
    <div className="flex gap-4 h-full">
      <div className={`shrink-0 transition-all duration-200 ${showFilters ? "w-64" : "w-0 overflow-hidden"}`}>
        <div className="w-64 h-full bg-[#0c0d14] border border-border/30 rounded-xl overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
              <Filter size={13} />
              Filters
              {activeCount > 0 && (
                <span className="bg-accent/20 text-accent-light text-[9px] px-1.5 py-0.5 rounded-full">{activeCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {activeCount > 0 && (
                <button onClick={clearAll} className="p-1 rounded text-text-muted/50 hover:text-text-primary hover:bg-surface-50/50 transition-all" title="Clear all filters">
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="px-3 py-2 border-b border-border/20">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/50" />
              <input
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search stocks..."
                className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg pl-7 pr-2 text-[11px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all"
              />
            </div>
          </div>

          <FilterGroup label="General" group="general" expanded={expandedGroups.general} onToggle={() => toggleGroup("general")}>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-text-muted/60 uppercase tracking-wider">Sector</label>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {sectors.map(s => (
                    <button key={s} onClick={() => toggleSector(s)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                        filters.sectors.includes(s)
                          ? "bg-accent/15 border-accent/30 text-accent-light"
                          : "border-border/30 text-text-muted/60 hover:border-border/60"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted/60 uppercase tracking-wider">Syariah</label>
                <div className="flex gap-1 mt-1.5">
                  {["all", "syariah", "non-syariah"].map(v => (
                    <button key={v} onClick={() => setSelect("syariah", v)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all capitalize ${
                        filters.syariah === v
                          ? "bg-accent/15 border-accent/30 text-accent-light"
                          : "border-border/30 text-text-muted/60 hover:border-border/60"
                      }`}
                    >{v.replace("-", " ")}</button>
                  ))}
                </div>
              </div>
            </div>
          </FilterGroup>

          <FilterGroup label="Fundamental" group="fundamental" expanded={expandedGroups.fundamental} onToggle={() => toggleGroup("fundamental")}>
            <div className="space-y-3">
              <RangeInput label="Market Cap" value={filters.marketCap} onChange={v => setRange("marketCap", v)} presets={MKT_CAP_PRESETS} format="currency" />
              <RangeInput label="PER (x)" value={filters.per} onChange={v => setRange("per", v)} presets={PER_PRESETS} />
              <RangeInput label="PBV (x)" value={filters.pbv} onChange={v => setRange("pbv", v)} presets={PBV_PRESETS} />
              <RangeInput label="ROE (%)" value={filters.roe} onChange={v => setRange("roe", v)} />
              <RangeInput label="DER" value={filters.der} onChange={v => setRange("der", v)} />
              <RangeInput label="Revenue Growth (%)" value={filters.revenueGrowth} onChange={v => setRange("revenueGrowth", v)} />
              <RangeInput label="Net Profit Growth (%)" value={filters.netProfitGrowth} onChange={v => setRange("netProfitGrowth", v)} />
              <RangeInput label="Dividend Yield (%)" value={filters.dividendYield} onChange={v => setRange("dividendYield", v)} presets={DIVIDEND_PRESETS} />
            </div>
          </FilterGroup>

          <FilterGroup label="Technical" group="technical" expanded={expandedGroups.technical} onToggle={() => toggleGroup("technical")}>
            <div className="space-y-3">
              <RangeInput label="RSI (14)" value={filters.rsi} onChange={v => setRange("rsi", v)} presets={RSI_PRESETS} />
              <SelectInput label="MACD" value={filters.macd} onChange={v => setSelect("macd", v)} options={[
                { label: "Any", value: "any" },
                { label: "Positive", value: "positive" },
                { label: "Negative", value: "negative" },
              ]} />
              <SelectInput label="Price vs EMA20" value={filters.ema20} onChange={v => setSelect("ema20", v)} options={[
                { label: "Any", value: "any" },
                { label: "Above EMA20", value: "above" },
                { label: "Below EMA20", value: "below" },
              ]} />
              <SelectInput label="Price vs MA50" value={filters.ema50} onChange={v => setSelect("ema50", v)} options={[
                { label: "Any", value: "any" },
                { label: "Above MA50", value: "above" },
                { label: "Below MA50", value: "below" },
              ]} />
              <SelectInput label="Price vs MA200" value={filters.ema200} onChange={v => setSelect("ema200", v)} options={[
                { label: "Any", value: "any" },
                { label: "Above MA200", value: "above" },
                { label: "Below MA200", value: "below" },
              ]} />
              <ToggleInput label="Breakout Setup" value={filters.breakout} onChange={v => setFilters(prev => ({ ...prev, breakout: v }))} />
              <ToggleInput label="Near Support (BB)" value={filters.nearSupport} onChange={v => setFilters(prev => ({ ...prev, nearSupport: v }))} />
              <ToggleInput label="Near Resistance (BB)" value={filters.nearResistance} onChange={v => setFilters(prev => ({ ...prev, nearResistance: v }))} />
            </div>
          </FilterGroup>

          <FilterGroup label="Flow" group="flow" expanded={expandedGroups.flow} onToggle={() => toggleGroup("flow")}>
            <div className="space-y-3">
              <ToggleInput label="Volume Spike" value={filters.volumeSpike} onChange={v => setFilters(prev => ({ ...prev, volumeSpike: v }))} />
              <RangeInput label="Foreign Net Buy (Rp)" value={filters.foreignNetBuy} onChange={v => setRange("foreignNetBuy", v)} format="currency" />
            </div>
          </FilterGroup>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setShowFilters(!showFilters)} className="p-1.5 rounded-lg text-text-muted/60 hover:text-text-primary hover:bg-surface-50/50 transition-all">
            <Filter size={14} />
          </button>
          <h2 className="text-sm font-bold text-text-primary">Screener</h2>
          <span className="text-[10px] text-text-muted/60">
            {results.length} of {stocks.length} stocks match
          </span>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-[10px] text-accent-light hover:underline ml-auto">
              Clear all ({activeCount})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-border/30 bg-[#0c0d14]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0c0d14] z-10">
              <tr className="border-b border-border/30">
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted/60 w-8"></th>
                <SortHeader k="code" label="Code" />
                <SortHeader k="price" label="Price" />
                <SortHeader k="changePercent" label="Chg %" />
                <SortHeader k="volume" label="Volume" />
                <SortHeader k="marketCap" label="Mkt Cap" />
                <SortHeader k="per" label="PER" />
                <SortHeader k="pbv" label="PBV" />
                <SortHeader k="roe" label="ROE" />
                <SortHeader k="rsi" label="RSI" />
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">MACD</th>
                <SortHeader k="netForeign" label="Net Foreign" />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.stock.code} onClick={() => setSelectedStock(r.stock)}
                  className="border-b border-border/10 hover:bg-surface-50/40 transition-colors cursor-pointer group">
                  <td className="px-3 py-2">
                    <button onClick={e => { e.stopPropagation(); toggleWatchlist(r.stock) }}
                      className={`p-0.5 rounded transition-all ${isInWatchlist(r.stock.code) ? "text-yellow-500" : "text-text-muted/30 opacity-0 group-hover:opacity-100"}`}>
                      <Star size={11} fill={isInWatchlist(r.stock.code) ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-text-primary">{r.stock.code}</span>
                      {r.stock.isSyariah && <span className="text-[8px] px-1 py-0.5 rounded bg-green/10 text-green">S</span>}
                    </div>
                    <div className="text-[9px] text-text-muted/50 truncate max-w-[100px]">{r.stock.sector}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-text-primary font-mono">Rp {r.stock.price.toLocaleString("id-ID")}</td>
                  <td className={`px-3 py-2 text-xs font-mono ${r.stock.changePercent >= 0 ? "text-green" : "text-red"}`}>
                    {formatPercent(r.stock.changePercent)}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-text-muted font-mono">{formatCurrency(r.stock.volume)}</td>
                  <td className="px-3 py-2 text-[11px] text-text-muted font-mono">{formatCurrency(r.stock.marketCap)}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.fund ? <span className={r.fund.per < 15 ? "text-green" : r.fund.per > 25 ? "text-red" : "text-text-muted"}>{r.fund.per.toFixed(1)}</span> : <span className="text-text-muted/30">—</span>}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.fund ? <span className={r.fund.pbv < 2 ? "text-green" : "text-text-muted"}>{r.fund.pbv.toFixed(1)}</span> : <span className="text-text-muted/30">—</span>}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.fund ? <span className={r.fund.roe > 15 ? "text-green" : "text-text-muted"}>{r.fund.roe.toFixed(1)}%</span> : <span className="text-text-muted/30">—</span>}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.tech ? <span className={r.tech.rsi > 70 ? "text-red" : r.tech.rsi > 50 ? "text-green" : "text-text-muted"}>{r.tech.rsi.toFixed(1)}</span> : <span className="text-text-muted/30">—</span>}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.tech ? <span className={r.tech.macd.histogram > 0 ? "text-green" : "text-red"}>{r.tech.macd.histogram > 0 ? "+" : ""}{r.tech.macd.histogram.toFixed(1)}</span> : <span className="text-text-muted/30">—</span>}</td>
                  <td className="px-3 py-2 text-[11px] font-mono">{r.flow ? <span className={r.flow.netForeign > 0 ? "text-green" : "text-red"}>{r.flow.netForeign > 0 ? "+" : ""}{formatCurrency(r.flow.netForeign)}</span> : <span className="text-text-muted/30">—</span>}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center">
                    <p className="text-sm text-text-muted/50">No stocks match your filters</p>
                    <p className="text-[11px] text-text-muted/30 mt-1">Try adjusting the criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, group, expanded, onToggle, children }: { label: string; group: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/20 last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-50/30 transition-all">
        {label}
        {expanded ? <ChevronUp size={13} className="text-text-muted/50" /> : <ChevronDown size={13} className="text-text-muted/50" />}
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

function RangeInput({ label, value, onChange, presets, format }: {
  label: string; value: RangeFilter; onChange: (v: RangeFilter) => void; presets?: { label: string; value: RangeFilter }[]; format?: "currency"
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase()
  return (
    <div>
      <label className="text-[10px] text-text-muted/60 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-1.5 mt-1">
        <input
          placeholder="Min"
          value={value.min !== undefined ? format === "currency" ? fmtShort(value.min) : value.min : ""}
          onChange={e => {
            const v = e.target.value ? parseFloat(e.target.value.replace(/[^0-9.-]/g, "")) : undefined
            onChange({ ...value, min: v })
          }}
          className="w-full h-7 bg-[#0a0b10] border border-border/30 rounded px-2 text-[10px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all font-mono"
        />
        <span className="text-[9px] text-text-muted/40">—</span>
        <input
          placeholder="Max"
          value={value.max !== undefined ? format === "currency" ? fmtShort(value.max) : value.max : ""}
          onChange={e => {
            const v = e.target.value ? parseFloat(e.target.value.replace(/[^0-9.-]/g, "")) : undefined
            onChange({ ...value, max: v })
          }}
          className="w-full h-7 bg-[#0a0b10] border border-border/30 rounded px-2 text-[10px] text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all font-mono"
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {presets.map((p, i) => (
            <button key={i} onClick={() => onChange(p.value)}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                value.min === p.value.min && value.max === p.value.max
                  ? "bg-accent/15 border-accent/30 text-accent-light"
                  : "border-border/20 text-text-muted/50 hover:border-border/50"
              }`}
            >{p.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[]
}) {
  return (
    <div>
      <label className="text-[10px] text-text-muted/60 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
              value === o.value
                ? "bg-accent/15 border-accent/30 text-accent-light"
                : "border-border/30 text-text-muted/60 hover:border-border/60"
            }`}
          >{o.label}</button>
        ))}
      </div>
    </div>
  )
}

function ToggleInput({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] text-text-muted/60 uppercase tracking-wider">{label}</label>
      <button onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full transition-all relative ${value ? "bg-accent/50" : "bg-border/30"}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
      </button>
    </div>
  )
}

function fmtShort(val: number): string {
  if (val >= 1e15) return `${(val / 1e15).toFixed(1)}Q`
  if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`
  if (val >= 1e9) return `${(val / 1e9).toFixed(0)}B`
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`
  return val.toString()
}
