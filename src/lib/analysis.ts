import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"

export interface StockRecommendation {
  stock: Stock
  action: "Buy" | "Hold" | "Watchlist" | "Sell"
  confidence: number
  reasons: string[]
  signals: {
    technical: "bullish" | "bearish" | "neutral"
    fundamental: "bullish" | "bearish" | "neutral"
    flow: "accumulation" | "distribution" | "neutral"
  }
}

function fmtShort(val: number): string {
  if (val >= 1e12) return `Rp${(val / 1e12).toFixed(1)}T`
  if (val >= 1e9) return `Rp${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `Rp${(val / 1e6).toFixed(0)}M`
  return `Rp${val.toLocaleString("id-ID")}`
}

export function findUndervalued(
  stocks: Stock[],
  fundamentals: Record<string, FundamentalData>
): { stock: Stock; reason: string; score: number }[] {
  const results: { stock: Stock; reason: string; score: number }[] = []
  for (const stock of stocks) {
    const fund = fundamentals[stock.code]
    if (!fund || fund.per <= 0) continue
    let score = 0; const parts: string[] = []
    if (fund.per < 10) { score += 3; parts.push(`PE ${fund.per}x (deep value)`) }
    else if (fund.per < 15) { score += 2; parts.push(`PE ${fund.per}x (undervalued)`) }
    else if (fund.per < 20) { score += 1; parts.push(`PE ${fund.per}x (fair)`) }
    if (fund.pbv < 1.5) { score += 2; parts.push(`PBV ${fund.pbv}x`) }
    else if (fund.pbv < 3) { score += 1 }
    if (fund.roe > 20) { score += 2; parts.push(`ROE ${fund.roe.toFixed(1)}%`) }
    else if (fund.roe > 15) { score += 1 }
    if (fund.der < 0.5) { score += 1; parts.push(`DER ${fund.der}`) }
    if (fund.dividendYield > 5) { score += 1; parts.push(`Yield ${fund.dividendYield.toFixed(1)}%`) }
    if (score > 2) results.push({ stock, reason: parts.join(" • "), score })
  }
  return results.sort((a, b) => b.score - a.score)
}

export function findBreakoutSetups(
  stocks: Stock[],
  technicals: Record<string, TechnicalData>
): { stock: Stock; reason: string; score: number }[] {
  const results: { stock: Stock; reason: string; score: number }[] = []
  for (const stock of stocks) {
    const tech = technicals[stock.code]
    if (!tech) continue
    let score = 0; const parts: string[] = []
    if (stock.price > tech.ma50) { score += 2; parts.push("Above MA50") }
    if (stock.price > tech.ma200) { score += 2; parts.push("Above MA200") }
    if (tech.rsi > 50 && tech.rsi < 70) { score += 2; parts.push(`RSI ${tech.rsi.toFixed(1)}`) }
    else if (tech.rsi > 70) { score += 0; parts.push(`RSI ${tech.rsi.toFixed(1)} (overbought)`) }
    if (tech.macd.histogram > 0) { score += 1; parts.push("MACD+") }
    const bbPos = (stock.price - tech.bb.lower) / (tech.bb.upper - tech.bb.lower)
    if (bbPos > 0.8) score += 1
    if (score >= 3) results.push({ stock, reason: parts.join(" • "), score })
  }
  return results.sort((a, b) => b.score - a.score)
}

export function findUnusualVolume(
  stocks: Stock[],
  technicals: Record<string, TechnicalData>
): { stock: Stock; reason: string; score: number }[] {
  const avgVol = stocks.reduce((s, st) => s + st.volume, 0) / Math.max(stocks.length, 1)
  return stocks
    .filter(s => s.volume > avgVol * 1.8)
    .map(s => ({
      stock: s,
      reason: `${(s.volume / avgVol).toFixed(1)}x avg vol (${fmtShort(s.volume)})`,
      score: Math.min(Math.round((s.volume / avgVol) * 10), 10),
    }))
    .sort((a, b) => b.score - a.score)
}

export function findForeignAccumulation(
  stocks: Stock[],
  flow: Record<string, FlowData>
): { stock: Stock; reason: string; score: number }[] {
  const results: { stock: Stock; reason: string; score: number }[] = []
  for (const stock of stocks) {
    const f = flow[stock.code]
    if (!f || f.netForeign <= 0) continue
    let score = 0; const parts: string[] = []
    if (f.netForeign > 1e12) { score += 3; parts.push(`Net buy ${fmtShort(f.netForeign)}`) }
    else if (f.netForeign > 1e11) { score += 2; parts.push(`Net buy ${fmtShort(f.netForeign)}`) }
    else { score += 1; parts.push(`Net buy ${fmtShort(f.netForeign)}`) }
    if (f.foreignBuy > f.foreignSell * 1.5) { score += 1; parts.push("Strong buy ratio") }
    if (stock.changePercent > 0 && f.netForeign > 0) { score += 1; parts.push("Price up") }
    results.push({ stock, reason: parts.join(" • "), score })
  }
  return results.sort((a, b) => b.score - a.score)
}

export function recommendStock(
  stock: Stock,
  tech?: TechnicalData,
  fund?: FundamentalData,
  flow?: FlowData
): StockRecommendation {
  let score = 0; const reasons: string[] = []
  const signals: { technical: "bullish" | "neutral" | "bearish"; fundamental: "bullish" | "neutral" | "bearish"; flow: "accumulation" | "neutral" | "distribution" } = { technical: "neutral", fundamental: "neutral", flow: "neutral" }

  if (tech) {
    if (tech.rsi > 50 && tech.rsi < 70) {
      score += 2; signals.technical = "bullish"
      reasons.push(`RSI ${tech.rsi.toFixed(1)} — bullish momentum`)
    } else if (tech.rsi > 70) {
      score -= 1; signals.technical = "bearish"
      reasons.push(`RSI ${tech.rsi.toFixed(1)} — overbought, caution`)
    } else if (tech.rsi < 40) {
      score -= 1; signals.technical = "bearish"
      reasons.push(`RSI ${tech.rsi.toFixed(1)} — weak momentum`)
    }
    if (stock.price > tech.ma50) score += 1
    if (stock.price > tech.ma200) score += 1
    if (tech.macd.histogram > 0) { score += 1; reasons.push("MACD positive") }
    else { score -= 1; reasons.push("MACD negative") }
    if (tech.recommendation === "Buy") score += 2
    else if (tech.recommendation === "Sell") score -= 2
  }

  if (fund && fund.per > 0) {
    if (fund.per < 12) { score += 2; signals.fundamental = "bullish"; reasons.push(`PE ${fund.per}x — undervalued`) }
    else if (fund.per < 20) { score += 1; reasons.push(`PE ${fund.per}x — fair`) }
    else { score -= 1; signals.fundamental = "bearish"; reasons.push(`PE ${fund.per}x — premium`) }
    if (fund.pbv < 2) score += 1
    if (fund.roe > 18) score += 1
    if (fund.der < 0.5) score += 1
    if (fund.dividendYield > 4) score += 1
    if (fund.eps < 0) { score -= 2; reasons.push("Negative earnings") }
  }

  if (flow) {
    if (flow.netForeign > 0) {
      score += 1; signals.flow = "accumulation"
      if (flow.netForeign > 1e12) score += 1
      if (stock.changePercent > 0) score += 1
      reasons.push(`Foreign net buy ${fmtShort(flow.netForeign)}`)
    } else if (flow.netForeign < 0) {
      score -= 1; signals.flow = "distribution"
      reasons.push(`Foreign net sell ${fmtShort(Math.abs(flow.netForeign))}`)
    }
  }

  let action: StockRecommendation["action"]
  if (score >= 5) action = "Buy"
  else if (score >= 2) action = "Watchlist"
  else if (score <= -2) action = "Sell"
  else action = "Hold"

  const confidence = Math.min(Math.max(Math.round((score + 5) / 10 * 100), 10), 95)

  return { stock, action, confidence, reasons, signals }
}

export function scanAll(
  stocks: Stock[],
  technicals: Record<string, TechnicalData>,
  fundamentals: Record<string, FundamentalData>,
  flow: Record<string, FlowData>
) {
  const recs = stocks.map(s => recommendStock(s, technicals[s.code], fundamentals[s.code], flow[s.code]))
  return {
    topPicks: recs.filter(r => r.action === "Buy").sort((a, b) => b.confidence - a.confidence).slice(0, 5),
    undervalued: findUndervalued(stocks, fundamentals).slice(0, 5),
    breakouts: findBreakoutSetups(stocks, technicals).slice(0, 5),
    unusualVolume: findUnusualVolume(stocks, technicals).slice(0, 5),
    foreignAccumulation: findForeignAccumulation(stocks, flow).slice(0, 5),
  }
}

export function formatAnalysis(stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData): string {
  const rec = recommendStock(stock, tech, fund, flow)
  const lines: string[] = [
    `**${stock.code} — ${stock.name}**`,
    `Price: Rp ${stock.price.toLocaleString("id-ID")} (${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%)`,
    `Sector: ${stock.sector} | ${stock.isSyariah ? "✅ Syariah" : "Non-Syariah"}`,
    ``,
    `━━━ Recommendation ━━━`,
    `**${rec.action}** (${rec.confidence}% confidence)`,
    ``,
    `**Signals:**`,
    `Technical: ${rec.signals.technical === "bullish" ? "🟢 Bullish" : rec.signals.technical === "bearish" ? "🔴 Bearish" : "⚪ Neutral"}`,
    `Fundamental: ${rec.signals.fundamental === "bullish" ? "🟢 Bullish" : rec.signals.fundamental === "bearish" ? "🔴 Bearish" : "⚪ Neutral"}`,
    `Foreign Flow: ${rec.signals.flow === "accumulation" ? "🟢 Accumulation" : rec.signals.flow === "distribution" ? "🔴 Distribution" : "⚪ Neutral"}`,
  ]
  if (rec.reasons.length) {
    lines.push("", "**Why:**", ...rec.reasons.map(r => `• ${r}`))
  }
  if (tech) {
    lines.push("", "**Key Levels:**", `Support: ${tech.bb.lower.toLocaleString("id-ID")}`, `Resistance: ${tech.bb.upper.toLocaleString("id-ID")}`)
  }
  return lines.join("\n")
}

export function formatTopPicks(picks: StockRecommendation[]): string {
  if (!picks.length) return "No strong buy signals right now."
  const lines = ["**Top Picks**", ""]
  for (const p of picks) {
    lines.push(`**${p.stock.code}** — ${p.action} (${p.confidence}%)`)
    lines.push(`Rp ${p.stock.price.toLocaleString("id-ID")} | ${p.stock.changePercent >= 0 ? "+" : ""}${p.stock.changePercent.toFixed(2)}%`)
    if (p.reasons.length) lines.push(`└ ${p.reasons[0]}`)
    lines.push("")
  }
  return lines.join("\n")
}

export function formatList(title: string, items: { stock: Stock; reason: string; score: number }[]): string {
  if (!items.length) return `No ${title.toLowerCase()} found.`
  const lines = [`**${title}**`, ""]
  for (const item of items) {
    lines.push(`**${item.stock.code}** — Rp ${item.stock.price.toLocaleString("id-ID")} (${item.stock.changePercent >= 0 ? "+" : ""}${item.stock.changePercent.toFixed(2)}%)`)
    lines.push(`└ ${item.reason}`)
    lines.push("")
  }
  return lines.join("\n")
}
