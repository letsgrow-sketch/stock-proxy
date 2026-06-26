import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest, getWatchlist, saveWatchlist } from "@/lib/auth-server"

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ items: [] })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: await getWatchlist(user.id) })
  } catch (error) {
    console.error("/api/user/watchlist error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const { items } = await req.json()
    await saveWatchlist(user.id, items || [])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/user/watchlist error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
