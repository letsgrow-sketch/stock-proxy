export interface Stock {
  code: string
  name: string
  sector: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  isSyariah: boolean
}

export interface TechnicalData {
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  ma50: number
  ma200: number
  ema20: number
  bb: { upper: number; middle: number; lower: number }
  stochastic: { k: number; d: number }
  recommendation: string
}

export interface FundamentalData {
  per: number
  pbv: number
  roe: number
  der: number
  eps: number
  dividendYield: number
  marketCap: number
  revenueGrowth: number
  netProfitGrowth: number
}

export interface FlowData {
  foreignBuy: number
  foreignSell: number
  netForeign: number
  volume: number
  frequency: number
  date: string
}

export interface SectorData {
  name: string
  change: number
  stocks: Stock[]
}

export interface WatchlistItem {
  id: string
  stock: Stock
  addedAt: string
  notes?: string
}

export interface AIAnalysis {
  summary: string
  sentiment: "bullish" | "bearish" | "neutral"
  keyLevels: { support: number[]; resistance: number[] }
  signals: { indicator: string; signal: string; strength: number }[]
  recommendation: string
}

export interface PortfolioHolding {
  id: string
  stockCode: string
  stockName: string
  sector: string
  shares: number
  averageBuyPrice: number
  totalInvested: number
  addedAt: string
}

export type AlertType =
  | "breakout"
  | "volume_spike"
  | "foreign_accumulation"
  | "rsi_oversold"
  | "rsi_overbought"
  | "macd_crossover"
  | "golden_cross"
  | "death_cross"
  | "syariah"

export interface AlertRule {
  id: string
  type: AlertType
  label: string
  stockCode: string
  enabled: boolean
  createdAt: string
}

export interface AlertEvent {
  id: string
  ruleId: string
  type: AlertType
  stockCode: string
  stockName: string
  sector: string
  price: number
  changePercent: number
  message: string
  details: string
  timestamp: string
  read: boolean
}

export type SortField = "code" | "name" | "price" | "change" | "changePercent" | "volume" | "marketCap" | "score" | "rsi" | "ma50" | "ma200" | "pbv" | "per" | "yield"
export type SortDirection = "asc" | "desc"

export interface IHSGData {
  value: number
  change: number
  changePercent: number
}

export interface MarketOverviewData {
  usdIdr: { value: number; change: number; changePercent: number }
  topInflow: { sector: string; netBuy: number; topStocks: string[] }
  topOutflow: { sector: string; netSell: number; topStocks: string[] }
  topConglomerate: { name: string; score: number; companies: string[] }
}

export interface FeatureCardItem {
  code: string
  name: string
  value: number
  changePercent: number
}

export type View = "table" | "watchlist" | "heatmap" | "technical" | "fundamental" | "flow" | "screener" | "portfolio" | "alerts" | "strategies" | "backtest"

export interface StockScore {
  code: string
  name: string
  sector: string
  price: number
  change: number
  changePercent: number
  score: number
  trend: "up" | "down" | "sideways"
  rsi: number
  ma50: number
  ma200: number
  pbv: number
  per: number
  yield: number
  volume: number
  marketCap: number
  isSyariah: boolean
  action: "Buy" | "Hold" | "Sell"
}
