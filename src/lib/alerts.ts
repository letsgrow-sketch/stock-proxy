import { AlertRule, AlertEvent, AlertType, Stock, TechnicalData, FlowData } from "@/types"

const RULES_KEY = "stock-alert-rules"
const EVENTS_KEY = "stock-alert-events"
const TRIGGERED_KEY = "stock-alert-triggered"

export function loadRules(): AlertRule[] {
  if (typeof window === "undefined") return getDefaultRules()
  try {
    const raw = localStorage.getItem(RULES_KEY)
    return raw ? JSON.parse(raw) : getDefaultRules()
  } catch { return getDefaultRules() }
}

export function saveRules(rules: AlertRule[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)) } catch {}
}

export function loadEvents(): AlertEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveEvents(events: AlertEvent[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)) } catch {}
}

function loadTriggered(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(TRIGGERED_KEY)
    const today = new Date().toDateString()
    if (!raw) return new Set()
    const data = JSON.parse(raw)
    if (data.date !== today) {
      localStorage.removeItem(TRIGGERED_KEY)
      return new Set()
    }
    return new Set(data.ids as string[])
  } catch { return new Set() }
}

function saveTriggered(ids: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(TRIGGERED_KEY, JSON.stringify({
      date: new Date().toDateString(),
      ids: Array.from(ids),
    }))
  } catch {}
}

export function getDefaultRules(): AlertRule[] {
  const types: { type: AlertType; label: string }[] = [
    { type: "breakout", label: "Breakout" },
    { type: "volume_spike", label: "Volume Spike" },
    { type: "foreign_accumulation", label: "Foreign Accumulation" },
    { type: "rsi_oversold", label: "RSI Oversold" },
    { type: "rsi_overbought", label: "RSI Overbought" },
    { type: "macd_crossover", label: "MACD Crossover" },
    { type: "golden_cross", label: "Golden Cross" },
    { type: "death_cross", label: "Death Cross" },
  ]
  return types.map(t => ({
    id: `rule-${t.type}`,
    type: t.type,
    label: t.label,
    stockCode: "",
    enabled: false,
    createdAt: new Date().toISOString(),
  }))
}

