import { NextRequest, NextResponse } from "next/server"
import { fetchAggregatedFundamentals } from "@/lib/yahoo-finance"
import { STOCK_SYMBOLS } from "@/lib/constants"

export const revalidate = 30

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.toUpperCase()
  const symbols = code ? [code] : STOCK_SYMBOLS

  try {
    const fundamentals = await fetchAggregatedFundamentals(symbols)
    const result: Record<string, object> = {}

    for (const sym of symbols) {
      const f = fundamentals.get(sym)
      if (f) result[sym] = f
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("/api/fundamentals error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
