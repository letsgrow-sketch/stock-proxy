import { NextResponse } from "next/server"
import { loginWithGoogle, setTokenCookie } from "@/lib/auth-server"

export async function POST(req: Request) {
  try {
    const { googleId, email, name } = await req.json()
    if (!googleId || !email || !name) return NextResponse.json({ error: "googleId, email, and name required" }, { status: 400 })
    const result = await loginWithGoogle(googleId, email, name)
    return NextResponse.json({ user: result.user, token: result.token, isNew: result.isNew }, {
      headers: { "Set-Cookie": setTokenCookie(result.token) },
    })
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }
}
