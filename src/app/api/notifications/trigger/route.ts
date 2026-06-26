import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getNotificationChannels, getNotificationRuleMappings } from "@/lib/db"
import { sendNotification, formatAlertMessage, type ChannelConfig } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { eventType, stockCode, stockName, price, changePercent, details } = await req.json()
    if (!eventType || !stockCode) {
      return NextResponse.json({ error: "eventType and stockCode required" }, { status: 400 })
    }

    const mappings = await getNotificationRuleMappings(user.id)
    const mapping = mappings.find(m => m.eventType === eventType)
    if (!mapping) return NextResponse.json({ skipped: true, reason: "No rule mapping for this event type" })

    const enabledChannels: string[] = JSON.parse(mapping.channels || "[]")
    if (enabledChannels.length === 0) return NextResponse.json({ skipped: true, reason: "No channels enabled for this rule" })

    const allChannels = await getNotificationChannels(user.id)
    const results: { channel: string; ok: boolean; error?: string }[] = []

    const msg = formatAlertMessage(eventType, stockCode, stockName, price || 0, changePercent || 0, details)

    for (const channel of allChannels) {
      if (!channel.enabled || !enabledChannels.includes(channel.type)) continue
      const result = await sendNotification(
        { type: channel.type as ChannelConfig["type"], enabled: true, config: JSON.parse(channel.config || "{}") },
        msg,
      )
      results.push({ channel: channel.type, ...result })
    }

    return NextResponse.json({ sent: results.length, results })
  } catch (error) {
    console.error("/api/notifications/trigger error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
