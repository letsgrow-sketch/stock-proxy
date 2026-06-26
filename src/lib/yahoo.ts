import { Stock } from "@/types"
import { STOCK_SYMBOLS, STOCK_NAMES, STOCK_SECTORS, SYARIAH_STOCKS } from "@/lib/constants"
import { fetchAggregatedQuotes } from "@/lib/yahoo-finance"

export async function fetchYahooStocks(): Promise<Stock[]> {
  const quotes = await fetchAggregatedQuotes(STOCK_SYMBOLS)

  return STOCK_SYMBOLS.map((code) => {
    const q = quotes.get(code)
    const price = q?.price ?? 0
    const changePercent = q?.changePercent ?? 0
    const change = Math.round(price * changePercent / 100)
    const volume = q?.volume ?? 0
    const marketCap = q?.marketCap ?? 0

    return {
      code,
      name: STOCK_NAMES[code] || code,
      sector: STOCK_SECTORS[code] || "Other",
      price,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      marketCap,
      isSyariah: SYARIAH_STOCKS.has(code),
    }
  })
}
