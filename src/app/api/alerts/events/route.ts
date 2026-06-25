import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getAlertEvents, saveAlertEvent } from "@/lib/db"

export async function GET(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ items: [] })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ items: [] })
  return NextResponse.json({ items: await getAlertEvents(user.id) })
}

export async function POST(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const body = await req.json()
  const event = await saveAlertEvent({ ...body, userId: user.id })
  return NextResponse.json({ event }, { status: 201 })
}
