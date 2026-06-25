import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"
import { STOCK_SECTORS } from "@/lib/constants"

export interface RangeFilter {
  min?: number
  max?: number
}

export interface ScreenerFilters {
  search: string
  sectors: string[]
  syariah: "all" | "syariah" | "non-syariah"
  marketCap: RangeFilter
  per: RangeFilter
  pbv: RangeFilter
  roe: RangeFilter
  der: RangeFilter
  revenueGrowth: RangeFilter
  netProfitGrowth: RangeFilter
  dividendYield: RangeFilter
  volumeSpike: boolean
  breakout: boolean
  foreignNetBuy: RangeFilter
  rsi: RangeFilter
  macd: "any" | "positive" | "negative" | "crossing-up" | "crossing-down"
  ema20: "any" | "above" | "below"
  ema50: "any" | "above" | "below"
  ema200: "any" | "above" | "below"
  nearSupport: boolean
  nearResistance: boolean
}

export const defaultFilters: ScreenerFilters = {
  search: "",
  sectors: [],
  syariah: "all",
  marketCap: {},
  per: {},
  pbv: {},
  roe: {},
  der: {},
  revenueGrowth: {},
  netProfitGrowth: {},
  dividendYield: {},
  volumeSpike: false,
  breakout: false,
  foreignNetBuy: {},
  rsi: {},
  macd: "any",
  ema20: "any",
  ema50: "any",
  ema200: "any",
  nearSupport: false,
  nearResistance: false,
}

export interface FilterMeta {
  key: keyof ScreenerFilters
  label: string
  group: "fundamental" | "technical" | "flow" | "general"
  type: "range" | "select" | "toggle" | "multi-select" | "search" | "radio"
}

export const filterMetaList: FilterMeta[] = [
  { key: "search", label: "Search", group: "general", type: "search" },
  { key: "sectors", label: "Sector", group: "general", type: "multi-select" },
  { key: "syariah", label: "Syariah", group: "general", type: "radio" },
  { key: "marketCap", label: "Market Cap", group: "fundamental", type: "range" },
  { key: "per", label: "PER", group: "fundamental", type: "range" },
  { key: "pbv", label: "PBV", group: "fundamental", type: "range" },
  { key: "roe", label: "ROE (%)", group: "fundamental", type: "range" },
  { key: "der", label: "DER", group: "fundamental", type: "range" },
  { key: "revenueGrowth", label: "Revenue Growth (%)", group: "fundamental", type: "range" },
  { key: "netProfitGrowth", label: "Net Profit Growth (%)", group: "fundamental", type: "range" },
  { key: "dividendYield", label: "Dividend Yield (%)", group: "fundamental", type: "range" },
  { key: "rsi", label: "RSI", group: "technical", type: "range" },
  { key: "macd", label: "MACD", group: "technical", type: "select" },
  { key: "ema20", label: "Price vs EMA20", group: "technical", type: "select" },
  { key: "ema50", label: "Price vs MA50", group: "technical", type: "select" },
  { key: "ema200", label: "Price vs MA200", group: "technical", type: "select" },
  { key: "breakout", label: "Breakout Setup", group: "technical", type: "toggle" },
  { key: "nearSupport", label: "Near Support", group: "technical", type: "toggle" },
  { key: "nearResistance", label: "Near Resistance", group: "technical", type: "toggle" },
  { key: "volumeSpike", label: "Volume Spike", group: "flow", type: "toggle" },
  { key: "foreignNetBuy", label: "Foreign Net Buy", group: "flow", type: "range" },
]

export function matchRange(val: number, range: RangeFilter): boolean {
  if (range.min !== undefined && val < range.min) return false
  if (range.max !== undefined && val > range.max) return false
  return true
}

export interface ScreenerResult {
  stock: Stock
  tech?: TechnicalData
  fund?: FundamentalData
  flow?: FlowData
}

