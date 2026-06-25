import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"

export type StrategyType = "swing_trade" | "value_investing" | "momentum" | "breakout" | "foreign_accumulation"

export interface StrategySignal {
  name: string
  value: string
  bullish: boolean
}

export interface StrategyRecommendation {
  id: string
  strategy: StrategyType
  stockCode: string
  stockName: string
  sector: string
  isSyariah: boolean
  price: number
  changePercent: number
  action: "buy" | "sell" | "hold"
  entryZone: { min: number; max: number }
  stopLoss: number
  takeProfit: number
  riskScore: number
  confidenceScore: number
  reasoning: string[]
  signals: StrategySignal[]
  timeframe: string
}

export const STRATEGY_META: Record<StrategyType, { label: string; icon: string; desc: string; color: string }> = {
  swing_trade: { label: "Swing Trade", icon: "🔀", desc: "Short-term momentum & reversal plays (3-14 days)", color: "#f59e0b" },
  value_investing: { label: "Value Investing", icon: "💎", desc: "Undervalued stocks with strong fundamentals (6-12 months)", color: "#22c55e" },
  momentum: { label: "Momentum", icon: "🚀", desc: "Stocks with strong price & volume momentum (1-4 weeks)", color: "#3b82f6" },
  breakout: { label: "Breakout", icon: "📈", desc: "Stocks breaking through key resistance levels (1-4 weeks)", color: "#8b5cf6" },
  foreign_accumulation: { label: "Foreign Accumulation", icon: "🌍", desc: "Stocks with strong institutional buying (2-8 weeks)", color: "#06b6d4" },
}

function fmtPrice(v: number): string {
  return `Rp ${v.toLocaleString("id-ID")}`
}

function roundToNearest(v: number, step: number): number {
  return Math.round(v / step) * step
}

function swingTrade(
  stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData
): StrategyRecommendation | null {
  if (!tech) return null
  const bbRange = tech.bb.upper - tech.bb.lower
  const bbPos = bbRange > 0 ? (stock.price - tech.bb.lower) / bbRange : 0.5
  let score = 0
  const reasons: string[] = []
  const signals: StrategySignal[] = []
  let entryMin = stock.price, entryMax = stock.price
  let stopLoss = stock.price, takeProfit = stock.price
  let isOversoldBounce = false

  const rsiVal = tech.rsi
  signals.push({ name: "RSI (14)", value: rsiVal.toFixed(1), bullish: rsiVal > 30 && rsiVal < 60 })
  signals.push({ name: "MACD Histogram", value: tech.macd.histogram > 0 ? `+${tech.macd.histogram.toFixed(1)}` : tech.macd.histogram.toFixed(1), bullish: tech.macd.histogram > 0 })
  signals.push({ name: "Price vs MA20", value: stock.price > tech.ema20 ? "Above" : "Below", bullish: stock.price > tech.ema20 })
  signals.push({ name: "BB Position", value: `${(bbPos * 100).toFixed(0)}%`, bullish: bbPos > 0.2 && bbPos < 0.8 })
  if (flow) {
    signals.push({ name: "Foreign Flow", value: flow.netForeign > 0 ? `+${flow.netForeign.toLocaleString("id-ID")}` : flow.netForeign.toLocaleString("id-ID"), bullish: flow.netForeign > 0 })
  }

  if (rsiVal < 35 && bbPos < 0.3) {
    isOversoldBounce = true
    score += 3
    reasons.push(`RSI ${rsiVal.toFixed(1)} oversold near BB lower — potential bounce`)
    entryMin = roundToNearest(stock.price * 0.98, 5)
    entryMax = roundToNearest(stock.price * 1.01, 5)
    stopLoss = roundToNearest(tech.bb.lower * 0.97, 5)
    takeProfit = roundToNearest(tech.bb.middle, 5)
  } else if (rsiVal > 40 && rsiVal < 65 && tech.macd.histogram > 0 && bbPos > 0.4 && bbPos < 0.85) {
    score += 3
    reasons.push(`RSI ${rsiVal.toFixed(1)} in bullish zone with MACD+ — trend continuation`)
    entryMin = roundToNearest(stock.price * 0.99, 5)
    entryMax = roundToNearest(stock.price * 1.02, 5)
    stopLoss = roundToNearest(Math.max(tech.ma50, stock.price * 0.95), 5)
    takeProfit = roundToNearest(tech.bb.upper * 1.01, 5)
  } else if (rsiVal > 50 && tech.macd.histogram > 0) {
    score += 2
    reasons.push(`Momentum positive with MACD+ and RSI ${rsiVal.toFixed(1)}`)
    entryMin = roundToNearest(stock.price, 5)
    entryMax = roundToNearest(stock.price * 1.015, 5)
    stopLoss = roundToNearest(stock.price * 0.94, 5)
    takeProfit = roundToNearest(tech.bb.upper, 5)
  }

  if (stock.volume > 0 && reasons.length === 0) {
    const avgVol = 10000000
    if (stock.volume > avgVol * 1.5) { score += 1; reasons.push(`Volume ${(stock.volume / avgVol).toFixed(1)}x avg — strong participation`) }
  }
  if (flow?.netForeign && flow.netForeign > 0) { score += 1 }

  if (score < 2) return null

  const risk = Math.abs(entryMin - stopLoss)
  const reward = Math.abs(takeProfit - entryMax)
  const riskScore = Math.max(1, Math.min(10, isOversoldBounce ? 7 : 5))
  const confidenceScore = Math.min(90, Math.round((score / 7) * 80 + 10))

  if (!reasons.length) reasons.push(`Swing trade setup detected (score ${score})`)

  return {
    id: `st-${stock.code}-swing`, strategy: "swing_trade",
    stockCode: stock.code, stockName: stock.name, sector: stock.sector, isSyariah: stock.isSyariah,
    price: stock.price, changePercent: stock.changePercent, action: "buy",
    entryZone: { min: entryMin, max: entryMax }, stopLoss, takeProfit,
    riskScore, confidenceScore, reasoning: reasons, signals,
    timeframe: isOversoldBounce ? "3-10 days" : "5-14 days",
  }
}

