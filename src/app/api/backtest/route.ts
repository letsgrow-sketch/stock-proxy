import { NextResponse } from "next/server"
import { fetchHistoricalBars } from "@/lib/yahoo-finance"
import { runBacktest, tradesToCSV } from "@/lib/backtest"

export async function POST(req: Request) {
  try {
    const { stockCode, range, ...config } = await req.json()

    if (!stockCode) return NextResponse.json({ error: "stockCode required" }, { status: 400 })

    const bars = await fetchHistoricalBars(stockCode.toUpperCase(), range || "2y")
    if (bars.length === 0) {
      return NextResponse.json({ error: "No historical data available" }, { status: 404 })
    }

    const result = runBacktest(bars, { stockCode, ...config })
    const csv = tradesToCSV(result.trades, result.metrics, result.config)

    return NextResponse.json({ ...result, csv })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backtest failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
