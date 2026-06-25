"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Stock, TechnicalData, FundamentalData, FlowData } from "@/types"
import { formatCurrency } from "@/data/mock"
import { X, Send, Sparkles, TrendingUp, Search, Zap, BarChart3, Star } from "lucide-react"
import {
  scanAll, formatAnalysis, formatTopPicks, formatList,
  findUndervalued, findBreakoutSetups, findUnusualVolume, findForeignAccumulation,
  recommendStock, StockRecommendation,
} from "@/lib/analysis"

interface AIAssistantProps {
  open: boolean
  onClose: () => void
  selectedStock: Stock | null
  allStocks: Stock[]
  technicalData: Record<string, TechnicalData>
  fundamentalData: Record<string, FundamentalData>
  flowData: Record<string, FlowData>
}

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

const quickActions = [
  { id: "top_picks", label: "Top Picks", icon: Star, desc: "Best buy opportunities" },
  { id: "undervalued", label: "Undervalued", icon: Search, desc: "Low PE, strong fundamentals" },
  { id: "breakouts", label: "Breakouts", icon: TrendingUp, desc: "Momentum setups" },
  { id: "unusual_volume", label: "Volume Spike", icon: Zap, desc: "Unusual trading activity" },
  { id: "foreign_acc", label: "Foreign Acc.", icon: BarChart3, desc: "Foreign buying" },
]

