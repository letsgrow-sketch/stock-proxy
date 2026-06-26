import { Stock, SectorData, FundamentalData, TechnicalData, FlowData, WatchlistItem, IHSGData, MarketOverviewData, FeatureCardItem } from "@/types"
import { STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS } from "@/lib/constants"

export let stocks: Stock[] = []
export let sectors: SectorData[] = []
export let technicalData: Record<string, TechnicalData> = {}
export let fundamentalData: Record<string, FundamentalData> = {}
export let flowData: Record<string, FlowData> = {}
export let ihsgData: IHSGData = { value: 7000, change: 0, changePercent: 0 }
export let usdIdrData = { value: 16245, change: 0, changePercent: 0 }

export let lastUpdated: Date | null = null
export let apiStatus: "ok" | "fallback" | "error" = "error"

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

export function computeMarketOverview(stocks: Stock[], sectors: SectorData[], usdIdr: { value: number; change: number; changePercent: number }): MarketOverviewData {
  let topInflow = { sector: "Financials", netBuy: 0, topStocks: ["BBCA", "BBRI", "BMRI"] }
  let topOutflow = { sector: "Technology", netSell: 0, topStocks: ["GOTO", "MTDL"] }

  if (sectors.length > 0) {
    const sorted = [...sectors].sort((a, b) => b.change - a.change)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    topInflow = {
      sector: best.name,
      netBuy: stocks
        .filter(s => s.sector === best.name && s.changePercent > 0)
        .reduce((sum, s) => sum + s.price * s.volume, 0),
      topStocks: stocks.filter(s => s.sector === best.name).sort((a, b) => b.changePercent - a.changePercent).slice(0, 3).map(s => s.code),
    }
    topOutflow = {
      sector: worst.name,
      netSell: stocks
        .filter(s => s.sector === worst.name && s.changePercent < 0)
        .reduce((sum, s) => sum + s.price * s.volume, 0),
      topStocks: stocks.filter(s => s.sector === worst.name).sort((a, b) => a.changePercent - b.changePercent).slice(0, 3).map(s => s.code),
    }
  }

  return {
    usdIdr,
    topInflow,
    topOutflow,
    topConglomerate: { name: "Djarum Group", score: 87, companies: ["BBCA", "BMRI", "GOTO"] },
  }
}

export function computeIHSG(ihsgQuote: { value: number; change: number; changePercent: number } | null, s: Stock[]): IHSGData {
  if (ihsgQuote) return ihsgQuote
  if (s.length === 0) return { value: 7000, change: 0, changePercent: 0 }
  const avgChange = s.reduce((sum, st) => sum + st.changePercent, 0) / s.length
  return {
    value: Math.round(7000 + avgChange * 10),
    change: Math.round(avgChange * 5),
    changePercent: Math.round(avgChange * 100) / 100,
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
  ihsg: { value: number; change: number; changePercent: number } | null
  usdIdr: { value: number; change: number; changePercent: number } | null
  lastUpdated: Date | null
  apiStatus: "ok" | "fallback" | "error"
}

export async function fetchAllMarketData(): Promise<MarketDataResult> {
  const codes = Object.keys(STOCK_NAMES)

  const result: MarketDataResult = {
    stocks: stocks.length > 0 ? [...stocks] : [],
    sectors: sectors.length > 0 ? [...sectors] : [],
    technicalData: { ...technicalData },
    fundamentalData: { ...fundamentalData },
    flowData: { ...flowData },
    ihsg: ihsgData,
    usdIdr: usdIdrData,
    lastUpdated: new Date(),
    apiStatus: apiStatus,
  }

  const [stocksRes, techRes] = await Promise.allSettled([
    (async () => {
      const r = await fetch("/api/stocks", { signal: AbortSignal.timeout(15000) })
      if (r.ok) return r.json() as Promise<{ stocks: any[]; sectors: any[]; fundamentals: Record<string, any>; flow: Record<string, any>; totalNetForeign: number; ihsg: any; usdIdr: any }>
      throw new Error("stocks API returned " + r.status)
    })(),
    (async () => {
      const r = await fetch(`/api/technicals?codes=${codes.join(",")}`, { signal: AbortSignal.timeout(15000) })
      if (r.ok) return r.json() as Promise<Record<string, any>>
      throw new Error("technicals API returned " + r.status)
    })(),
  ])

  if (stocksRes.status === "fulfilled") {
    const { stocks: sData, sectors: secData, fundamentals: fundData, flow: flowData, ihsg: ihsgFromApi, usdIdr: usdIdrFromApi } = stocksRes.value
    if (sData?.length) {
      result.stocks = sData
      result.sectors = secData || []
      if (fundData) {
        for (const [code, f] of Object.entries(fundData) as [string, any][]) {
          result.fundamentalData[code] = f
        }
      }
      if (flowData) result.flowData = flowData
      if (ihsgFromApi) result.ihsg = ihsgFromApi
      if (usdIdrFromApi) result.usdIdr = usdIdrFromApi
      result.apiStatus = "ok"
    }
  } else {
    console.error("fetch stocks failed:", stocksRes.reason)
    result.apiStatus = stocks.length > 0 ? "fallback" : "error"
  }

  if (techRes.status === "fulfilled") {
    const techData = techRes.value
    for (const [code, data] of Object.entries(techData)) {
      result.technicalData[code] = data as TechnicalData
    }
  } else {
    console.error("fetch technicals failed:", techRes.reason)
  }

  stocks = result.stocks
  sectors = result.sectors
  technicalData = result.technicalData
  fundamentalData = result.fundamentalData
  flowData = result.flowData
  if (result.ihsg) ihsgData = result.ihsg
  if (result.usdIdr) usdIdrData = result.usdIdr
  lastUpdated = result.lastUpdated
  apiStatus = result.apiStatus

  return result
}

export const defaultWatchlist: WatchlistItem[] = []

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
