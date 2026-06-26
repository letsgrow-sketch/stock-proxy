import { PortfolioHolding, Stock } from "@/types"

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

const STORAGE_KEY = "stock-screener-portfolio"

export function loadHoldings(): PortfolioHolding[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveHoldings(holdings: PortfolioHolding[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings)) } catch {}
}

export function addHolding(
  holdings: PortfolioHolding[],
  stock: Stock,
  shares: number,
  buyPrice: number,
): PortfolioHolding[] {
  const existing = holdings.find(h => h.stockCode === stock.code)
  if (existing) {
    return averageDown(holdings, stock.code, shares, buyPrice)
  }
  return [{
    id: uid(),
    stockCode: stock.code,
    stockName: stock.name,
    sector: stock.sector,
    shares,
    averageBuyPrice: buyPrice,
    totalInvested: shares * buyPrice,
    addedAt: new Date().toISOString(),
  }, ...holdings]
}

export function removeHolding(holdings: PortfolioHolding[], id: string): PortfolioHolding[] {
  return holdings.filter(h => h.id !== id)
}

export function averageDown(
  holdings: PortfolioHolding[],
  stockCode: string,
  additionalShares: number,
  additionalPrice: number,
): PortfolioHolding[] {
  return holdings.map(h => {
    if (h.stockCode !== stockCode) return h
    const newTotalInvested = h.totalInvested + (additionalShares * additionalPrice)
    const newShares = h.shares + additionalShares
    return {
      ...h,
      shares: newShares,
      averageBuyPrice: newTotalInvested / newShares,
      totalInvested: newTotalInvested,
    }
  })
}

export function updateHoldingPrice(
  holdings: PortfolioHolding[],
  id: string,
  shares: number,
  buyPrice: number,
): PortfolioHolding[] {
  return holdings.map(h => {
    if (h.id !== id) return h
    return {
      ...h,
      shares,
      averageBuyPrice: buyPrice,
      totalInvested: shares * buyPrice,
    }
  })
}

export function getCurrentPrice(code: string, stocks: Stock[]): number {
  return stocks.find(s => s.code === code)?.price ?? 0
}

export function getCurrentValue(holdings: PortfolioHolding[], stocks: Stock[]): number {
  return holdings.reduce((sum, h) => sum + (getCurrentPrice(h.stockCode, stocks) * h.shares), 0)
}

export function getTotalPnL(holdings: PortfolioHolding[], stocks: Stock[]): number {
  return holdings.reduce((sum, h) => {
    const currentPrice = getCurrentPrice(h.stockCode, stocks)
    return sum + ((currentPrice - h.averageBuyPrice) * h.shares)
  }, 0)
}

export function getTotalReturn(holdings: PortfolioHolding[], stocks: Stock[]): number {
  const totalInvested = holdings.reduce((s, h) => s + h.totalInvested, 0)
  if (totalInvested === 0) return 0
  return (getTotalPnL(holdings, stocks) / totalInvested) * 100
}

export function calcRiskReward(entry: number, stopLoss: number, target: number): {
  risk: number; reward: number; ratio: number
} {
  const risk = Math.abs(entry - stopLoss)
  const reward = Math.abs(target - entry)
  return { risk, reward, ratio: risk > 0 ? reward / risk : 0 }
}

export interface SectorAllocation {
  sector: string
  totalValue: number
  percentage: number
  holdings: number
}

export function getSectorAllocation(
  holdings: PortfolioHolding[],
  stocks: Stock[],
): SectorAllocation[] {
  const totalValue = getCurrentValue(holdings, stocks)
  if (totalValue === 0) return []

  const bySector = new Map<string, { value: number; count: number }>()
  for (const h of holdings) {
    const cv = getCurrentPrice(h.stockCode, stocks) * h.shares
    const sector = h.sector
    const existing = bySector.get(sector) ?? { value: 0, count: 0 }
    bySector.set(sector, { value: existing.value + cv, count: existing.count + 1 })
  }

  return Array.from(bySector.entries())
    .map(([sector, { value, count }]) => ({
      sector,
      totalValue: value,
      percentage: (value / totalValue) * 100,
      holdings: count,
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

export function formatRupiah(val: number): string {
  if (val >= 1e15) return `Rp${(val / 1e15).toFixed(2)}Q`
  if (val >= 1e12) return `Rp${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `Rp${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `Rp${(val / 1e6).toFixed(2)}M`
  if (val >= 1e3) return `Rp${(val / 1e3).toFixed(0)}K`
  return `Rp${val.toLocaleString("id-ID")}`
}
