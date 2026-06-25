import { NextResponse } from "next/server"
import { STOCK_SYMBOLS, STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS } from "@/lib/constants"
import { fetchAggregatedQuotes } from "@/lib/yahoo-finance"

export const revalidate = 60

export async function GET() {
  try {
    const quotes = await fetchAggregatedQuotes(STOCK_SYMBOLS)

    const stocks = STOCK_SYMBOLS.map((code) => {
      const q = quotes.get(code)
      const price = q?.price ?? 0
      const prev = price - (q?.change ?? 0)
      return {
        code,
        name: q?.name || STOCK_NAMES[code] || code,
        sector: q?.sector || STOCK_SECTORS[code] || "Other",
        price,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        volume: q?.volume ?? 0,
        marketCap: q?.marketCap ?? 0,
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

    const fundamentals: Record<string, object> = {}
    for (const code of STOCK_SYMBOLS) {
      const q = quotes.get(code)
      if (q?.trailingPE !== undefined || q?.priceToBook !== undefined) {
        fundamentals[code] = {
          per: q.trailingPE ?? 0,
          pbv: q.priceToBook ?? 0,
          roe: (q.returnOnEquity ?? 0) * 100,
          der: q.debtToEquity ?? 0,
          eps: q.trailingEps ?? 0,
          dividendYield: (q.dividendYield ?? 0) * 100,
          marketCap: q.marketCap ?? 0,
        }
      }
    }

    return NextResponse.json({ stocks, sectors, fundamentals })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 })
  }
}
