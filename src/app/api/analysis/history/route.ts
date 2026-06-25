import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getAnalysisHistory, clearAnalysisHistory } from "@/lib/db"

export async function GET(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ items: [] })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ items: [] })
  const items = await getAnalysisHistory(user.id)
  return NextResponse.json({ items })
}

export async function DELETE(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  await clearAnalysisHistory(user.id)
  return NextResponse.json({ ok: true })
}
