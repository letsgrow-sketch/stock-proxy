import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getNotificationRuleMappings, setNotificationRuleMapping, deleteNotificationRuleMapping } from "@/lib/db"

export async function GET(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ items: [] })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ items: [] })
  const mappings = await getNotificationRuleMappings(user.id)
  return NextResponse.json({
    items: mappings.map(m => ({ id: m.id, eventType: m.eventType, channels: JSON.parse(m.channels || "[]"), enabled: m.enabled })),
  })
}

export async function POST(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { eventType, channels } = await req.json()
  if (!eventType) return NextResponse.json({ error: "eventType required" }, { status: 400 })
  const mapping = await setNotificationRuleMapping(user.id, eventType, channels || [])
  return NextResponse.json({
    mapping: { id: mapping.id, eventType: mapping.eventType, channels: JSON.parse(mapping.channels || "[]"), enabled: mapping.enabled },
  })
}

export async function PUT(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { eventType, channels } = await req.json()
  if (!eventType) return NextResponse.json({ error: "eventType required" }, { status: 400 })
  const mapping = await setNotificationRuleMapping(user.id, eventType, channels || [])
  return NextResponse.json({
    mapping: { id: mapping.id, eventType: mapping.eventType, channels: JSON.parse(mapping.channels || "[]"), enabled: mapping.enabled },
  })
}

export async function DELETE(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { eventType } = await req.json()
  if (!eventType) return NextResponse.json({ error: "eventType required" }, { status: 400 })
  await deleteNotificationRuleMapping(user.id, eventType)
  return NextResponse.json({ ok: true })
}
