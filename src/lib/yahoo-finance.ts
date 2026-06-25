const YF_BASE = "https://query1.finance.yahoo.com"

interface CacheEntry<T> {
  data: T
  ts: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && Date.now() - entry.ts < ttl) return entry.data
  return null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() })
}

async function yfFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`YF HTTP ${res.status}`)
  return res.json()
}

export interface YFQuote {
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  marketCap?: number
  name?: string
  sector?: string
  trailingPE?: number
  priceToBook?: number
  returnOnEquity?: number
  debtToEquity?: number
  trailingEps?: number
  dividendYield?: number
}

async function fetchSingleQuote(symbol: string): Promise<YFQuote> {
  const url = `${YF_BASE}/v10/finance/quoteSummary/${symbol}.JK?modules=price,summaryProfile,financialData,defaultKeyStatistics`
  const json = await yfFetch(url) as any
  const r = json?.quoteSummary?.result?.[0]
  if (!r) throw new Error(`No result for ${symbol}`)

  const p = r.price || {}
  const prof = r.summaryProfile || {}
  const fin = r.financialData || {}
  const stat = r.defaultKeyStatistics || {}

  return {
    price: p.regularMarketPrice?.raw,
    change: p.regularMarketChange?.raw,
    changePercent: p.regularMarketChangePercent?.raw,
    volume: p.regularMarketVolume?.raw,
    marketCap: p.marketCap?.raw ?? stat.marketCap?.raw,
    name: p.shortName || p.longName,
    sector: prof.sector,
    trailingPE: stat.trailingPE?.raw,
    priceToBook: stat.priceToBook?.raw,
    returnOnEquity: stat.returnOnEquity?.raw,
    debtToEquity: stat.debtToEquity?.raw,
    trailingEps: stat.trailingEps?.raw,
    dividendYield: stat.dividendYield?.raw,
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Map<string, YFQuote>> {
  const map = new Map<string, YFQuote>()
  const results = await Promise.allSettled(symbols.map(sym =>
    fetchSingleQuote(sym).then(q => ({ sym, q }))
  ))
  for (const r of results) {
    if (r.status === "fulfilled") map.set(r.value.sym, r.value.q)
  }
  return map
}

export async function fetchAggregatedQuotes(symbols: string[]): Promise<Map<string, YFQuote>> {
  const ttl = 60000
  const cacheKey = "quotes:" + symbols.sort().join(",")
  const cached = getCached<Map<string, YFQuote>>(cacheKey, ttl)
  if (cached) return cached

  const data = await fetchQuotes(symbols)
  setCache(cacheKey, data)
  return data
}

export interface YFHistorical {
  close: number[]
  high: number[]
  low: number[]
  volume: number[]
  dates?: string[]
}

export async function fetchHistorical(symbol: string, range = "1y"): Promise<YFHistorical | null> {
  const ttl = 300000
  const cacheKey = `hist:${symbol}:${range}`
  const cached = getCached<YFHistorical>(cacheKey, ttl)
  if (cached) return cached

  try {
    const url = `${YF_BASE}/v8/finance/chart/${symbol}.JK?range=${range}&interval=1d`
    const json = await yfFetch(url) as any
    const r = json?.chart?.result?.[0]
    if (!r?.indicators?.quote?.[0]) return null

    const q = r.indicators.quote[0]
    const timestamps = r.timestamp as number[] || []
    const adjclose = r.indicators.adjclose?.[0]?.adjclose as number[] | undefined
    const closes = q.close as (number | null)[] || []
    const highs = q.high as (number | null)[] || []
    const lows = q.low as (number | null)[] || []
    const volumes = q.volume as (number | null)[] || []

    const close: number[] = []
    const high: number[] = []
    const low: number[] = []
    const volume: number[] = []
    const dates: string[] = []

    for (let i = 0; i < closes.length; i++) {
      if (closes[i] === null || highs[i] === null || lows[i] === null || volumes[i] === null) continue
      close.push(adjclose?.[i] ?? closes[i]!)
      high.push(highs[i]!)
      low.push(lows[i]!)
      volume.push(volumes[i]!)
      if (timestamps[i]) dates.push(new Date(timestamps[i] * 1000).toISOString().split("T")[0])
    }

    if (close.length < 20) return null

    setCache(cacheKey, { close, high, low, volume })
    return { close, high, low, volume, dates }
  } catch {
    return null
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
  const ttl = 600000
  const cacheKey = `bars:${symbol}:${range}`
  const cached = getCached<YFBar[]>(cacheKey, ttl)
  if (cached) return cached

  try {
    const url = `${YF_BASE}/v8/finance/chart/${symbol}.JK?range=${range}&interval=1d`
    const json = await yfFetch(url) as any
    const r = json?.chart?.result?.[0]
    if (!r?.indicators?.quote?.[0]) return []

    const timestamps = (r.timestamp as number[]) || []
    const q = r.indicators.quote[0]
    const a = r.indicators.adjclose?.[0]?.adjclose as number[] | undefined
    const opens = (q.open as (number | null)[]) || []
    const highs = (q.high as (number | null)[]) || []
    const lows = (q.low as (number | null)[]) || []
    const closes = (q.close as (number | null)[]) || []
    const volumes = (q.volume as (number | null)[]) || []

    const bars: YFBar[] = []
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] === null || highs[i] === null || lows[i] === null || volumes[i] === null || opens[i] === null) continue
      bars.push({
        date: timestamps[i] ? new Date(timestamps[i] * 1000).toISOString().split("T")[0] : "",
        open: opens[i]!,
        high: highs[i]!,
        low: lows[i]!,
        close: a?.[i] ?? closes[i]!,
        volume: volumes[i]!,
      })
    }
    if (bars.length < 50) return []

    setCache(cacheKey, bars)
    return bars
  } catch {
    return []
  }
}
