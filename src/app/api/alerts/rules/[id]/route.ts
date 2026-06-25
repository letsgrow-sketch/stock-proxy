import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"
import { deleteAlertRule } from "@/lib/db"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  await deleteAlertRule(user.id, params.id)
  return NextResponse.json({ ok: true })
}
