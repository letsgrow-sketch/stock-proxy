import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest, updateProfile } from "@/lib/auth-server"

export async function PUT(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  const { name, avatar } = await req.json()
  const result = await updateProfile(user.id, { name, avatar })
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ user: result })
}
