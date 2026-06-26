import { Stock, SectorData, FundamentalData, TechnicalData, FlowData } from "@/types"
import { STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS } from "@/lib/constants"
import {
  YFQuote,
  YFFundamental,
  YFHistorical,
  YFBar,
  fetchAggregatedQuotes,
  fetchAggregatedFundamentals,
  fetchHistorical,
  fetchHistoricalBars,
} from "@/lib/yahoo-finance"
import { computeIndicators } from "@/lib/technical-helper"

export class YahooFinanceService {
  private static instance: YahooFinanceService

  static getInstance(): YahooFinanceService {
    if (!YahooFinanceService.instance) {
      YahooFinanceService.instance = new YahooFinanceService()
    }
    return YahooFinanceService.instance
  }

  async getQuotes(symbols: string[]): Promise<Map<string, YFQuote>> {
    return fetchAggregatedQuotes(symbols)
  }

  async getFundamentals(symbols: string[]): Promise<Map<string, YFFundamental>> {
    return fetchAggregatedFundamentals(symbols)
  }

  async getHistorical(symbol: string, range = "1y"): Promise<YFHistorical | null> {
    return fetchHistorical(symbol, range)
  }

  async getHistoricalBars(symbol: string, range = "2y"): Promise<YFBar[]> {
    return fetchHistoricalBars(symbol, range)
  }

  async getStocks(symbols: string[]): Promise<Stock[]> {
    const [quotes, fundamentals] = await Promise.all([
      fetchAggregatedQuotes(symbols),
      fetchAggregatedFundamentals(symbols),
    ])

    return symbols.map((code) => {
      const q = quotes.get(code)
      const f = fundamentals.get(code)
      const price = q?.price ?? 0
      return {
        code,
        name: q?.name || STOCK_NAMES[code] || code,
        sector: f?.sector || STOCK_SECTORS[code] || "Other",
        price,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        volume: q?.volume ?? 0,
        marketCap: f?.marketCap || q?.marketCap || 0,
        isSyariah: SYARIAH_STOCKS.has(code),
      }
    })
  }

  computeSectors(stocks: Stock[]): SectorData[] {
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

  async getFundamentalsData(symbols: string[]): Promise<Record<string, FundamentalData>> {
    const fundamentals = await fetchAggregatedFundamentals(symbols)
    const result: Record<string, FundamentalData> = {}

    for (const code of symbols) {
      const f = fundamentals.get(code)
      if (f) {
        result[code] = {
          per: f.forwardPE ?? 0,
          pbv: f.priceToBook ?? 0,
          roe: (f.returnOnEquity ?? 0) * 100,
          der: f.debtToEquity ?? 0,
          eps: f.trailingEps ?? 0,
          dividendYield: (f.dividendYield ?? 0) * 100,
          marketCap: f.marketCap ?? 0,
          revenueGrowth: (f.revenueGrowth ?? 0) * 100,
          netProfitGrowth: (f.earningsGrowth ?? 0) * 100,
          beta: f.beta ?? null,
          sector: f.sector ?? null,
          industry: f.industry ?? null,
        }
      }
    }

    return result
  }

  async getTechnicals(code: string): Promise<TechnicalData | null> {
    const hist = await fetchHistorical(code)
    if (!hist || hist.close.length < 20) return null

    const indicators = computeIndicators(hist.close)
    if (!indicators) return null

    return indicators
  }

  estimateFlow(code: string, volume: number, changePercent: number, price: number): FlowData {
    function seed(s: number) {
      let x = Math.sin(s) * 43758.5453123
      return x - Math.floor(x)
    }

    const h = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const r1 = seed(h + 1), r2 = seed(h + 2), r3 = seed(h + 3)

    const foreignParticipation = 0.15 + r1 * 0.35
    const baseValue = volume * price * foreignParticipation
    const buyBias = changePercent > 0 ? 0.5 + r2 * 0.3 : 0.2 + r2 * 0.2
    const noise = (r3 - 0.5) * 0.15

    const foreignBuy = Math.round(baseValue * Math.min(buyBias + noise, 0.95))
    const foreignSell = Math.round(baseValue * Math.min(1 - buyBias + noise, 0.95))
    const netForeign = foreignBuy - foreignSell
    const frequency = Math.round(volume * (0.0003 + r1 * 0.0007))

    return {
      foreignBuy,
      foreignSell,
      netForeign,
      volume,
      frequency,
      date: new Date().toISOString().slice(0, 10),
    }
  }
}
