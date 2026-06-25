import { STOCK_NAMES, STOCK_SECTORS } from "@/lib/constants"
import { calcSMA, calcEMA, calcRSI, calcMACD, calcBB } from "@/lib/technical"
import type { YFBar } from "@/lib/yahoo-finance"

export type BacktestStrategy =
  | "sma_crossover"
  | "rsi_mean_reversion"
  | "macd_crossover"
  | "bollinger_bands"
  | "breakout"

export interface BacktestConfig {
  strategy: BacktestStrategy
  stockCode: string
  initialCapital: number
  startDate?: string
  endDate?: string
  positionSize?: number
  stopLoss?: number
  takeProfit?: number
  smaShort?: number
  smaLong?: number
  rsiPeriod?: number
  rsiOversold?: number
  rsiOverbought?: number
  bbPeriod?: number
  bbMultiplier?: number
  breakoutLookback?: number
  breakoutVolumeMultiplier?: number
}

export interface BacktestTrade {
  id: string
  entryDate: string
  entryPrice: number
  exitDate: string
  exitPrice: number
  shares: number
  pnl: number
  pnlPercent: number
  exitReason: "stop_loss" | "take_profit" | "signal_reverse" | "end_of_data"
  holdingPeriod: number
}

export interface BacktestMetrics {
  totalReturn: number
  totalReturnPercent: number
  cagr: number
  annualizedVolatility: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  calmarRatio: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  avgReturn: number
  profitFactor: number
  avgHoldingPeriod: number
  commission: number
  netProfit: number
  bestTrade: number
  worstTrade: number
}

export interface EquityPoint {
  date: string
  equity: number
  highWaterMark: number
  drawdown: number
  drawdownPercent: number
}

export interface BacktestResult {
  config: BacktestConfig
  metrics: BacktestMetrics
  trades: BacktestTrade[]
  equityCurve: EquityPoint[]
}

