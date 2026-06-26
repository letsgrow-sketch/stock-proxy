import { NextRequest, NextResponse } from "next/server"
import { fetchHistorical } from "@/lib/yahoo-finance"
import { computeIndicators } from "@/lib/technical-helper"
import { STOCK_SYMBOLS } from "@/lib/constants"

export const revalidate = 30

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
  if (!code || !STOCK_SYMBOLS.includes(code)) {
    return NextResponse.json({ error: "Invalid stock code" }, { status: 400 })
  }

  const range = req.nextUrl.searchParams.get("range") || "1y"

  try {
    const hist = await fetchHistorical(code, range)
    if (!hist || hist.close.length < 30) {
      return NextResponse.json({ error: "Insufficient historical data" }, { status: 503 })
    }

    const indicators = computeIndicators(hist.close)

    return NextResponse.json({
      prices: {
        open: hist.open,
        high: hist.high,
        low: hist.low,
        close: hist.close,
        volume: hist.volume,
        dates: hist.dates,
      },
      indicators: indicators ?? {
        rsi: 50,
        macd: { value: 0, signal: 0, histogram: 0 },
        ma50: hist.close[hist.close.length - 1],
        ma200: hist.close[hist.close.length - 1],
        ema20: hist.close[hist.close.length - 1],
        ema50: hist.close[hist.close.length - 1],
        ema200: hist.close[hist.close.length - 1],
        bb: {
          upper: hist.close[hist.close.length - 1] * 1.05,
          middle: hist.close[hist.close.length - 1],
          lower: hist.close[hist.close.length - 1] * 0.95,
        },
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("/api/history error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
