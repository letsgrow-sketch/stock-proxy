import { NextRequest, NextResponse } from "next/server"
import { fetchHistorical } from "@/lib/yahoo-finance"
import { calcRSI, calcMACD, calcBB, calcStochastic, calcSMA, calcEMA, getRecommendation } from "@/lib/technical"
import { STOCK_SYMBOLS } from "@/lib/constants"

export const revalidate = 120

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
  if (!code || !STOCK_SYMBOLS.includes(code)) {
    return NextResponse.json({ error: "Invalid stock code" }, { status: 400 })
  }

  try {
    const hist = await fetchHistorical(code)
    if (!hist || hist.close.length < 50) {
      return NextResponse.json({ error: "Insufficient historical data" }, { status: 503 })
    }

    const close = hist.close
    const len = close.length
    const rsiArr = calcRSI(close, 14)
    const { macd, signal, histogram } = calcMACD(close)
    const ma50 = calcSMA(close, 50)
    const ma200 = calcSMA(close, 200)
    const ema20 = calcEMA(close, 20)
    const bb = calcBB(close, 20)
    const stoch = calcStochastic(close, 14)

    const i = len - 1

    return NextResponse.json({
      rsi: Math.round(rsiArr[i] * 10) / 10 || 50,
      macd: {
        value: Math.round(macd[i] * 10) / 10 || 0,
        signal: Math.round(signal[i] * 10) / 10 || 0,
        histogram: Math.round(histogram[i] * 10) / 10 || 0,
      },
      ma50: Math.round(ma50[i]) || close[i],
      ma200: Math.round(ma200[i]) || close[i],
      ema20: Math.round(ema20[i]) || close[i],
      bb: {
        upper: Math.round(bb.upper[i]) || close[i] * 1.05,
        middle: Math.round(bb.middle[i]) || close[i],
        lower: Math.round(bb.lower[i]) || close[i] * 0.95,
      },
      stochastic: {
        k: Math.round(stoch.k[i] * 10) / 10 || 50,
        d: Math.round(stoch.d[i] * 10) / 10 || 50,
      },
      recommendation: getRecommendation(rsiArr[i] || 50, histogram[i] || 0),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch technical data" }, { status: 500 })
  }
}
