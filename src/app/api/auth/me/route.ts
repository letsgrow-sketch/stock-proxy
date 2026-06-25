import { NextResponse } from "next/server"
import { getUserFromToken, getTokenFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return NextResponse.json({ user: null })
  const user = await getUserFromToken(token)
  return NextResponse.json({ user })
}
