import { NextResponse } from "next/server"
import { loginUser, setTokenCookie } from "@/lib/auth-server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    const result = await loginUser(email, password)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 401 })
    return NextResponse.json({ user: result.user, token: result.token }, {
      headers: { "Set-Cookie": setTokenCookie(result.token) },
    })
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }
}
