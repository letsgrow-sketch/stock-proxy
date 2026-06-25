"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  Bell, Mail, MessageCircle, Globe, Monitor, ChevronDown, ChevronUp,
  Check, X, Send, Loader2, Smartphone, Webhook,
} from "lucide-react"

interface ChannelConfig {
  id?: string
  type: string
  enabled: boolean
  config: Record<string, string>
}

interface RuleMapping {
  id?: string
  eventType: string
  channels: string[]
}

const EVENT_TYPES = [
  { id: "breakout", label: "Breakouts", icon: "🚀" },
  { id: "foreign_accumulation", label: "Foreign Accumulation", icon: "🌍" },
  { id: "volume_spike", label: "Volume Spike", icon: "📊" },
  { id: "rsi_oversold", label: "RSI Oversold", icon: "📉" },
  { id: "rsi_overbought", label: "RSI Overbought", icon: "📈" },
  { id: "macd_crossover", label: "MACD Crossover", icon: "🔀" },
  { id: "golden_cross", label: "Golden Cross", icon: "✨" },
  { id: "death_cross", label: "Death Cross", icon: "⚠️" },
  { id: "price_target", label: "Price Target", icon: "🎯" },
]

const CHANNEL_TYPES = [
  { id: "email", label: "Email", icon: Mail, desc: "SMTP or SendGrid" },
  { id: "telegram", label: "Telegram", icon: MessageCircle, desc: "Bot API" },
  { id: "whatsapp", label: "WhatsApp", icon: Smartphone, desc: "Twilio or API" },
  { id: "browser", label: "Browser Push", icon: Monitor, desc: "Web Push API" },
]