const DEFAULT_CONFIG: BacktestConfig = {
  strategy: "sma_crossover",
  stockCode: "BBCA",
  initialCapital: 100_000_000,
  positionSize: 1,
  stopLoss: 0,
  takeProfit: 0,
  smaShort: 20,
  smaLong: 50,
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  bbPeriod: 20,
  bbMultiplier: 2,
  breakoutLookback: 20,
  breakoutVolumeMultiplier: 1.5,
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function parseDate(d: string): number {
  return new Date(d).getTime()
}

function mergeConfig(overrides: Partial<BacktestConfig>): BacktestConfig {
  return { ...DEFAULT_CONFIG, ...overrides }
}

function filterBars(bars: YFBar[], config: BacktestConfig): YFBar[] {
  let filtered = [...bars]
  if (config.startDate) {
    const t = parseDate(config.startDate)
    filtered = filtered.filter(b => parseDate(b.date) >= t)
  }
  if (config.endDate) {
    const t = parseDate(config.endDate)
    filtered = filtered.filter(b => parseDate(b.date) <= t)
  }
  return filtered
}

export function generateSignals(
  bars: YFBar[],
  strategy: BacktestStrategy,
  config: BacktestConfig
): ("buy" | "sell" | "hold")[] {
  const closes = bars.map(b => b.close)
  const volumes = bars.map(b => b.volume)
  const n = bars.length
  const signals: ("buy" | "sell" | "hold")[] = new Array(n).fill("hold")

  if (n < 60) return signals

  switch (strategy) {
    case "sma_crossover": {
      const short = calcSMA(closes, config.smaShort || 20)
      const long = calcSMA(closes, config.smaLong || 50)
      let inPosition = false
      for (let i = 1; i < n; i++) {
        if (isNaN(short[i]) || isNaN(long[i])) continue
        if (!inPosition && short[i - 1] <= long[i - 1] && short[i] > long[i]) {
          signals[i] = "buy"
          inPosition = true
        } else if (inPosition && short[i - 1] >= long[i - 1] && short[i] < long[i]) {
          signals[i] = "sell"
          inPosition = false
        }
      }
      if (inPosition) signals[n - 1] = "sell"
      break
    }

    case "rsi_mean_reversion": {
      const rsi = calcRSI(closes, config.rsiPeriod || 14)
      const oversold = config.rsiOversold || 30
      const overbought = config.rsiOverbought || 70
      let inPosition = false
      for (let i = 0; i < n; i++) {
        if (isNaN(rsi[i])) continue
        if (!inPosition && rsi[i] < oversold) {
          signals[i] = "buy"
          inPosition = true
        } else if (inPosition && rsi[i] > overbought) {
          signals[i] = "sell"
          inPosition = false
        }
      }
      if (inPosition) signals[n - 1] = "sell"
      break
    }

    case "macd_crossover": {
      const { macd, signal } = calcMACD(closes)
      let inPosition = false
      for (let i = 1; i < n; i++) {
        if (isNaN(macd[i]) || isNaN(signal[i]) || isNaN(macd[i - 1]) || isNaN(signal[i - 1])) continue
        if (!inPosition && macd[i - 1] <= signal[i - 1] && macd[i] > signal[i]) {
          signals[i] = "buy"
          inPosition = true
        } else if (inPosition && macd[i - 1] >= signal[i - 1] && macd[i] < signal[i]) {
          signals[i] = "sell"
          inPosition = false
        }
      }
      if (inPosition) signals[n - 1] = "sell"
      break
    }

    case "bollinger_bands": {
      const bb = calcBB(closes, config.bbPeriod || 20, config.bbMultiplier || 2)
      let inPosition = false
      for (let i = 0; i < n; i++) {
        if (isNaN(bb.lower[i]) || isNaN(bb.upper[i])) continue
        if (!inPosition && closes[i] <= bb.lower[i]) {
          signals[i] = "buy"
          inPosition = true
        } else if (inPosition && closes[i] >= bb.upper[i]) {
          signals[i] = "sell"
          inPosition = false
        }
      }
      if (inPosition) signals[n - 1] = "sell"
      break
    }

    case "breakout": {
      const lb = config.breakoutLookback || 20
      const volMult = config.breakoutVolumeMultiplier || 1.5
      const avgVol: number[] = []
      for (let i = 0; i < n; i++) {
        if (i < lb) { avgVol.push(NaN); continue }
        const slice = volumes.slice(i - lb, i)
        avgVol.push(slice.reduce((a, b) => a + b, 0) / lb)
      }
      let inPosition = false
      for (let i = lb; i < n; i++) {
        if (isNaN(avgVol[i])) continue
        const high = Math.max(...closes.slice(i - lb, i))
        if (!inPosition && closes[i] > high && volumes[i] > avgVol[i] * volMult) {
          signals[i] = "buy"
          inPosition = true
        } else if (inPosition && closes[i] < calcSMA(closes, 20)[i]) {
          signals[i] = "sell"
          inPosition = false
        }
      }
      if (inPosition) signals[n - 1] = "sell"
      break
    }
  }

  return signals
}

export function simulateTrades(
  bars: YFBar[],
  signals: ("buy" | "sell" | "hold")[],
  config: BacktestConfig
): BacktestTrade[] {
  const trades: BacktestTrade[] = []
  let cash = config.initialCapital
  let shares = 0
  let entryPrice = 0
  let entryDate = ""
  let entryIndex = -1
  const stopLoss = config.stopLoss || 0
  const takeProfit = config.takeProfit || 0

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    const signal = signals[i]

    if (signal === "buy" && shares === 0) {
      const invested = cash * (config.positionSize || 1)
      shares = Math.floor(invested / bar.close)
      if (shares === 0) continue
      entryPrice = bar.close
      entryDate = bar.date
      entryIndex = i
      cash -= shares * bar.close
    }

    if (shares > 0) {
      let exitPrice = 0
      let exitDate = bar.date
      let exitReason: BacktestTrade["exitReason"] = "signal_reverse"

      if (stopLoss > 0 && bar.low <= entryPrice * (1 - stopLoss)) {
        exitPrice = entryPrice * (1 - stopLoss)
        exitReason = "stop_loss"
      } else if (takeProfit > 0 && bar.high >= entryPrice * (1 + takeProfit)) {
        exitPrice = entryPrice * (1 + takeProfit)
        exitReason = "take_profit"
      } else if (signal === "sell") {
        exitPrice = bar.close
        exitReason = "signal_reverse"
      } else if (i === bars.length - 1) {
        exitPrice = bar.close
        exitReason = "end_of_data"
      } else {
        continue
      }

      const pnl = shares * (exitPrice - entryPrice)
      const pnlPercent = (exitPrice - entryPrice) / entryPrice
      cash += shares * exitPrice

      trades.push({
        id: generateId(),
        entryDate,
        entryPrice,
        exitDate,
        exitPrice,
        shares,
        pnl: Math.round(pnl),
        pnlPercent,
        exitReason,
        holdingPeriod: i - entryIndex,
      })

      shares = 0
    }
  }

  return trades
}

