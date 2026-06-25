import { Stock, SectorData, FundamentalData, TechnicalData, FlowData, WatchlistItem, IHSGData, MarketOverviewData, FeatureCardItem } from "@/types"
import { STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS, IHSG_DATA, USD_IDR, SECTOR_INFLOW, SECTOR_OUTFLOW, TOP_CONGLO } from "@/lib/constants"

const FALLBACK_PRICES: Record<string, number> = {
  BBCA: 10750, BBRI: 5860, TLKM: 3820, ASII: 5125, BMRI: 7025,
  ADRO: 2850, GOTO: 52, UNVR: 2560, ICBP: 11700, INTP: 7950,
  SMGR: 4150, KLBF: 1620, EXCL: 2280, CPIN: 4800, PGAS: 1230,
  MEDC: 875, BBNI: 5350, JSMR: 4210, MNCN: 386, AKRA: 1445,
  TPIA: 8525, ITMG: 26500, ANTM: 1680, BRPT: 1020, WIKA: 675,
  PTPP: 545, TINS: 950, HRUM: 1180, SIDO: 635, TOWR: 725,
  WOOD: 795, ACES: 845, ERAA: 358, MTDL: 432, ESSA: 625,
  FILM: 1375,
}

function seed(n: number) {
  let x = Math.sin(n) * 43758.5453123
  return x - Math.floor(x)
}

function fallbackStocks(): Stock[] {
  return Object.keys(FALLBACK_PRICES).map((code, i) => {
    const h = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const r = seed(h + 99)
    const basePrice = FALLBACK_PRICES[code]
    const changePercent = (r - 0.5) * 10
    const change = Math.round(basePrice * changePercent / 100)
    return {
      code,
      name: STOCK_NAMES[code] || code,
      sector: STOCK_SECTORS[code] || "Other",
      price: basePrice,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.round((5000000 + r * 50000000) * (i % 3 + 1)),
      marketCap: basePrice * (500000000 + Math.round(r * 1500000000)),
      isSyariah: SYARIAH_STOCKS.has(code),
    }
  })
}

function fallbackSectors(stocks: Stock[]): SectorData[] {
  const map = new Map<string, Stock[]>()
  for (const s of stocks) {
    const arr = map.get(s.sector) || []
    arr.push(s)
    map.set(s.sector, arr)
  }
  return Array.from(map.entries()).map(([name, list]) => ({
    name,
    change: list.reduce((sum, s) => sum + s.changePercent, 0) / list.length,
    stocks: list,
  }))
}

const fallbackTechnicalData: Record<string, TechnicalData> = {
  BBCA: { rsi: 62.4, macd: { value: 85.5, signal: 72.3, histogram: 13.2 }, ma50: 10420, ma200: 9850, ema20: 10680, bb: { upper: 11250, middle: 10500, lower: 9750 }, stochastic: { k: 68.5, d: 62.1 }, recommendation: "Buy" },
  BBRI: { rsi: 42.8, macd: { value: -22.4, signal: -15.8, histogram: -6.6 }, ma50: 5980, ma200: 5750, ema20: 5920, bb: { upper: 6150, middle: 5850, lower: 5550 }, stochastic: { k: 32.5, d: 38.2 }, recommendation: "Hold" },
  TLKM: { rsi: 58.3, macd: { value: 18.6, signal: 12.4, histogram: 6.2 }, ma50: 3700, ma200: 3580, ema20: 3780, bb: { upper: 3920, middle: 3750, lower: 3580 }, stochastic: { k: 72.1, d: 65.4 }, recommendation: "Buy" },
  ASII: { rsi: 35.2, macd: { value: -45.8, signal: -32.5, histogram: -13.3 }, ma50: 5350, ma200: 5420, ema20: 5280, bb: { upper: 5580, middle: 5280, lower: 4980 }, stochastic: { k: 22.8, d: 28.5 }, recommendation: "Sell" },
  BMRI: { rsi: 65.8, macd: { value: 42.3, signal: 35.8, histogram: 6.5 }, ma50: 6800, ma200: 6450, ema20: 6910, bb: { upper: 7350, middle: 6950, lower: 6550 }, stochastic: { k: 78.4, d: 71.2 }, recommendation: "Buy" },
  ADRO: { rsi: 72.5, macd: { value: 35.8, signal: 28.4, histogram: 7.4 }, ma50: 2650, ma200: 2420, ema20: 2780, bb: { upper: 2980, middle: 2780, lower: 2580 }, stochastic: { k: 82.5, d: 76.8 }, recommendation: "Buy" },
  GOTO: { rsi: 22.4, macd: { value: -8.5, signal: -6.2, histogram: -2.3 }, ma50: 68, ma200: 82, ema20: 60, bb: { upper: 72, middle: 58, lower: 44 }, stochastic: { k: 12.8, d: 18.5 }, recommendation: "Sell" },
  UNVR: { rsi: 52.8, macd: { value: 12.5, signal: 8.2, histogram: 4.3 }, ma50: 2480, ma200: 2520, ema20: 2500, bb: { upper: 2700, middle: 2550, lower: 2400 }, stochastic: { k: 55.2, d: 52.8 }, recommendation: "Hold" },
}