function valueInvesting(
  stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData
): StrategyRecommendation | null {
  if (!fund || fund.per <= 0) return null
  let score = 0
  const reasons: string[] = []
  const signals: StrategySignal[] = []

  signals.push({ name: "PER", value: `${fund.per.toFixed(1)}x`, bullish: fund.per < 15 })
  signals.push({ name: "PBV", value: `${fund.pbv.toFixed(1)}x`, bullish: fund.pbv < 2 })
  signals.push({ name: "ROE", value: `${fund.roe.toFixed(1)}%`, bullish: fund.roe > 15 })
  signals.push({ name: "DER", value: fund.der.toFixed(2), bullish: fund.der < 0.8 })
  signals.push({ name: "Dividend Yield", value: `${fund.dividendYield.toFixed(1)}%`, bullish: fund.dividendYield > 3 })
  signals.push({ name: "Revenue Growth", value: `${fund.revenueGrowth >= 0 ? "+" : ""}${fund.revenueGrowth.toFixed(1)}%`, bullish: fund.revenueGrowth > 0 })
  signals.push({ name: "Net Profit Growth", value: `${fund.netProfitGrowth >= 0 ? "+" : ""}${fund.netProfitGrowth.toFixed(1)}%`, bullish: fund.netProfitGrowth > 0 })
  if (tech) {
    signals.push({ name: "RSI", value: tech.rsi.toFixed(1), bullish: tech.rsi > 30 && tech.rsi < 70 })
  }

  if (fund.per < 10) { score += 3; reasons.push(`PE ${fund.per}x — deeply undervalued`) }
  else if (fund.per < 15) { score += 2; reasons.push(`PE ${fund.per}x — undervalued`) }
  else if (fund.per < 20) { score += 1 }
  else { score -= 1 }
  if (fund.pbv < 1.5) { score += 2; reasons.push(`PBV ${fund.pbv}x — below book value`) }
  else if (fund.pbv < 3) { score += 1 }
  if (fund.roe > 20) { score += 2; reasons.push(`ROE ${fund.roe.toFixed(1)}% — excellent returns`) }
  else if (fund.roe > 15) { score += 1 }
  if (fund.der < 0.5) { score += 1; reasons.push(`DER ${fund.der} — low debt`) }
  if (fund.dividendYield > 5) { score += 1; reasons.push(`Yield ${fund.dividendYield.toFixed(1)}% — high dividend`) }
  if (fund.revenueGrowth > 10) { score += 1; reasons.push(`Revenue growth ${fund.revenueGrowth.toFixed(1)}%`) }
  if (fund.netProfitGrowth > 10) { score += 1; reasons.push(`Profit growth ${fund.netProfitGrowth.toFixed(1)}%`) }
  if (fund.eps < 0) { score -= 3; reasons.push("Negative earnings — avoid") }

  if (score < 2) return null

  const entryMin = roundToNearest(stock.price * 0.97, 10)
  const entryMax = roundToNearest(stock.price * 1.02, 10)
  const stopLoss = roundToNearest(stock.price * 0.88, 10)
  let takeProfit: number
  if (fund.per < 10) {
    const fairPE = 15
    const fairPrice = fund.eps * fairPE
    takeProfit = roundToNearest(Math.max(fairPrice, stock.price * 1.3), 10)
  } else {
    takeProfit = roundToNearest(stock.price * 1.25, 10)
  }

  const riskScore = 2
  const confidenceScore = Math.min(90, Math.round((score / 12) * 80 + 10))

  return {
    id: `st-${stock.code}-value`, strategy: "value_investing",
    stockCode: stock.code, stockName: stock.name, sector: stock.sector, isSyariah: stock.isSyariah,
    price: stock.price, changePercent: stock.changePercent, action: "buy",
    entryZone: { min: entryMin, max: entryMax }, stopLoss, takeProfit,
    riskScore, confidenceScore, reasoning: reasons, signals,
    timeframe: "6-12 months",
  }
}

