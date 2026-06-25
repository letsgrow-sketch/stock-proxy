"use client"

interface SyariahToggleProps {
  enabled: boolean
  onChange: (v: boolean) => void
}

export default function SyariahToggle({ enabled, onChange }: SyariahToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
        enabled
          ? "bg-green/10 border-green/30 text-green"
          : "bg-surface-50 border-border text-text-muted hover:text-text-secondary"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 12a6 6 0 0 1 6-6" />
        <path d="M12 12a6 6 0 0 0 6 6" />
      </svg>
      Syariah
    </button>
  )
}
