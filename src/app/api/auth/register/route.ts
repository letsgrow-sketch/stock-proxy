import { NextResponse } from "next/server"
import { registerUser, loginUser, setTokenCookie } from "@/lib/auth-server"

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json()
    if (!email || !name || !password) return NextResponse.json({ error: "Email, name, and password required" }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    const result = await registerUser(email, name, password)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 })
    const loginResult = await loginUser(email, password)
    if ("error" in loginResult) return NextResponse.json({ user: result }, { status: 201 })
    return NextResponse.json({ user: loginResult.user, token: loginResult.token }, {
      status: 201,
      headers: { "Set-Cookie": setTokenCookie(loginResult.token) },
    })
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }
}