function momentum(
  stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData
): StrategyRecommendation | null {
  if (!tech) return null
  let score = 0
  const reasons: string[] = []
  const signals: StrategySignal[] = []

  signals.push({ name: "RSI (14)", value: tech.rsi.toFixed(1), bullish: tech.rsi > 50 && tech.rsi < 75 })
  signals.push({ name: "MACD", value: tech.macd.histogram > 0 ? `+${tech.macd.histogram.toFixed(1)}` : tech.macd.histogram.toFixed(1), bullish: tech.macd.histogram > 0 })
  signals.push({ name: "Price vs EMA20", value: stock.price > tech.ema20 ? "Above" : "Below", bullish: stock.price > tech.ema20 })
  signals.push({ name: "Price vs MA50", value: stock.price > tech.ma50 ? "Above" : "Below", bullish: stock.price > tech.ma50 })
  signals.push({ name: "Change %", value: `${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`, bullish: stock.changePercent > 0 })

  const avgVol = 10000000
  const volRatio = stock.volume / avgVol
  signals.push({ name: "Volume vs Avg", value: `${volRatio.toFixed(1)}x`, bullish: volRatio > 1.2 })

  if (tech.rsi > 50 && tech.rsi < 75) { score += 2; reasons.push(`RSI ${tech.rsi.toFixed(1)} — bullish momentum`) }
  else if (tech.rsi > 75) { score -= 1 }
  if (tech.macd.histogram > 0) { score += 2; reasons.push("MACD positive — bullish crossover") }
  if (stock.price > tech.ema20) { score += 1; reasons.push("Price above EMA20") }
  if (stock.price > tech.ma50) { score += 1; reasons.push("Price above MA50") }
  if (stock.changePercent > 1) { score += 1; reasons.push(`Up ${stock.changePercent.toFixed(2)}% today`) }
  if (volRatio > 1.5) { score += 1; reasons.push(`Volume ${volRatio.toFixed(1)}x avg — strong interest`) }
  if (flow?.netForeign && flow.netForeign > 0) { score += 1 }

  if (score < 3) return null

  const entryMin = roundToNearest(stock.price * 0.99, 5)
  const entryMax = roundToNearest(stock.price * 1.02, 5)
  const stopLoss = roundToNearest(Math.max(tech.ema20, stock.price * 0.94), 5)
  const bbRange = tech.bb.upper - tech.bb.lower
  const extension = bbRange * 0.3
  const takeProfit = roundToNearest(tech.bb.upper + extension, 5)

  const riskScore = Math.max(3, Math.min(8, score > 5 ? 4 : 6))
  const confidenceScore = Math.min(92, Math.round((score / 8) * 80 + 10))

  return {
    id: `st-${stock.code}-momentum`, strategy: "momentum",
    stockCode: stock.code, stockName: stock.name, sector: stock.sector, isSyariah: stock.isSyariah,
    price: stock.price, changePercent: stock.changePercent, action: "buy",
    entryZone: { min: entryMin, max: entryMax }, stopLoss, takeProfit,
    riskScore, confidenceScore, reasoning: reasons, signals,
    timeframe: "1-4 weeks",
  }
}