export function calculateMetrics(
  trades: BacktestTrade[],
  bars: YFBar[],
  config: BacktestConfig
): BacktestMetrics {
  const initialCapital = config.initialCapital
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const commission = trades.length * 2000
  const netProfit = totalPnl - commission
  const totalReturnPercent = netProfit / initialCapital
  const winningTrades = trades.filter(t => t.pnl > 0)
  const losingTrades = trades.filter(t => t.pnl <= 0)
  const totalTrades = trades.length

  const winRate = totalTrades > 0 ? winningTrades.length / totalTrades : 0
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((s, t) => s + t.pnlPercent, 0) / winningTrades.length
    : 0
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((s, t) => s + t.pnlPercent, 0) / losingTrades.length
    : 0
  const avgReturn = totalTrades > 0
    ? trades.reduce((s, t) => s + t.pnlPercent, 0) / totalTrades
    : 0

  const profitFactor = losingTrades.length > 0
    ? Math.abs(
        winningTrades.reduce((s, t) => s + t.pnl, 0) /
        losingTrades.reduce((s, t) => s + t.pnl, 0)
      )
    : winningTrades.length > 0 ? Infinity : 0

  const avgHoldingPeriod = totalTrades > 0
    ? trades.reduce((s, t) => s + t.holdingPeriod, 0) / totalTrades
    : 0

  const bestTrade = totalTrades > 0
    ? Math.max(...trades.map(t => t.pnlPercent))
    : 0
  const worstTrade = totalTrades > 0
    ? Math.min(...trades.map(t => t.pnlPercent))
    : 0

  const dailyReturns = calcDailyReturns(bars, trades, config)
  const sharpeRatio = calcSharpe(dailyReturns)
  const sortinoRatio = calcSortino(dailyReturns)
  const annualizedVolatility = calcAnnualizedVol(dailyReturns)
  const cagr = calcCAGR(initialCapital, initialCapital + netProfit, bars)
  const maxDd = calcMaxDrawdown(bars, trades, config)
  const maxDrawdownPercent = maxDd > 0 ? maxDd / initialCapital : 0
  const calmarRatio = maxDrawdownPercent > 0 ? cagr / maxDrawdownPercent : 0

  return {
    totalReturn: netProfit,
    totalReturnPercent,
    cagr,
    annualizedVolatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: maxDd,
    maxDrawdownPercent,
    calmarRatio,
    winRate,
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin,
    avgLoss,
    avgReturn,
    profitFactor: isFinite(profitFactor) ? profitFactor : profitFactor === Infinity ? 999 : 0,
    avgHoldingPeriod,
    commission,
    netProfit,
    bestTrade,
    worstTrade,
  }
}

export function buildEquityCurve(
  bars: YFBar[],
  trades: BacktestTrade[],
  config: BacktestConfig
): EquityPoint[] {
  const curve: EquityPoint[] = []
  let cash = config.initialCapital
  let shares = 0
  let entryPrice = 0
  let tradeIdx = 0
  let peak = config.initialCapital

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]

    while (tradeIdx < trades.length && trades[tradeIdx].exitDate === bar.date) {
      const t = trades[tradeIdx]
      cash += t.shares * t.exitPrice
      shares = 0
      tradeIdx++
    }

    if (shares === 0 && tradeIdx < trades.length && trades[tradeIdx].entryDate === bar.date) {
      const t = trades[tradeIdx]
      const invested = Math.min(cash * (config.positionSize || 1), cash)
      shares = Math.floor(invested / t.entryPrice)
      entryPrice = t.entryPrice
      cash -= shares * t.entryPrice
    }

    const equity = cash + shares * bar.close
    if (equity > peak) peak = equity
    const drawdown = peak - equity
    const drawdownPercent = peak > 0 ? drawdown / peak : 0

    curve.push({
      date: bar.date,
      equity: Math.round(equity),
      highWaterMark: Math.round(peak),
      drawdown: Math.round(drawdown),
      drawdownPercent,
    })
  }

  return curve
}

export function runBacktest(bars: YFBar[], configOverrides: Partial<BacktestConfig>): BacktestResult {
  const config = mergeConfig(configOverrides)
  const filtered = filterBars(bars, config)
  if (filtered.length < 60) {
    throw new Error(`Not enough data: need at least 60 days, got ${filtered.length}`)
  }

  const signals = generateSignals(filtered, config.strategy, config)
  const trades = simulateTrades(filtered, signals, config)
  const equityCurve = buildEquityCurve(filtered, trades, config)
  const metrics = calculateMetrics(trades, filtered, config)

  return { config, metrics, trades, equityCurve }
}

