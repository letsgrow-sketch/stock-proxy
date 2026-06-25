import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getNotificationChannels } from "@/lib/db"
import { sendNotification, formatAlertMessage, type ChannelConfig } from "@/lib/notifications"

export async function POST(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { type } = await req.json()
  if (!type) return NextResponse.json({ error: "Channel type required" }, { status: 400 })

  const channels = await getNotificationChannels(user.id)
  const channel = channels.find(c => c.type === type && c.enabled)
  if (!channel) return NextResponse.json({ error: "Channel not found or not enabled" }, { status: 404 })

  const testMsg = formatAlertMessage("breakout", "BBCA", "Bank Central Asia", 10250, 1.25, "Test notification from IDX Screener")

  const result = await sendNotification(
    { type: channel.type as ChannelConfig["type"], enabled: true, config: JSON.parse(channel.config || "{}") },
    testMsg,
  )

  return NextResponse.json(result)
}