function breakout(
  stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData
): StrategyRecommendation | null {
  if (!tech) return null
  const bbRange = tech.bb.upper - tech.bb.lower
  const bbPos = bbRange > 0 ? (stock.price - tech.bb.lower) / bbRange : 0.5
  let score = 0
  const reasons: string[] = []
  const signals: StrategySignal[] = []

  signals.push({ name: "Price vs MA50", value: stock.price > tech.ma50 ? "Above" : "Below", bullish: stock.price > tech.ma50 })
  signals.push({ name: "Price vs MA200", value: stock.price > tech.ma200 ? "Above" : "Below", bullish: stock.price > tech.ma200 })
  signals.push({ name: "RSI (14)", value: tech.rsi.toFixed(1), bullish: tech.rsi > 45 && tech.rsi < 75 })
  signals.push({ name: "MACD Histogram", value: tech.macd.histogram > 0 ? `+${tech.macd.histogram.toFixed(1)}` : tech.macd.histogram.toFixed(1), bullish: tech.macd.histogram > 0 })
  signals.push({ name: "BB Position", value: `${(bbPos * 100).toFixed(0)}%`, bullish: bbPos > 0.6 })
  signals.push({ name: "BB Width", value: `${((bbRange / tech.bb.middle) * 100).toFixed(1)}%`, bullish: bbRange / tech.bb.middle > 0.03 })

  if (stock.price > tech.ma50) { score += 2; reasons.push("Above MA50") }
  if (stock.price > tech.ma200) { score += 2; reasons.push("Above MA200") }
  if (tech.rsi > 45 && tech.rsi < 75) { score += 2; reasons.push(`RSI ${tech.rsi.toFixed(1)} — bullish`) }
  if (tech.macd.histogram > 0) { score += 1; reasons.push("MACD+ momentum") }
  if (bbPos > 0.6) { score += 1; reasons.push("Price in upper BB range — breakout pressure") }
  if (stock.volume > 15000000) { score += 1; reasons.push("High volume confirmation") }

  if (score < 4) return null

  const entryMin = roundToNearest(stock.price * 0.995, 5)
  const entryMax = roundToNearest(stock.price * 1.025, 5)
  const stopLoss = roundToNearest(Math.max(tech.ma50, stock.price * 0.95), 5)
  const extension = bbRange * 0.5
  const takeProfit = roundToNearest(tech.bb.upper + extension, 5)

  const riskScore = Math.max(3, Math.min(6, score > 6 ? 3 : 5))
  const confidenceScore = Math.min(92, Math.round((score / 9) * 80 + 10))

  return {
    id: `st-${stock.code}-breakout`, strategy: "breakout",
    stockCode: stock.code, stockName: stock.name, sector: stock.sector, isSyariah: stock.isSyariah,
    price: stock.price, changePercent: stock.changePercent, action: "buy",
    entryZone: { min: entryMin, max: entryMax }, stopLoss, takeProfit,
    riskScore, confidenceScore, reasoning: reasons, signals,
    timeframe: "1-4 weeks",
  }
}

