import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getNotificationChannels, setNotificationChannel, deleteNotificationChannel } from "@/lib/db"
import { sendNotification, formatAlertMessage, type ChannelConfig } from "@/lib/notifications"

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ items: [] })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ items: [] })
    const channels = await getNotificationChannels(user.id)
    return NextResponse.json({
      items: channels.map(c => ({
        id: c.id,
        type: c.type,
        enabled: c.enabled,
        config: JSON.parse(c.config || "{}"),
      })),
    })
  } catch (error) {
    console.error("/api/notifications/channels error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const body = await req.json()
    if (!body.type) return NextResponse.json({ error: "Channel type required" }, { status: 400 })
    const channel = await setNotificationChannel(user.id, {
      type: body.type,
      enabled: body.enabled ?? true,
      config: body.config || {},
    })
    return NextResponse.json({
      channel: { id: channel.id, type: channel.type, enabled: channel.enabled, config: JSON.parse(channel.config || "{}") },
    })
  } catch (error) {
    console.error("/api/notifications/channels error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const body = await req.json()
    if (!body.type) return NextResponse.json({ error: "Channel type required" }, { status: 400 })
    const channel = await setNotificationChannel(user.id, {
      type: body.type,
      enabled: body.enabled ?? true,
      config: body.config || {},
    })
    return NextResponse.json({
      channel: { id: channel.id, type: channel.type, enabled: channel.enabled, config: JSON.parse(channel.config || "{}") },
    })
  } catch (error) {
    console.error("/api/notifications/channels error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const { type } = await req.json()
    if (!type) return NextResponse.json({ error: "Channel type required" }, { status: 400 })
    await deleteNotificationChannel(user.id, type)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/notifications/channels error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
