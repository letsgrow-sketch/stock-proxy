import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { getScreenerPresets, saveScreenerPreset, deleteScreenerPreset } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ items: [] })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ items: [] })
  const items = await getScreenerPresets(user.id)
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { name, filters } = await req.json()
  if (!name || !filters) return NextResponse.json({ error: "Name and filters required" }, { status: 400 })
  const preset = await saveScreenerPreset(user.id, name, filters)
  return NextResponse.json({ preset }, { status: 201 })
}

export async function PUT(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { id, filters } = await req.json()
  if (!id || !filters) return NextResponse.json({ error: "ID and filters required" }, { status: 400 })
  await prisma.screenerPreset.updateMany({ where: { id, userId: user.id }, data: { filters } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
  await deleteScreenerPreset(user.id, id)
  return NextResponse.json({ ok: true })
}
