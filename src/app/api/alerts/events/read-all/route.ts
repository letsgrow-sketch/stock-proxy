import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { markAllAlertEventsRead } from "@/lib/db"

export async function PUT(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  await markAllAlertEventsRead(user.id)
  return NextResponse.json({ ok: true })
}