export default function NotificationSettings({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [channels, setChannels] = useState<ChannelConfig[]>([])
  const [rules, setRules] = useState<RuleMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ channel: string; ok?: boolean; error?: string } | null>(null)
  const [browserSupported, setBrowserSupported] = useState(false)
  const [pushSub, setPushSub] = useState<PushSubscription | null>(null)

  useEffect(() => {
    setBrowserSupported("serviceWorker" in navigator && "PushManager" in window)
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [chRes, ruRes] = await Promise.all([
        fetch("/api/notifications/channels"),
        fetch("/api/notifications/rules"),
      ])
      const chData = await chRes.json()
      const ruData = await ruRes.json()
      setChannels(chData.items || [])
      setRules(ruData.items || [])
    } catch (err) {
      console.error("Failed to load notification settings", err)
    }
    setLoading(false)
  }

  function getChannel(type: string): ChannelConfig {
    return channels.find(c => c.type === type) || { type, enabled: false, config: {} }
  }

  function getRuleChannels(eventType: string): string[] {
    return rules.find(r => r.eventType === eventType)?.channels || []
  }

  async function toggleChannel(type: string, enabled: boolean) {
    setSaving(`channel-${type}`)
    try {
      const existing = getChannel(type)
      const res = await fetch("/api/notifications/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, enabled, config: existing.config }),
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(prev => {
          const idx = prev.findIndex(c => c.type === type)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = data.channel
            return updated
          }
          return [...prev, data.channel]
        })
      }
    } catch (err) {
      console.error(err)
    }
    setSaving(null)
  }

  async function saveChannelConfig(type: string, config: Record<string, string>) {
    setSaving(`config-${type}`)
    const existing = getChannel(type)
    const res = await fetch("/api/notifications/channels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, enabled: existing.enabled, config }),
    })
    if (res.ok) {
      const data = await res.json()
      setChannels(prev => {
        const idx = prev.findIndex(c => c.type === type)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = data.channel
          return updated
        }
        return [...prev, data.channel]
      })
    }
    setSaving(null)
  }

  async function toggleRuleChannel(eventType: string, channelType: string) {
    setSaving(`rule-${eventType}`)
    const current = getRuleChannels(eventType)
    const updated = current.includes(channelType)
      ? current.filter(c => c !== channelType)
      : [...current, channelType]
    const res = await fetch("/api/notifications/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, channels: updated }),
    })
    if (res.ok) {
      const data = await res.json()
      setRules(prev => {
        const idx = prev.findIndex(r => r.eventType === eventType)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = data.mapping
          return updated
        }
        return [...prev, data.mapping]
      })
    }
    setSaving(null)
  }

  async function sendTest(type: string) {
    setTestResult({ channel: type })
    const res = await fetch("/api/notifications/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
    const data = await res.json()
    setTestResult({ channel: type, ok: data.ok, error: data.error })
    setTimeout(() => setTestResult(null), 5000)
  }

  async function registerPush() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BEl62iUYgUvdLTMHcTqJqCbCgJXXRlCgLQJkQYJkYJkYJkYJkYJkYJkYJkYJkYJkYJkYJkYJkYJkYJk"),
      })
      setPushSub(sub)
      await saveChannelConfig("browser", {
        subscription: JSON.stringify(sub.toJSON()),
      })
    } catch (err) {
      console.error("Push registration failed", err)
    }
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-[#13151d] border border-border/50 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
          <Bell size={32} className="text-text-muted mx-auto mb-3" />
          <h3 className="text-text-primary font-bold mb-2">Sign In Required</h3>
          <p className="text-text-muted text-sm mb-4">Sign in to configure notification channels.</p>
          <button onClick={onClose} className="text-accent text-sm hover:underline">Close</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <div className="bg-[#13151d] border border-border/50 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <Bell size={18} className="text-accent-light" />
              <h2 className="text-text-primary font-bold text-base">Notification Settings</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-text-muted/60 hover:text-text-primary hover:bg-surface-50/50 transition-all">
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto p-5 space-y-6">
            <p className="text-text-muted text-xs leading-relaxed">
              Configure notification channels and choose which events trigger alerts. Each channel requires
              its own credentials — these are stored securely and used only to send you notifications.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="text-accent animate-spin" />
                <span className="text-text-muted text-sm ml-2">Loading settings...</span>
              </div>
            ) : (
              <>
                <section>
                  <h3 className="text-text-primary text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Webhook size={14} className="text-accent-light" />
                    Channels
                  </h3>
                  <div className="space-y-2">
                    {CHANNEL_TYPES.map(ct => {
                      const ch = getChannel(ct.id)
                      const isExpanded = expandedChannel === ct.id
                      return (
                        <div key={ct.id} className="bg-[#0c0d14] border border-border/30 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ch.enabled ? "bg-accent/10" : "bg-surface-50/50"}`}>
                              <ct.icon size={16} className={ch.enabled ? "text-accent-light" : "text-text-muted/60"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-text-primary text-sm font-medium">{ct.label}</div>
                              <div className="text-text-muted/60 text-[10px]">{ch.enabled ? "Enabled" : "Disabled"} · {ct.desc}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {saving === `channel-${ct.id}` ? (
                                <Loader2 size={14} className="text-accent animate-spin" />
                              ) : (
                                <button
                                  onClick={() => toggleChannel(ct.id, !ch.enabled)}
                                  className={`relative w-9 h-5 rounded-full transition-colors ${ch.enabled ? "bg-accent" : "bg-[#2a2c35]"}`}
                                >
                                  <div className={`absolute w-3.5 h-3.5 rounded-full bg-white top-0.5 transition-all ${ch.enabled ? "left-[18px]" : "left-[2px]"}`} />
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedChannel(isExpanded ? null : ct.id)}
                                className="p-1 rounded text-text-muted/60 hover:text-text-primary"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-border/20">
                              <ChannelConfigForm
                                channelType={ct.id}
                                config={ch.config}
                                saving={saving === `config-${ct.id}`}
                                onSave={(config) => saveChannelConfig(ct.id, config)}
                                onTest={() => sendTest(ct.id)}
                                testResult={testResult?.channel === ct.id ? testResult : null}
                                onRegisterPush={ct.id === "browser" ? registerPush : undefined}
                                pushSub={pushSub}
                                browserSupported={browserSupported}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-text-primary text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Bell size={14} className="text-accent-light" />
                    Event Rules — which channels to notify
                  </h3>
                  <div className="space-y-1.5">
                    {EVENT_TYPES.map(et => {
                      const activeChannels = getRuleChannels(et.id)
                      return (
                        <div key={et.id} className="flex items-center gap-3 px-4 py-2.5 bg-[#0c0d14] border border-border/30 rounded-lg">
                          <span className="text-sm w-5 text-center">{et.icon}</span>
                          <span className="text-text-primary text-xs flex-1">{et.label}</span>
                          <div className="flex items-center gap-2">
                            {CHANNEL_TYPES.map(ct => {
                              const isActive = activeChannels.includes(ct.id)
                              return (
                                <label key={ct.id} className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={() => toggleRuleChannel(et.id, ct.id)}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] transition-all ${
                                    isActive ? "bg-accent text-white" : "bg-[#2a2c35] text-text-muted/40"
                                  }`}>
                                    {ct.icon({ size: 10 })}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                          {saving === `rule-${et.id}` && <Loader2 size={12} className="text-accent animate-spin shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t border-border/50 shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-light transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ChannelConfigForm({
  channelType, config, saving, onSave, onTest, testResult, onRegisterPush, pushSub, browserSupported,
}: {
  channelType: string
  config: Record<string, string>
  saving: boolean
  onSave: (config: Record<string, string>) => void
  onTest: () => void
  testResult: { ok?: boolean; error?: string } | null
  onRegisterPush?: () => void
  pushSub: PushSubscription | null
  browserSupported: boolean
}) {
  const [local, setLocal] = useState<Record<string, string>>({ ...config })

  const fields = getFieldsForChannel(channelType)

  return (
    <div className="space-y-2.5 pt-3">
      {channelType === "browser" ? (
        <div>
          {pushSub ? (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Check size={14} />
              Push notifications active
            </div>
          ) : onRegisterPush ? (
            <button
              onClick={onRegisterPush}
              disabled={!browserSupported}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-xs hover:bg-accent/20 transition-all disabled:opacity-40"
            >
              <Monitor size={12} />
              Enable Browser Push
            </button>
          ) : null}
          {!browserSupported && (
            <p className="text-text-muted/60 text-[10px] mt-1">Push not supported in this browser</p>
          )}
        </div>
      ) : (
        <>
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-text-muted text-[10px] block mb-1">{f.label}</label>
              <input
                type={f.isPassword ? "password" : "text"}
                value={local[f.key] || ""}
                onChange={e => setLocal(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full h-8 bg-[#0a0b10] border border-border/30 rounded-lg px-2.5 text-xs text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSave(local)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[10px] font-medium hover:bg-accent-light transition-all disabled:opacity-40"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Save
            </button>
            <button
              onClick={onTest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2c35] text-text-secondary text-[10px] hover:bg-[#353845] transition-all"
            >
              <Send size={10} />
              Send Test
            </button>
            {testResult && (
              <span className={`text-[10px] ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
                {testResult.ok ? "Sent!" : testResult.error || "Failed"}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function getFieldsForChannel(type: string): { key: string; label: string; placeholder: string; isPassword?: boolean }[] {
  switch (type) {
    case "email":
      return [
        { key: "emailTo", label: "Recipient Email", placeholder: "you@example.com" },
        { key: "emailFrom", label: "From (optional)", placeholder: "noreply@idx-screener.app" },
        { key: "smtpHost", label: "SMTP Host (optional)", placeholder: "smtp.sendgrid.net" },
        { key: "smtpPort", label: "SMTP Port", placeholder: "587" },
        { key: "smtpUser", label: "SMTP User", placeholder: "apikey" },
        { key: "smtpPass", label: "SMTP Password / API Key", placeholder: "SG.xxxxx", isPassword: true },
      ]
    case "telegram":
      return [
        { key: "telegramBotToken", label: "Bot Token", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u23ew11", isPassword: true },
        { key: "telegramChatId", label: "Chat ID", placeholder: "-1001234567890" },
      ]
    case "whatsapp":
      return [
        { key: "whatsappPhone", label: "Phone Number (with country code)", placeholder: "+6281234567890" },
        { key: "whatsappApiKey", label: "API Key (Twilio SID or API key)", placeholder: "ACxxxxxxxxxx", isPassword: true },
        { key: "whatsappApiUrl", label: "API URL (optional)", placeholder: "https://api.twilio.com/2010-04-01" },
      ]
    default:
      return []
  }
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i)
  }
  return arr
}
