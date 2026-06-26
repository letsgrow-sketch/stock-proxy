import YahooFinance from "yahoo-finance2"

interface CacheEntry<T> {
  data: T
  ts: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_MAX = 500

function pruneCache(): void {
  if (cache.size <= CACHE_MAX) return
  const entries = Array.from(cache.entries()).sort((a, b) => a[1].ts - b[1].ts)
  const toDelete = entries.slice(0, cache.size - CACHE_MAX)
  for (const [key] of toDelete) cache.delete(key)
}

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.ts < ttl) return entry.data
  return null
}

function getStaleCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  return entry ? entry.data : null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() })
  pruneCache()
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const result = await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
  clearTimeout(timer)
  return result
}

async function withRetry<T>(fn: () => Promise<T>, timeoutMs = 15000, maxRetries = 1): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs)
    } catch (error) {
      if (attempt === maxRetries) throw error
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error("unreachable")
}

function parseRange(range: string): number {
  const alias: Record<string, string> = {
    "1m": "1mo", "3m": "3mo", "6m": "6mo",
    "1y": "1y", "2y": "2y", "5y": "5y",
  }
  const map: Record<string, number> = {
    "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180,
    "1y": 365, "2y": 730, "5y": 1825, "10y": 3650, "max": 36500,
  }
  const key = alias[range.toLowerCase()] || range.toLowerCase()
  return (map[key] ?? 365) * 24 * 60 * 60 * 1000
}

function stripJk(symbol: string): string {
  return symbol.endsWith(".JK") ? symbol.slice(0, -3) : symbol
}

export interface YFQuote {
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  marketCap?: number
  name?: string
  trailingPE?: number
  priceToBook?: number
  trailingEps?: number
  dividendYield?: number
}

export interface YFFundamental {
  sector: string | null
  industry: string | null
  returnOnEquity: number | null
  debtToEquity: number | null
  trailingEps: number | null
  forwardPE: number | null
  priceToBook: number | null
  dividendYield: number | null
  marketCap: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  bookValue: number | null
  totalDebt: number | null
  heldPercentInstitutions: number | null
  beta: number | null
}

export interface IndexQuote {
  price: number
  change: number
  changePercent: number
}

const indexCache = new Map<string, { data: IndexQuote; ts: number }>()

function getCachedIndex(key: string): IndexQuote | null {
  const entry = indexCache.get(key)
  if (entry && Date.now() - entry.ts < 30000) return entry.data
  return null
}

function setCachedIndex(key: string, data: IndexQuote): void {
  indexCache.set(key, { data, ts: Date.now() })
}

export async function fetchIndexQuote(symbol: string): Promise<IndexQuote | null> {
  const cached = getCachedIndex(symbol)
  if (cached) return cached

  try {
    const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] })
    const quotes = await withRetry(() => yf.quote([symbol]), 10000)
    const q = quotes[0]
    if (!q) return null
    const result: IndexQuote = {
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }
    setCachedIndex(symbol, result)
    return result
  } catch (error) {
    console.error(`fetchIndexQuote(${symbol}) failed:`, error instanceof Error ? error.message : error)
    return null
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Map<string, YFQuote>> {
  const map = new Map<string, YFQuote>()
  if (symbols.length === 0) return map

  try {
    const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] })
    const jkSymbols = symbols.map((s) => s + ".JK")
    const quotes = await withRetry(() => yf.quote(jkSymbols), 20000)
    for (const q of quotes) {
      const code = stripJk(q.symbol)
      map.set(code, {
        price: q.regularMarketPrice ?? undefined,
        change: q.regularMarketChange ?? undefined,
        changePercent: q.regularMarketChangePercent ?? undefined,
        volume: q.regularMarketVolume ?? undefined,
        marketCap: q.marketCap ?? undefined,
        name: q.shortName || undefined,
        trailingPE: q.trailingPE ?? undefined,
        priceToBook: q.priceToBook ?? undefined,
        trailingEps: q.epsTrailingTwelveMonths ?? undefined,
        dividendYield: q.dividendYield ?? undefined,
      })
    }
  } catch (error) {
    console.error("fetchQuotes failed:", error instanceof Error ? error.message : error)
  }

  return map
}

export async function fetchAggregatedQuotes(symbols: string[]): Promise<Map<string, YFQuote>> {
  const cacheKey = "quotes:" + [...symbols].sort().join(",")
  const cached = getCached<Map<string, YFQuote>>(cacheKey, 30000)
  if (cached) return cached

  const data = await fetchQuotes(symbols)
  if (data.size > 0) {
    setCache(cacheKey, data)
  } else {
    const stale = getStaleCached<Map<string, YFQuote>>(cacheKey)
    if (stale) return stale
  }
  return data
}