export function applyFilters(
  stocks: Stock[],
  filters: ScreenerFilters,
  technicalData: Record<string, TechnicalData>,
  fundamentalData: Record<string, FundamentalData>,
  flowData: Record<string, FlowData>,
): ScreenerResult[] {
  const allSectors = new Set(Object.values(STOCK_SECTORS))

  return stocks.reduce<ScreenerResult[]>((acc, stock) => {
    const tech = technicalData[stock.code]
    const fund = fundamentalData[stock.code]
    const flow = flowData[stock.code]

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      if (!stock.code.toLowerCase().includes(q) && !stock.name.toLowerCase().includes(q)) return acc
    }

    if (filters.sectors.length > 0 && !filters.sectors.includes(stock.sector)) return acc
    if (filters.syariah === "syariah" && !stock.isSyariah) return acc
    if (filters.syariah === "non-syariah" && stock.isSyariah) return acc

    if (!matchRange(stock.marketCap, filters.marketCap)) return acc

    if (fund) {
      if (!matchRange(fund.per, filters.per)) return acc
      if (!matchRange(fund.pbv, filters.pbv)) return acc
      if (!matchRange(fund.roe, filters.roe)) return acc
      if (!matchRange(fund.der, filters.der)) return acc
      if (!matchRange(fund.revenueGrowth, filters.revenueGrowth)) return acc
      if (!matchRange(fund.netProfitGrowth, filters.netProfitGrowth)) return acc
      if (!matchRange(fund.dividendYield, filters.dividendYield)) return acc
    } else {
      if (hasRangeFilter(filters.per)) return acc
      if (hasRangeFilter(filters.pbv)) return acc
      if (hasRangeFilter(filters.roe)) return acc
      if (hasRangeFilter(filters.der)) return acc
      if (hasRangeFilter(filters.revenueGrowth)) return acc
      if (hasRangeFilter(filters.netProfitGrowth)) return acc
      if (hasRangeFilter(filters.dividendYield)) return acc
    }

    if (tech) {
      if (!matchRange(tech.rsi, filters.rsi)) return acc

      if (filters.macd !== "any") {
        const h = tech.macd.histogram
        if (filters.macd === "positive" && h <= 0) return acc
        if (filters.macd === "negative" && h >= 0) return acc
      }

      if (filters.ema20 === "above" && stock.price <= tech.ema20) return acc
      if (filters.ema20 === "below" && stock.price >= tech.ema20) return acc
      if (filters.ema50 === "above" && stock.price <= tech.ma50) return acc
      if (filters.ema50 === "below" && stock.price >= tech.ma50) return acc
      if (filters.ema200 === "above" && stock.price <= tech.ma200) return acc
      if (filters.ema200 === "below" && stock.price >= tech.ma200) return acc

      if (filters.breakout) {
        const isAboveMA = stock.price > tech.ma50 && stock.price > tech.ma200
        const rsiOk = tech.rsi > 50 && tech.rsi < 75
        const macdOk = tech.macd.histogram > 0
        const bbPos = (stock.price - tech.bb.lower) / (tech.bb.upper - tech.bb.lower)
        const nearUpperBB = bbPos > 0.7
        if (!(isAboveMA && rsiOk && macdOk && nearUpperBB)) return acc
      }

      if (filters.nearSupport) {
        const dist = ((stock.price - tech.bb.lower) / tech.bb.lower) * 100
        if (dist > 3) return acc
      }

      if (filters.nearResistance) {
        const dist = ((tech.bb.upper - stock.price) / stock.price) * 100
        if (dist > 3) return acc
      }
    } else {
      if (hasRangeFilter(filters.rsi)) return acc
      if (filters.macd !== "any") return acc
      if (filters.ema20 !== "any") return acc
      if (filters.ema50 !== "any") return acc
      if (filters.ema200 !== "any") return acc
      if (filters.breakout) return acc
      if (filters.nearSupport) return acc
      if (filters.nearResistance) return acc
    }

    if (filters.volumeSpike) {
      const avgVol = stocks.reduce((s, st) => s + st.volume, 0) / Math.max(stocks.length, 1)
      if (stock.volume < avgVol * 1.5) return acc
    }

    if (flow) {
      if (!matchRange(flow.netForeign, filters.foreignNetBuy)) return acc
    } else {
      if (hasRangeFilter(filters.foreignNetBuy)) return acc
    }

    acc.push({ stock, tech, fund, flow })
    return acc
  }, [])
}

function hasRangeFilter(r: RangeFilter): boolean {
  return r.min !== undefined || r.max !== undefined
}

export const RSI_PRESETS = [
  { label: "Oversold (< 30)", value: { min: 0, max: 30 } },
  { label: "Weak (< 40)", value: { min: 0, max: 40 } },
  { label: "Bullish (50-70)", value: { min: 50, max: 70 } },
  { label: "Overbought (> 70)", value: { min: 70, max: 100 } },
]

export const PER_PRESETS = [
  { label: "Deep Value (< 10)", value: { min: 0, max: 10 } },
  { label: "Undervalued (< 15)", value: { min: 0, max: 15 } },
  { label: "Fair (10-20)", value: { min: 10, max: 20 } },
  { label: "Premium (> 25)", value: { min: 25, max: 999 } },
]

export const PBV_PRESETS = [
  { label: "Below 1x", value: { min: 0, max: 1 } },
  { label: "Below 2x", value: { min: 0, max: 2 } },
  { label: "Below 3x", value: { min: 0, max: 3 } },
]

export const MKT_CAP_PRESETS = [
  { label: "Large Cap (> 100T)", value: { min: 100e12 } },
  { label: "Mid Cap (10T-100T)", value: { min: 10e12, max: 100e12 } },
  { label: "Small Cap (< 10T)", value: { max: 10e12 } },
]

export const DIVIDEND_PRESETS = [
  { label: "High Yield (> 5%)", value: { min: 5 } },
  { label: "Moderate (2-5%)", value: { min: 2, max: 5 } },
  { label: "Any Yield (> 0%)", value: { min: 0.01 } },
]
