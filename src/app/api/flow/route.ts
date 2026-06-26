import { NextRequest, NextResponse } from "next/server"
import { fetchAggregatedQuotes } from "@/lib/yahoo-finance"
import { STOCK_SYMBOLS } from "@/lib/constants"

export const revalidate = 60

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

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
  const symbols = code ? [code] : STOCK_SYMBOLS

  try {
    const quotes = await fetchAggregatedQuotes(symbols)
    const date = new Date().toISOString().slice(0, 10)
    const flowData: Record<string, object> = {}

    for (const sym of symbols) {
      const q = quotes.get(sym)
      if (!q) continue
      const flow = estimateFlow(sym, q.volume || 0, q.changePercent || 0, q.price || 0)
      flowData[sym] = { ...flow, date }
    }

    const total = Object.values(flowData).reduce(
      (sum: number, f: any) => sum + (f.netForeign || 0), 0
    )

    return NextResponse.json({ data: flowData, totalNetForeign: total })
  } catch (error) {
    console.error("/api/flow error:", error instanceof Error ? error.message : error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