function calcDailyReturns(
  bars: YFBar[],
  trades: BacktestTrade[],
  config: BacktestConfig
): number[] {
  const curve = buildEquityCurve(bars, trades, config)
  const returns: number[] = []
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].equity
    if (prev > 0) returns.push((curve[i].equity - prev) / prev)
  }
  return returns
}

function calcSharpe(returns: number[]): number {
  if (returns.length < 5) return 0
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length
  const std = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1))
  if (std === 0) return 0
  return (mean / std) * Math.sqrt(252)
}

function calcSortino(returns: number[]): number {
  if (returns.length < 5) return 0
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length
  const downside = returns.filter(v => v < 0)
  if (downside.length === 0) return mean > 0 ? 999 : 0
  const downsideStd = Math.sqrt(downside.reduce((s, v) => s + v * v, 0) / returns.length)
  if (downsideStd === 0) return 0
  return (mean / downsideStd) * Math.sqrt(252)
}

function calcAnnualizedVol(returns: number[]): number {
  if (returns.length < 5) return 0
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length
  const std = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1))
  return std * Math.sqrt(252)
}

function calcCAGR(initial: number, final: number, bars: YFBar[]): number {
  if (initial <= 0 || bars.length < 252) return (final - initial) / initial
  const years = bars.length / 252
  if (years <= 0) return 0
  return Math.pow(final / initial, 1 / years) - 1
}

function calcMaxDrawdown(
  bars: YFBar[],
  trades: BacktestTrade[],
  config: BacktestConfig
): number {
  const curve = buildEquityCurve(bars, trades, config)
  let peak = curve[0]?.equity || config.initialCapital
  let maxDd = 0
  for (const pt of curve) {
    if (pt.equity > peak) peak = pt.equity
    const dd = peak - pt.equity
    if (dd > maxDd) maxDd = dd
  }
  return maxDd
}

export function tradesToCSV(trades: BacktestTrade[], metrics: BacktestMetrics, config: BacktestConfig): string {
  const stockName = STOCK_NAMES[config.stockCode] || config.stockCode
  const rows: string[] = []

  rows.push(`Backtest Report: ${config.stockCode} (${stockName})`)
  rows.push(`Strategy: ${strategyLabel(config.strategy)}`)
  rows.push(`Period: ${trades[0]?.entryDate || "N/A"} — ${trades[trades.length - 1]?.exitDate || "N/A"}`)
  rows.push(`Initial Capital: Rp ${config.initialCapital.toLocaleString("id-ID")}`)
  rows.push(`Net Profit: Rp ${metrics.netProfit.toLocaleString("id-ID")} (${(metrics.totalReturnPercent * 100).toFixed(2)}%)`)
  rows.push(`Win Rate: ${(metrics.winRate * 100).toFixed(1)}%`)
  rows.push(`Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`)
  rows.push(`Sortino Ratio: ${metrics.sortinoRatio.toFixed(2)}`)
  rows.push(`CAGR: ${(metrics.cagr * 100).toFixed(2)}%`)
  rows.push(`Max Drawdown: ${(metrics.maxDrawdownPercent * 100).toFixed(2)}%`)
  rows.push(`Profit Factor: ${metrics.profitFactor.toFixed(2)}`)
  rows.push("")
  rows.push("Trade ID,Entry Date,Entry Price,Exit Date,Exit Price,Shares,P&L,P&L %,Exit Reason,Holding Period (days)")
  for (const t of trades) {
    rows.push([
      t.id,
      t.entryDate,
      t.entryPrice,
      t.exitDate,
      t.exitPrice,
      t.shares,
      t.pnl,
      (t.pnlPercent * 100).toFixed(2) + "%",
      t.exitReason,
      t.holdingPeriod,
    ].join(","))
  }

  return rows.join("\n")
}

export function strategyLabel(s: BacktestStrategy): string {
  const labels: Record<BacktestStrategy, string> = {
    sma_crossover: "SMA Crossover",
    rsi_mean_reversion: "RSI Mean Reversion",
    macd_crossover: "MACD Crossover",
    bollinger_bands: "Bollinger Bands",
    breakout: "Breakout",
  }
  return labels[s]
}

export function strategyDescription(s: BacktestStrategy): string {
  const descs: Record<BacktestStrategy, string> = {
    sma_crossover: "Buy when short SMA crosses above long SMA, sell when it crosses below",
    rsi_mean_reversion: "Buy when RSI enters oversold territory, sell when it reaches overbought",
    macd_crossover: "Buy when MACD line crosses above signal line, sell when it crosses below",
    bollinger_bands: "Buy when price touches lower Bollinger Band, sell when it touches upper band",
    breakout: "Buy when price breaks above recent high with above-average volume",
  }
  return descs[s]
}
