import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getAlertRules, saveAlertRule } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ items: [] })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: await getAlertRules(user.id) })
  } catch (error) {
    console.error("/api/alerts/rules error:", error instanceof Error ? error.message : error)
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
    const rule = await saveAlertRule(user.id, body)
    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error("/api/alerts/rules error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