function foreignAccumulation(
  stock: Stock, tech?: TechnicalData, fund?: FundamentalData, flow?: FlowData
): StrategyRecommendation | null {
  if (!flow || flow.netForeign <= 0) return null
  let score = 0
  const reasons: string[] = []
  const signals: StrategySignal[] = []

  const buyRatio = flow.foreignSell > 0 ? flow.foreignBuy / flow.foreignSell : 2
  signals.push({ name: "Net Foreign", value: `+${flow.netForeign.toLocaleString("id-ID")}`, bullish: flow.netForeign > 0 })
  signals.push({ name: "Buy/Sell Ratio", value: buyRatio.toFixed(2), bullish: buyRatio > 1.3 })
  signals.push({ name: "Foreign Buy", value: flow.foreignBuy.toLocaleString("id-ID"), bullish: flow.foreignBuy > flow.foreignSell })
  signals.push({ name: "Price Change", value: `${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`, bullish: stock.changePercent > 0 })
  if (tech) {
    signals.push({ name: "RSI", value: tech.rsi.toFixed(1), bullish: tech.rsi > 40 && tech.rsi < 75 })
    signals.push({ name: "Trend", value: stock.price > (tech?.ma50 ?? 0) ? "Uptrend" : "Downtrend", bullish: stock.price > (tech?.ma50 ?? 0) })
  }

  if (flow.netForeign > 1e12) { score += 3; reasons.push(`Large net buy ${fmtPrice(flow.netForeign)}`) }
  else if (flow.netForeign > 1e11) { score += 2; reasons.push(`Net buy ${fmtPrice(flow.netForeign)}`) }
  else { score += 1 }
  if (buyRatio > 1.5) { score += 2; reasons.push(`Strong buy ratio ${buyRatio.toFixed(2)}x`) }
  else if (buyRatio > 1.2) { score += 1 }
  if (stock.changePercent > 0) { score += 1; reasons.push("Price up confirming accumulation") }
  if (tech && stock.price > tech.ma50) { score += 1 }
  if (tech && tech.macd.histogram > 0) { score += 1 }

  if (score < 2) return null

  const entryMin = roundToNearest(stock.price * 0.99, 5)
  const entryMax = roundToNearest(stock.price * 1.02, 5)
  const stopLoss = roundToNearest(stock.price * 0.95, 5)
  let takeProfit: number
  if (tech) {
    takeProfit = roundToNearest(tech.bb.upper, 5)
  } else {
    takeProfit = roundToNearest(stock.price * 1.12, 5)
  }

  const riskScore = Math.max(2, Math.min(5, score > 5 ? 2 : 4))
  const confidenceScore = Math.min(90, Math.round((score / 9) * 80 + 10))

  return {
    id: `st-${stock.code}-foreign`, strategy: "foreign_accumulation",
    stockCode: stock.code, stockName: stock.name, sector: stock.sector, isSyariah: stock.isSyariah,
    price: stock.price, changePercent: stock.changePercent, action: "buy",
    entryZone: { min: entryMin, max: entryMax }, stopLoss, takeProfit,
    riskScore, confidenceScore, reasoning: reasons, signals,
    timeframe: "2-8 weeks",
  }
}

export function scanStrategy(
  strategy: StrategyType,
  stocks: Stock[],
  technicalData: Record<string, TechnicalData>,
  fundamentalData: Record<string, FundamentalData>,
  flowData: Record<string, FlowData>,
  limit = 5,
): StrategyRecommendation[] {
  const fns: Record<StrategyType, (s: Stock, t?: TechnicalData, f?: FundamentalData, fl?: FlowData) => StrategyRecommendation | null> = {
    swing_trade: swingTrade,
    value_investing: valueInvesting,
    momentum,
    breakout,
    foreign_accumulation: foreignAccumulation,
  }

  const fn = fns[strategy]
  return stocks
    .map(s => fn(s, technicalData[s.code], fundamentalData[s.code], flowData[s.code]))
    .filter((r): r is StrategyRecommendation => r !== null)
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, limit)
}

export function scanAllStrategies(
  stocks: Stock[],
  technicalData: Record<string, TechnicalData>,
  fundamentalData: Record<string, FundamentalData>,
  flowData: Record<string, FlowData>,
): Record<StrategyType, StrategyRecommendation[]> {
  return {
    swing_trade: scanStrategy("swing_trade", stocks, technicalData, fundamentalData, flowData),
    value_investing: scanStrategy("value_investing", stocks, technicalData, fundamentalData, flowData),
    momentum: scanStrategy("momentum", stocks, technicalData, fundamentalData, flowData),
    breakout: scanStrategy("breakout", stocks, technicalData, fundamentalData, flowData),
    foreign_accumulation: scanStrategy("foreign_accumulation", stocks, technicalData, fundamentalData, flowData),
  }
}