export default function AIAssistant({ open, onClose, selectedStock, allStocks, technicalData, fundamentalData, flowData }: AIAssistantProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hello! I'm your AI stock analyst for IDX. I can scan the market for opportunities, analyze fundamentals, detect breakouts, and track foreign flows.\n\nTry the quick actions above or select a stock to analyze." },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [scanResult, setScanResult] = useState<ReturnType<typeof scanAll> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (selectedStock && open && allStocks.length) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last.role === "assistant" && last.text.includes(selectedStock.code)) return prev
        return [
          ...prev,
          { role: "user", text: `Analyze ${selectedStock.code}` },
          { role: "assistant", text: formatAnalysis(selectedStock, technicalData[selectedStock.code], fundamentalData[selectedStock.code], flowData[selectedStock.code]) },
        ]
      })
    }
  }, [selectedStock?.code])

  const addMessage = useCallback((text: string, role: "user" | "assistant" = "assistant") => {
    setMessages(prev => [...prev, { role, text }])
  }, [])

  const handleQuickAction = useCallback(async (actionId: string) => {
    const labels: Record<string, string> = {
      top_picks: "Show me your top stock picks",
      undervalued: "Find undervalued stocks",
      breakouts: "Find breakout setups",
      unusual_volume: "Find unusual volume",
      foreign_acc: "Find foreign accumulation",
    }

    addMessage(labels[actionId], "user")
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))

    const stocks = allStocks
    const techs = technicalData
    const funds = fundamentalData
    const flows = flowData

    let response = ""

    switch (actionId) {
      case "top_picks": {
        const scan = scanAll(stocks, techs, funds, flows)
        setScanResult(scan)
        response = formatTopPicks(scan.topPicks)
        if (scan.topPicks.length > 0) {
          response += "\n\n**Why these picks?**\nEach stock is scored on technical momentum (RSI, MACD, trend), fundamental value (PE, PBV, ROE), and foreign flow accumulation. Only stocks meeting all criteria earn a Buy rating."
        }
        break
      }
      case "undervalued": {
        const results = findUndervalued(stocks, funds)
        response = formatList("Undervalued Stocks", results)
        if (results.length > 0) {
          response += "\n**Methodology:** Scored on PE < 15, PBV < 3, ROE > 15%, low debt, and dividend yield. Higher score = better value."
        }
        break
      }
      case "breakouts": {
        const results = findBreakoutSetups(stocks, techs)
        response = formatList("Breakout Setups", results)
        if (results.length > 0) {
          response += "\n**Methodology:** Stocks above both MA50 & MA200, RSI in bullish range (50-70), positive MACD momentum, and price near upper Bollinger Band."
        }
        break
      }
      case "unusual_volume": {
        const results = findUnusualVolume(stocks, techs)
        response = formatList("Unusual Volume", results)
        if (results.length > 0) {
          response += "\n**Methodology:** Compares current volume to the market average. > 1.8x average suggests institutional activity or news-driven moves."
        }
        break
      }
      case "foreign_acc": {
        const results = findForeignAccumulation(stocks, flows)
        response = formatList("Foreign Accumulation", results)
        if (results.length > 0) {
          response += "\n**Methodology:** Tracks net foreign buy value, buy-to-sell ratio, and price action confirmation. Higher scores indicate strong institutional accumulation."
        }
        break
      }
    }

    setIsTyping(false)
    addMessage(response)
  }, [allStocks, technicalData, fundamentalData, flowData, addMessage])

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")

    addMessage(userMsg, "user")
    setIsTyping(true)

    const lower = userMsg.toLowerCase()

    setTimeout(() => {
      let response = ""
      const stocks = allStocks
      const techs = technicalData
      const funds = fundamentalData
      const flows = flowData

      if (lower.includes("top") || lower.includes("best") || lower.includes("pick")) {
        const scan = scanAll(stocks, techs, funds, flows)
        setScanResult(scan)
        response = formatTopPicks(scan.topPicks)
      } else if (lower.includes("undervalued") || lower.includes("value")) {
        response = formatList("Undervalued Stocks", findUndervalued(stocks, funds))
      } else if (lower.includes("breakout") || lower.includes("momentum")) {
        response = formatList("Breakout Setups", findBreakoutSetups(stocks, techs))
      } else if (lower.includes("volume") || lower.includes("unusual") || lower.includes("spike")) {
        response = formatList("Unusual Volume", findUnusualVolume(stocks, techs))
      } else if (lower.includes("foreign") || lower.includes("accumulation") || lower.includes("institutional")) {
        response = formatList("Foreign Accumulation", findForeignAccumulation(stocks, flows))
      } else if (lower.includes("gain") || lower.includes("top gain")) {
        const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
        response = `**Top Gainers Today**\n\n${sorted.map(s =>
          `• **${s.code}**: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}% → Rp ${s.price.toLocaleString("id-ID")}`
        ).join("\n")}`
      } else if (lower.includes("loser") || lower.includes("worst")) {
        const sorted = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5)
        response = `**Top Losers Today**\n\n${sorted.map(s =>
          `• **${s.code}**: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}% → Rp ${s.price.toLocaleString("id-ID")}`
        ).join("\n")}`
      } else if (lower.includes("syariah") || lower.includes("sharia")) {
        const syariah = stocks.filter(s => s.isSyariah)
        const top = [...syariah].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
        response = `**Top Syariah Stocks**\n\n${top.map(s =>
          `• **${s.code}**: Rp ${s.price.toLocaleString("id-ID")} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`
        ).join("\n")}\n\n${syariah.length} of ${stocks.length} stocks are Syariah-compliant.`
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("help")) {
        response = "I can help with:\n• **Top Picks** — Best buy opportunities\n• **Undervalued** — Value stocks\n• **Breakouts** — Momentum setups\n• **Foreign Accumulation** — Institutional buying\n• **Stock analysis** — Select any stock\n\nTry the buttons above or type a question!"
      } else if (selectedStock && (lower.includes(selectedStock.code.toLowerCase()) || lower.includes("analyze") || lower.includes("this"))) {
        response = formatAnalysis(selectedStock, techs[selectedStock.code], funds[selectedStock.code], flows[selectedStock.code])
      } else if (stocks.some(s => lower.includes(s.code.toLowerCase()))) {
        const found = stocks.find(s => lower.includes(s.code.toLowerCase()))
        if (found) response = formatAnalysis(found, techs[found.code], funds[found.code], flows[found.code])
      } else {
        response = `I monitor **${stocks.length}** IDX stocks. Try:\n• "top picks"\n• "undervalued"\n• "breakouts"\n• "foreign accumulation"\n• Or ask about a specific stock`
      }

      setIsTyping(false)
      addMessage(response)
    }, 500 + Math.random() * 500)
  }, [input, allStocks, selectedStock, technicalData, fundamentalData, flowData, addMessage])

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />}

      <div className={`fixed top-0 right-0 z-40 h-full w-[400px] max-w-[calc(100vw-48px)] bg-[#0a0b10] border-l border-border/50 shadow-2xl flex flex-col transition-all duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
            <Sparkles size={14} className="text-accent-light" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-primary">AI Analyst</h3>
            <p className="text-[10px] text-text-muted/60 truncate">
              {selectedStock ? `Analyzing ${selectedStock.code}` : `${allStocks.length} IDX stocks tracked`}
              {allStocks.length > 0 && !selectedStock ? ` • ${allStocks.filter(s => s.isSyariah).length} Syariah` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-text-muted/60 hover:text-text-primary hover:bg-surface-50/50 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pt-3 pb-1.5 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
          {quickActions.map(qa => (
            <button
              key={qa.id}
              onClick={() => handleQuickAction(qa.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/5 border border-accent/10 text-accent-light hover:bg-accent/10 transition-all shrink-0 text-[11px] font-medium"
              title={qa.desc}
            >
              <qa.icon size={12} />
              {qa.label}
            </button>
          ))}
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
              <div className={`max-w-[92%] p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-accent/10 text-accent-light border border-accent/20"
                  : "bg-[#0c0d14] text-text-secondary border border-border/30"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-[#0c0d14] border border-border/30 rounded-xl p-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse-dot" />
                <span className="text-[10px] text-text-muted/60 ml-1">Analyzing...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border/50 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask about stocks..."
              className="flex-1 h-9 bg-[#0c0d14] border border-border/40 rounded-lg px-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center disabled:opacity-30 hover:bg-accent-light transition-all shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
