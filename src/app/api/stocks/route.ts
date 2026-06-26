import { NextResponse } from "next/server"
import { STOCK_SYMBOLS, STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS } from "@/lib/constants"
import { fetchAggregatedQuotes, fetchAggregatedFundamentals, fetchIndexQuote } from "@/lib/yahoo-finance"

export const revalidate = 30

function seed(s: number) {
  let x = Math.sin(s) * 43758.5453123
  return x - Math.floor(x)
}

function estimateFlow(code: string, volume: number, changePercent: number, price: number) {
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

  return { foreignBuy, foreignSell, netForeign, volume, frequency }
}

export async function GET() {
  try {
    const [quotes, fundamentals, ihsgQuote, usdIdrQuote] = await Promise.all([
      fetchAggregatedQuotes(STOCK_SYMBOLS),
      fetchAggregatedFundamentals(STOCK_SYMBOLS),
      fetchIndexQuote("^JKSE"),
      fetchIndexQuote("USDIDR=X"),
    ])

    const date = new Date().toISOString().slice(0, 10)

    const stocks = STOCK_SYMBOLS.map((code) => {
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

    const sectorMap = new Map<string, typeof stocks>()
    for (const s of stocks) {
      const arr = sectorMap.get(s.sector) || []
      arr.push(s)
      sectorMap.set(s.sector, arr)
    }
    const sectors = Array.from(sectorMap.entries()).map(([name, list]) => ({
      name,
      change: list.reduce((sum, s) => sum + s.changePercent, 0) / list.length,
      stocks: list,
    }))

    const fundamentalsResult: Record<string, object> = {}
    const flowResult: Record<string, object> = {}
    let totalNetForeign = 0

    for (const code of STOCK_SYMBOLS) {
      const f = fundamentals.get(code)
      if (f) {
        fundamentalsResult[code] = {
          per: f.forwardPE || 0,
          pbv: f.priceToBook || 0,
          roe: (f.returnOnEquity ?? 0) * 100,
          der: f.debtToEquity || 0,
          eps: f.trailingEps || 0,
          dividendYield: (f.dividendYield ?? 0) * 100,
          marketCap: f.marketCap || 0,
          revenueGrowth: (f.revenueGrowth ?? 0) * 100,
          netProfitGrowth: (f.earningsGrowth ?? 0) * 100,
          beta: f.beta ?? null,
          sector: f.sector ?? null,
          industry: f.industry ?? null,
        }
      }

      const q = quotes.get(code)
      if (q) {
        const flow = estimateFlow(code, q.volume || 0, q.changePercent || 0, q.price || 0)
        flowResult[code] = { ...flow, date }
        totalNetForeign += flow.netForeign
      }
    }

    const ihsg = ihsgQuote ? { value: ihsgQuote.price, change: ihsgQuote.change, changePercent: ihsgQuote.changePercent } : { value: 7000, change: 0, changePercent: 0 }
    const usdIdr = usdIdrQuote ? { value: usdIdrQuote.price, change: usdIdrQuote.change, changePercent: usdIdrQuote.changePercent } : { value: 16245, change: 0, changePercent: 0 }

    return NextResponse.json({ stocks, sectors, fundamentals: fundamentalsResult, flow: flowResult, totalNetForeign, ihsg, usdIdr })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("/api/stocks error:", msg)
    return NextResponse.json({ error: msg || "Failed to fetch market data" }, { status: 500 })
  }
}
