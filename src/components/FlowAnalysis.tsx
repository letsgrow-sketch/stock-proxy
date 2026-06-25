"use client"

import { useState, useMemo } from "react"
import { Stock, FlowData } from "@/types"
import { formatCurrency, formatPercent } from "@/data/mock"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface FlowAnalysisProps {
  stocks: Stock[]
  flowData: Record<string, FlowData>
}

export default function FlowAnalysis({ stocks, flowData }: FlowAnalysisProps) {
  const [sortBy, setSortBy] = useState<"netForeign" | "volume">("netForeign")

  const sorted = useMemo(() => {
    const entries = stocks
      .filter(s => flowData[s.code])
      .map(s => ({ stock: s, flow: flowData[s.code] }))
    entries.sort((a, b) => Math.abs(b.flow[sortBy]) - Math.abs(a.flow[sortBy]))
    return entries
  }, [stocks, sortBy, flowData])

  const totalNetForeign = sorted.reduce((sum, e) => sum + e.flow.netForeign, 0)

  const Row = ({ stock, flow }: { stock: Stock; flow: FlowData }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-[#0c0d14] hover:bg-[#0c0d14]/80 hover:border-border/50 transition-all duration-150">
      <div className="w-24 shrink-0">
        <span className="font-semibold text-sm text-text-primary">{stock.code}</span>
        <span className={`ml-1.5 text-[10px] font-medium ${stock.changePercent >= 0 ? "text-green" : "text-red"}`}>
          {formatPercent(stock.changePercent)}
        </span>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">Buy</span>
          <p className="font-mono text-green font-medium mt-0.5">{formatCurrency(flow.foreignBuy)}</p>
        </div>
        <div>
          <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">Sell</span>
          <p className="font-mono text-red font-medium mt-0.5">{formatCurrency(flow.foreignSell)}</p>
        </div>
        <div>
          <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">Net</span>
          <p className={`font-mono font-bold flex items-center gap-1 mt-0.5 ${flow.netForeign >= 0 ? "text-green" : "text-red"}`}>
            {flow.netForeign >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatCurrency(Math.abs(flow.netForeign))}
          </p>
        </div>
      </div>
      <div className="w-24 text-right shrink-0">
        <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">Volume</span>
        <p className="font-mono text-text-primary text-xs mt-0.5">{formatCurrency(flow.volume)}</p>
      </div>
      <div className="w-20 text-right shrink-0">
        <div className={`inline-flex px-2 py-1 rounded text-[10px] font-semibold ${flow.netForeign >= 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"}`}>
          {flow.netForeign >= 0 ? "Net Buy" : "Net Sell"}
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Flow Analysis</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-muted/60">
            Net Foreign:
            <span className={`ml-1 font-mono font-semibold ${totalNetForeign >= 0 ? "text-green" : "text-red"}`}>
              {formatCurrency(totalNetForeign)}
            </span>
          </span>
          <button
            onClick={() => setSortBy(s => s === "netForeign" ? "volume" : "netForeign")}
            className="px-2.5 py-1.5 rounded-lg bg-[#0c0d14] border border-border/40 text-text-muted hover:text-text-primary hover:border-border/60 transition-all duration-150"
          >
            Sort: {sortBy === "netForeign" ? "Net Foreign" : "Volume"}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-4 px-3 py-2 text-[10px] text-text-muted/50 uppercase tracking-wider font-medium">
          <span className="w-24">Stock</span>
          <span className="flex-1 grid grid-cols-3 gap-4">Foreign Flow</span>
          <span className="w-24 text-right">Volume</span>
          <span className="w-20 text-right">Signal</span>
        </div>
        {sorted.map(e => <Row key={e.stock.code} {...e} />)}
      </div>
    </div>
  )
}
