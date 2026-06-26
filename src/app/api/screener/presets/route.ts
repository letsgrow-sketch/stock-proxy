import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getScreenerPresets, saveScreenerPreset, deleteScreenerPreset } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ items: [] })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ items: [] })
    const items = await getScreenerPresets(user.id)
    return NextResponse.json({ items })
  } catch (error) {
    console.error("/api/screener/presets error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const { name, filters } = await req.json()
    if (!name || !filters) return NextResponse.json({ error: "Name and filters required" }, { status: 400 })
    const preset = await saveScreenerPreset(user.id, name, filters)
    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    console.error("/api/screener/presets error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const { id, filters } = await req.json()
    if (!id || !filters) return NextResponse.json({ error: "ID and filters required" }, { status: 400 })
    await prisma.screenerPreset.updateMany({ where: { id, userId: user.id }, data: { filters } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/screener/presets error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await deleteScreenerPreset(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/screener/presets error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
