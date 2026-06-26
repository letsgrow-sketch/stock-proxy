import { NextRequest, NextResponse } from "next/server"
import { fetchHistorical } from "@/lib/yahoo-finance"
import { computeIndicators } from "@/lib/technical-helper"
import { STOCK_SYMBOLS } from "@/lib/constants"

export const revalidate = 120

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
  const codesParam = req.nextUrl.searchParams.get("codes")?.toUpperCase()

  if (!code && !codesParam) {
    return NextResponse.json({ error: "Provide 'code' or 'codes' param" }, { status: 400 })
  }

  if (codesParam) {
    const codes = codesParam.split(",").filter(c => STOCK_SYMBOLS.includes(c))
    if (codes.length === 0) {
      return NextResponse.json({ error: "No valid stock codes" }, { status: 400 })
    }
    const results: Record<string, any> = {}
    const entries = await Promise.allSettled(
      codes.map(async (c) => {
        const hist = await fetchHistorical(c)
        if (!hist || hist.close.length < 50) return { code: c, error: "Insufficient data" }
        const indicators = computeIndicators(hist.close)
        if (!indicators) return { code: c, error: "Cannot compute indicators" }
        return { code: c, data: indicators }
      })
    )
    for (const e of entries) {
      if (e.status === "fulfilled" && e.value.data) {
        results[e.value.code] = e.value.data
      }
    }
    return NextResponse.json(results)
  }

  if (!code || !STOCK_SYMBOLS.includes(code)) {
    return NextResponse.json({ error: "Invalid stock code" }, { status: 400 })
  }

  try {
    const hist = await fetchHistorical(code)
    if (!hist || hist.close.length < 50) {
      return NextResponse.json({ error: "Insufficient historical data" }, { status: 503 })
    }

    const indicators = computeIndicators(hist.close)
    if (!indicators) {
      return NextResponse.json({ error: "Insufficient data for indicators" }, { status: 503 })
    }

    return NextResponse.json(indicators)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("/api/technicals error:", msg)
    return NextResponse.json({ error: msg || "Failed to fetch technical data" }, { status: 500 })
  }
}