export async function fetchFundamentals(symbols: string[]): Promise<Map<string, YFFundamental>> {
  const map = new Map<string, YFFundamental>()
  if (symbols.length === 0) return map

  try {
    const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] })
    const jkSymbols = symbols.map((s) => s + ".JK")
    const results = await withRetry(() =>
      Promise.allSettled(
        jkSymbols.map((sym) =>
          yf.quoteSummary(sym, { modules: ["assetProfile", "financialData", "defaultKeyStatistics", "summaryDetail"] })
        )
      ), 30000
    )
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status !== "fulfilled" || !r.value) continue
      const s = r.value
      const code = symbols[i]
      const ap = s.assetProfile
      const fd = s.financialData
      const dks = s.defaultKeyStatistics
      const sd = s.summaryDetail

      const roe = fd?.returnOnEquity ?? null
      const bv = dks?.bookValue ?? null
      const shares = dks?.sharesOutstanding ?? null
      const td = fd?.totalDebt ?? null
      const equity = bv != null && shares != null ? bv * shares : null
      const der = equity != null && equity > 0 && td != null ? td / equity : null

      map.set(code, {
        sector: ap?.sector ?? null,
        industry: ap?.industry ?? null,
        returnOnEquity: roe,
        debtToEquity: der,
        trailingEps: dks?.trailingEps ?? null,
        forwardPE: dks?.forwardPE ?? null,
        priceToBook: dks?.priceToBook ?? null,
        dividendYield: sd?.dividendYield ?? null,
        marketCap: sd?.marketCap ?? dks?.enterpriseValue ?? fd?.currentPrice ?? null,
        revenueGrowth: fd?.revenueGrowth ?? null,
        earningsGrowth: fd?.earningsGrowth ?? null,
        bookValue: bv,
        totalDebt: td,
        heldPercentInstitutions: dks?.heldPercentInstitutions ?? null,
        beta: sd?.beta ?? null,
      })
    }
  } catch (error) {
    console.error("fetchFundamentals failed:", error instanceof Error ? error.message : error)
  }

  return map
}

export async function fetchAggregatedFundamentals(symbols: string[]): Promise<Map<string, YFFundamental>> {
  const cacheKey = "fundamentals:" + [...symbols].sort().join(",")
  const cached = getCached<Map<string, YFFundamental>>(cacheKey, 30000)
  if (cached) return cached

  const data = await fetchFundamentals(symbols)
  if (data.size > 0) {
    setCache(cacheKey, data)
  } else {
    const stale = getStaleCached<Map<string, YFFundamental>>(cacheKey)
    if (stale) return stale
  }
  return data
}

export interface YFHistorical {
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
  dates?: string[]
}

export async function fetchHistorical(symbol: string, range = "1y"): Promise<YFHistorical | null> {
  const cacheKey = `hist:${symbol}:${range}`
  const cached = getCached<YFHistorical>(cacheKey, 30000)
  if (cached) return cached

  try {
    const yf = new YahooFinance()
    const result = await withRetry(() =>
      yf.chart(symbol + ".JK", {
        period1: new Date(Date.now() - parseRange(range)),
        interval: "1d",
      })
    )
    if (!result.quotes || result.quotes.length < 20) return null

    const open: number[] = []
    const high: number[] = []
    const low: number[] = []
    const close: number[] = []
    const volume: number[] = []
    const dates: string[] = []

    for (const q of result.quotes) {
      if (q.open === null || q.high === null || q.low === null || q.close === null || q.volume === null) continue
      open.push(q.open)
      high.push(q.high)
      low.push(q.low)
      close.push(q.adjclose ?? q.close)
      volume.push(q.volume)
      dates.push(q.date instanceof Date ? q.date.toISOString().split("T")[0] : String(q.date))
    }

    if (close.length < 20) return null

    const cachedData = { open, high, low, close, volume, dates }
    setCache(cacheKey, cachedData)
    return cachedData
  } catch (error) {
    console.error(`fetchHistorical(${symbol}) failed:`, error instanceof Error ? error.message : error)
    const stale = getStaleCached<YFHistorical>(cacheKey)
    return stale
  }
}

export interface YFBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchHistoricalBars(symbol: string, range = "2y"): Promise<YFBar[]> {
  const cacheKey = `bars:${symbol}:${range}`
  const cached = getCached<YFBar[]>(cacheKey, 30000)
  if (cached) return cached

  try {
    const yf = new YahooFinance()
    const result = await withRetry(() =>
      yf.chart(symbol + ".JK", {
        period1: new Date(Date.now() - parseRange(range)),
        interval: "1d",
      })
    )
    if (!result.quotes) return []

    const bars: YFBar[] = []
    for (const q of result.quotes) {
      if (q.close === null || q.high === null || q.low === null || q.volume === null || q.open === null) continue
      bars.push({
        date: q.date instanceof Date ? q.date.toISOString().split("T")[0] : String(q.date),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.adjclose ?? q.close,
        volume: q.volume,
      })
    }
    if (bars.length < 50) return []

    setCache(cacheKey, bars)
    return bars
  } catch (error) {
    console.error(`fetchHistoricalBars(${symbol}) failed:`, error instanceof Error ? error.message : error)
    const stale = getStaleCached<YFBar[]>(cacheKey)
    return stale ?? []
  }
}