const fallbackFundamentalData: Record<string, FundamentalData> = {
  BBCA: { per: 24.5, pbv: 4.2, roe: 18.5, der: 0.85, eps: 438, dividendYield: 2.8, marketCap: 1325000000000000, revenueGrowth: 8.2, netProfitGrowth: 6.5 },
  BBRI: { per: 14.2, pbv: 2.8, roe: 20.1, der: 1.25, eps: 412, dividendYield: 4.2, marketCap: 885000000000000, revenueGrowth: 12.5, netProfitGrowth: 10.8 },
  TLKM: { per: 16.8, pbv: 3.1, roe: 18.2, der: 0.65, eps: 227, dividendYield: 5.1, marketCap: 378000000000000, revenueGrowth: 3.2, netProfitGrowth: 2.1 },
  ASII: { per: 8.5, pbv: 1.2, roe: 14.8, der: 0.52, eps: 603, dividendYield: 5.8, marketCap: 207000000000000, revenueGrowth: -2.5, netProfitGrowth: -5.8 },
  BMRI: { per: 13.8, pbv: 2.5, roe: 19.2, der: 1.15, eps: 509, dividendYield: 3.5, marketCap: 655000000000000, revenueGrowth: 15.2, netProfitGrowth: 12.8 },
  ADRO: { per: 5.2, pbv: 1.1, roe: 22.5, der: 0.35, eps: 548, dividendYield: 8.2, marketCap: 89000000000000, revenueGrowth: 28.5, netProfitGrowth: 35.2 },
  GOTO: { per: -15.2, pbv: 2.8, roe: -18.5, der: 0.45, eps: -3.4, dividendYield: 0, marketCap: 62000000000000, revenueGrowth: 42.5, netProfitGrowth: -8.2 },
  UNVR: { per: 28.5, pbv: 18.2, roe: 62.5, der: 0.12, eps: 90, dividendYield: 3.2, marketCap: 97600000000000, revenueGrowth: -1.8, netProfitGrowth: -3.5 },
}

const fallbackFlowData: Record<string, FlowData> = {
  BBCA: { foreignBuy: 852000000000, foreignSell: 425000000000, netForeign: 427000000000, volume: 85200000, frequency: 48520, date: "2026-06-24" },
  BBRI: { foreignBuy: 385000000000, foreignSell: 512000000000, netForeign: -127000000000, volume: 124500000, frequency: 62300, date: "2026-06-24" },
  TLKM: { foreignBuy: 218000000000, foreignSell: 142000000000, netForeign: 76000000000, volume: 96300000, frequency: 34100, date: "2026-06-24" },
  ASII: { foreignBuy: 98000000000, foreignSell: 165000000000, netForeign: -67000000000, volume: 45100000, frequency: 21500, date: "2026-06-24" },
  BMRI: { foreignBuy: 425000000000, foreignSell: 310000000000, netForeign: 115000000000, volume: 71200000, frequency: 38900, date: "2026-06-24" },
  ADRO: { foreignBuy: 185000000000, foreignSell: 125000000000, netForeign: 60000000000, volume: 123400000, frequency: 45200, date: "2026-06-24" },
  GOTO: { foreignBuy: 52000000000, foreignSell: 185000000000, netForeign: -133000000000, volume: 8450000000, frequency: 125800, date: "2026-06-24" },
}

export let stocks: Stock[] = fallbackStocks()
export let sectors: SectorData[] = fallbackSectors(stocks)
export let technicalData: Record<string, TechnicalData> = { ...fallbackTechnicalData }
export let fundamentalData: Record<string, FundamentalData> = { ...fallbackFundamentalData }
export let flowData: Record<string, FlowData> = { ...fallbackFlowData }

export let lastUpdated: Date | null = null
export let apiStatus: "ok" | "fallback" | "error" = "fallback"

export const marketOverview: MarketOverviewData = {
  usdIdr: USD_IDR,
  topInflow: SECTOR_INFLOW,
  topOutflow: SECTOR_OUTFLOW,
  topConglomerate: TOP_CONGLO,
}

