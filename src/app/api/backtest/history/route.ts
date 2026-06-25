import { NextResponse } from "next/server"
import { fetchHistoricalBars } from "@/lib/yahoo-finance"
import { STOCK_NAMES } from "@/lib/constants"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")?.toUpperCase()
  const range = searchParams.get("range") || "2y"

  if (!code) return NextResponse.json({ error: "Stock code required" }, { status: 400 })

  const bars = await fetchHistoricalBars(code, range)
  if (bars.length === 0) return NextResponse.json({ error: "No historical data available" }, { status: 404 })

  return NextResponse.json({
    stockCode: code,
    stockName: STOCK_NAMES[code] || code,
    bars,
  })
}
