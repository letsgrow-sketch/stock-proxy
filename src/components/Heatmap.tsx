"use client"

import { SectorData } from "@/types"
import { formatPercent } from "@/data/mock"

interface HeatmapProps {
  sectors: SectorData[]
  selectedSector: string | null
  onSectorSelect: (name: string | null) => void
}

export default function Heatmap({ sectors, selectedSector, onSectorSelect }: HeatmapProps) {
  const absMax = Math.max(...sectors.map(s => Math.abs(s.change)), 1)

  const getIntensityBg = (val: number) => {
    if (val === 0) return "#0c0d14"
    const intensity = Math.min(Math.abs(val) / absMax, 1)
    const alpha = Math.round(intensity * 20) / 100
    if (val > 0) return `rgba(34,197,94,${alpha})`
    return `rgba(239,68,68,${alpha})`
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Sector Performance</h2>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {selectedSector && (
            <button onClick={() => onSectorSelect(null)}
              className="text-accent-light hover:underline text-[11px]">
              Clear filter
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green" />
            <span>Bullish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red" />
            <span>Bearish</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {sectors.map(sector => {
          const isSelected = selectedSector === sector.name
          return (
            <div
              key={sector.name}
              onClick={() => onSectorSelect(isSelected ? null : sector.name)}
              className={`rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? "border-accent/50 scale-[1.03]"
                  : "border-border/40 hover:scale-[1.02] hover:border-border/60"
              }`}
              style={{ background: getIntensityBg(sector.change) }}
            >
              <p className="text-sm font-medium text-text-primary">{sector.name}</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-xl font-bold font-mono tracking-tight ${sector.change >= 0 ? "text-green" : "text-red"}`}>
                  {formatPercent(sector.change)}
                </span>
                <span className="text-[11px] text-text-muted/60">{sector.stocks.length} stocks</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {sector.stocks.slice(0, 5).map(stock => (
                  <span
                    key={stock.code}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      stock.change >= 0 ? "bg-green/10 text-green" : "bg-red/10 text-red"
                    }`}
                  >
                    {stock.code} {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(1)}%
                  </span>
                ))}
                {sector.stocks.length > 5 && (
                  <span className="text-[10px] text-text-muted/50 px-1">+{sector.stocks.length - 5}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