export function computeFeatureCards(s: Stock[], ta: Record<string, TechnicalData>, fa: Record<string, FundamentalData>): {
  momentum: FeatureCardItem[]
  undervalued: FeatureCardItem[]
  buyOnWeakness: FeatureCardItem[]
} {
  const sortedByChange = [...s].sort((a, b) => b.changePercent - a.changePercent)
  const momentum = sortedByChange.slice(0, 10).map(st => ({
    code: st.code, name: st.name, value: st.changePercent, changePercent: st.changePercent,
  }))

  const withPbv = s.map(st => ({ ...st, pbv: fa[st.code]?.pbv ?? 99 })).filter(st => st.pbv > 0).sort((a, b) => a.pbv - b.pbv)
  const undervalued = withPbv.slice(0, 10).map(st => ({
    code: st.code, name: st.name, value: st.pbv, changePercent: st.changePercent,
  }))

  const withRsi = s.map(st => ({ ...st, rsi: ta[st.code]?.rsi ?? 50 }))
    .filter(st => st.rsi < 40 && st.changePercent < 0)
    .sort((a, b) => a.rsi - b.rsi)
  const buyOnWeakness = withRsi.slice(0, 10).map(st => ({
    code: st.code, name: st.name, value: st.rsi, changePercent: st.changePercent,
  }))

  return { momentum, undervalued, buyOnWeakness }
}

export function computeIHSG(s: Stock[]): IHSGData {
  const avgChange = s.reduce((sum, st) => sum + st.changePercent, 0) / s.length
  return {
    value: IHSG_DATA.value + avgChange * 10,
    change: IHSG_DATA.change + avgChange * 5,
    changePercent: IHSG_DATA.changePercent + avgChange * 0.02,
  }
}

export function computeTotalTurnover(s: Stock[]): number {
  return s.reduce((sum, st) => sum + st.price * st.volume, 0)
}

export function watchlistToFeatureCards(wl: WatchlistItem[]): FeatureCardItem[] {
  return wl.map(w => ({
    code: w.stock.code,
    name: w.stock.name,
    value: w.stock.price,
    changePercent: w.stock.changePercent,
  }))
}

export interface MarketDataResult {
  stocks: Stock[]
  sectors: SectorData[]
  technicalData: Record<string, TechnicalData>
  fundamentalData: Record<string, FundamentalData>
  flowData: Record<string, FlowData>
  lastUpdated: Date | null
  apiStatus: "ok" | "fallback" | "error"
}

export async function fetchAllMarketData(): Promise<MarketDataResult> {
  const result: MarketDataResult = {
    stocks: fallbackStocks(),
    sectors: [],
    technicalData: { ...fallbackTechnicalData },
    fundamentalData: { ...fallbackFundamentalData },
    flowData: { ...fallbackFlowData },
    lastUpdated: null,
    apiStatus: "fallback",
  }

  try {
    const stocksRes = await fetch("/api/stocks", { signal: AbortSignal.timeout(15000) })
    if (stocksRes.ok) {
      const { stocks: sData, sectors: secData, fundamentals: fData } = await stocksRes.json()
      if (sData?.length) {
        result.stocks = sData
        result.apiStatus = "ok"
      }
      if (secData?.length) result.sectors = secData
      if (fData) {
        for (const [code, val] of Object.entries(fData)) {
          result.fundamentalData[code] = val as FundamentalData
        }
      }
    }
  } catch {}

  if (!result.sectors.length) result.sectors = fallbackSectors(result.stocks)

  try {
    const codes = Object.keys(STOCK_NAMES)
    const results = await Promise.allSettled(
      codes.map(code =>
        fetch(`/api/technicals?code=${code}`, { signal: AbortSignal.timeout(8000) })
          .then(r => r.ok ? r.json() : null)
          .then(d => d && !d.error ? { code, data: d as TechnicalData } : null)
      )
    )
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        result.technicalData[r.value.code] = r.value.data
      }
    }
  } catch {}

  try {
    const flowRes = await fetch("/api/flow", { signal: AbortSignal.timeout(10000) })
    if (flowRes.ok) {
      const { data: fData } = await flowRes.json()
      if (fData) result.flowData = { ...result.flowData, ...fData }
    }
  } catch {}

  result.lastUpdated = new Date()

  stocks = result.stocks
  sectors = result.sectors
  technicalData = result.technicalData
  fundamentalData = result.fundamentalData
  flowData = result.flowData
  lastUpdated = result.lastUpdated
  apiStatus = result.apiStatus

  return result
}

export const defaultWatchlist: WatchlistItem[] = [
  { id: "1", stock: fallbackStocks()[0], addedAt: "2026-06-20T08:30:00Z" },
  { id: "2", stock: fallbackStocks()[1], addedAt: "2026-06-20T08:30:00Z" },
  { id: "3", stock: fallbackStocks()[2], addedAt: "2026-06-21T09:15:00Z" },
  { id: "4", stock: fallbackStocks()[4], addedAt: "2026-06-22T07:45:00Z" },
  { id: "5", stock: fallbackStocks()[5], addedAt: "2026-06-22T10:00:00Z" },
]

export const formatCurrency = (val: number): string => {
  if (val >= 1e15) return `${(val / 1e15).toFixed(2)}Q`
  if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`
  return val.toLocaleString("id-ID")
}

export const formatNumber = (val: number): string => val.toLocaleString("id-ID")
export const formatPercent = (val: number): string => `${val >= 0 ? "+" : ""}${val.toFixed(2)}%`