export function runAlerts(
  rules: AlertRule[],
  stocks: Stock[],
  technicalData: Record<string, TechnicalData>,
  flowData: Record<string, FlowData>,
): AlertEvent[] {
  const now = new Date()
  const triggeredIds = loadTriggered()
  const newEvents: AlertEvent[] = []
  const todayStr = now.toISOString()

  for (const rule of rules) {
    if (!rule.enabled) continue

    let targetStocks = stocks
    if (rule.stockCode) {
      targetStocks = targetStocks.filter(s => s.code === rule.stockCode)
    }

    for (const stock of targetStocks) {
      const triggerKey = `${rule.id}:${stock.code}`
      if (triggeredIds.has(triggerKey)) continue

      const tech = technicalData[stock.code]
      const flow = flowData[stock.code]
      let triggered = false
      let message = ""
      let details = ""

      switch (rule.type) {
        case "breakout":
          if (tech && stock.price > tech.ma50 && stock.price > tech.ma200 && tech.rsi > 45 && tech.rsi < 75 && tech.macd.histogram > 0) {
            const bbPos = (stock.price - tech.bb.lower) / (tech.bb.upper - tech.bb.lower)
            if (bbPos > 0.6) {
              triggered = true
              message = `${stock.code} breakout detected`
              details = `Price Rp ${stock.price.toLocaleString("id-ID")} above MA50 (${tech.ma50.toLocaleString("id-ID")}) & MA200 (${tech.ma200.toLocaleString("id-ID")}) · RSI ${tech.rsi.toFixed(1)} · MACD+`
            }
          }
          break

        case "volume_spike": {
          const avgVol = stocks.reduce((s, st) => s + st.volume, 0) / Math.max(stocks.length, 1)
          if (stock.volume > avgVol * 2) {
            triggered = true
            const ratio = (stock.volume / avgVol).toFixed(1)
            message = `${stock.code} volume spike (${ratio}x)`
            details = `Volume ${stock.volume.toLocaleString("id-ID")} vs avg ${Math.round(avgVol).toLocaleString("id-ID")} · ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`
          }
          break
        }

        case "foreign_accumulation":
          if (flow && flow.netForeign > 0 && flow.foreignBuy > flow.foreignSell * 1.3) {
            triggered = true
            message = `${stock.code} foreign accumulation`
            details = `Net buy Rp ${flow.netForeign.toLocaleString("id-ID")} · Buy ${flow.foreignBuy.toLocaleString("id-ID")} / Sell ${flow.foreignSell.toLocaleString("id-ID")}`
          }
          break

        case "rsi_oversold":
          if (tech && tech.rsi < 30) {
            triggered = true
            message = `${stock.code} RSI oversold (${tech.rsi.toFixed(1)})`
            details = `RSI ${tech.rsi.toFixed(1)} — potential bounce · Price Rp ${stock.price.toLocaleString("id-ID")} · ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`
          }
          break

        case "rsi_overbought":
          if (tech && tech.rsi > 70) {
            triggered = true
            message = `${stock.code} RSI overbought (${tech.rsi.toFixed(1)})`
            details = `RSI ${tech.rsi.toFixed(1)} — caution · Price Rp ${stock.price.toLocaleString("id-ID")} · ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`
          }
          break

        case "macd_crossover":
          if (tech && tech.macd.histogram > 0 && tech.rsi > 40) {
            triggered = true
            message = `${stock.code} MACD bullish crossover`
            details = `MACD ${tech.macd.value.toFixed(1)} · Signal ${tech.macd.signal.toFixed(1)} · Histogram ${tech.macd.histogram.toFixed(1)} · RSI ${tech.rsi.toFixed(1)}`
          }
          break

        case "golden_cross":
          if (tech && stock.price > tech.ma50 && tech.ma50 > tech.ma200) {
            triggered = true
            message = `${stock.code} golden cross`
            details = `Price Rp ${stock.price.toLocaleString("id-ID")} > MA50 ${tech.ma50.toLocaleString("id-ID")} > MA200 ${tech.ma200.toLocaleString("id-ID")} · Uptrend confirmation`
          }
          break

        case "death_cross":
          if (tech && stock.price < tech.ma50 && tech.ma50 < tech.ma200) {
            triggered = true
            message = `${stock.code} death cross`
            details = `Price Rp ${stock.price.toLocaleString("id-ID")} < MA50 ${tech.ma50.toLocaleString("id-ID")} < MA200 ${tech.ma200.toLocaleString("id-ID")} · Downtrend signal`
          }
          break
      }

      if (triggered) {
        triggeredIds.add(triggerKey)
        newEvents.push({
          id: crypto.randomUUID(),
          ruleId: rule.id,
          type: rule.type,
          stockCode: stock.code,
          stockName: stock.name,
          sector: stock.sector,
          price: stock.price,
          changePercent: stock.changePercent,
          message,
          details,
          timestamp: todayStr,
          read: false,
        })
      }
    }
  }

  saveTriggered(triggeredIds)
  return newEvents
}

export const ALERT_LABELS: Record<AlertType, { label: string; icon: string; desc: string }> = {
  breakout: { label: "Breakout", icon: "📈", desc: "Price breaks above MA50, MA200 with RSI momentum" },
  volume_spike: { label: "Volume Spike", icon: "📊", desc: "Volume > 2x average" },
  foreign_accumulation: { label: "Foreign Accumulation", icon: "🌍", desc: "Foreign net buy with strong buy ratio" },
  rsi_oversold: { label: "RSI Oversold", icon: "📉", desc: "RSI drops below 30 — potential bounce" },
  rsi_overbought: { label: "RSI Overbought", icon: "📈", desc: "RSI rises above 70 — caution" },
  macd_crossover: { label: "MACD Crossover", icon: "🔄", desc: "MACD histogram turns positive" },
  golden_cross: { label: "Golden Cross", icon: "✨", desc: "Price > MA50 > MA200 — uptrend" },
  death_cross: { label: "Death Cross", icon: "💀", desc: "Price < MA50 < MA200 — downtrend" },
  syariah: { label: "Syariah", icon: "🕌", desc: "Syariah-compliant stocks" },
}
