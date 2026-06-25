import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "idx-screener-jwt-secret-dev"
const TOKEN_EXPIRY = 7 * 24 * 60 * 60

export interface SafeUser {
  id: string
  email: string
  name: string
  avatar: string
  createdAt: string
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, s, 100000, 64, "sha512").toString("hex")
  return { hash, salt: s }
}

function base64url(buf: Buffer): string {
  return buf.toString("base64url")
}

function createJWT(payload: Record<string, unknown>): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })))
  const body = base64url(Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY })))
  const signature = base64url(crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest())
  return `${header}.${body}.${signature}`
}

function verifyJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const signature = base64url(crypto.createHmac("sha256", JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest())
    if (signature !== parts[2]) return null
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}

function toSafeUser(user: { id: string; email: string; name: string; avatar: string | null; createdAt: Date }): SafeUser {
  return { id: user.id, email: user.email, name: user.name, avatar: user.avatar || "", createdAt: user.createdAt.toISOString() }
}

export async function registerUser(email: string, name: string, password: string): Promise<SafeUser | { error: string }> {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return { error: "Email already registered" }
  const { hash, salt } = hashPassword(password)
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name, passwordHash: hash, salt },
  })
  return toSafeUser(user)
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: SafeUser } | { error: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return { error: "Invalid email or password" }
  if (!user.passwordHash) return { error: "Account uses Google login. Sign in with Google." }
  const { hash } = hashPassword(password, user.salt || undefined)
  if (hash !== user.passwordHash) return { error: "Invalid email or password" }
  const token = createJWT({ userId: user.id, email: user.email, name: user.name })
  return { token, user: toSafeUser(user) }
}

export async function loginWithGoogle(googleId: string, email: string, name: string): Promise<{ token: string; user: SafeUser; isNew: boolean }> {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
  })
  let isNew = false
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, name },
    })
  } else {
    user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, googleId },
    })
    isNew = true
  }
  const token = createJWT({ userId: user.id, email: user.email, name: user.name })
  return { token, user: toSafeUser(user), isNew }
}

export async function getUserFromToken(token: string): Promise<SafeUser | null> {
  const payload = verifyJWT(token)
  if (!payload || !payload.userId) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId as string } })
  return user ? toSafeUser(user) : null
}

export async function updateProfile(userId: string, updates: { name?: string; avatar?: string }): Promise<SafeUser | { error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "User not found" }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(updates.name && { name: updates.name }), ...(updates.avatar !== undefined && { avatar: updates.avatar }) },
  })
  return toSafeUser(updated)
}

export async function getWatchlist(userId: string): Promise<{ id: string; stockCode: string; addedAt: string }[]> {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  })
  return items.map(i => ({ id: i.id, stockCode: i.stockCode, addedAt: i.addedAt.toISOString() }))
}

export async function saveWatchlist(userId: string, items: { id?: string; stockCode: string; addedAt?: string }[]) {
  await prisma.$transaction(async (tx) => {
    await tx.watchlistItem.deleteMany({ where: { userId } })
    if (items.length > 0) {
      await tx.watchlistItem.createMany({
        data: items.map(i => ({ userId, stockCode: i.stockCode })),
      })
    }
  })
}

export async function getPortfolio(userId: string): Promise<{ id: string; stockCode: string; stockName: string; sector: string; shares: number; averageBuyPrice: number; totalInvested: number; addedAt: string }[]> {
  const items = await prisma.portfolioHolding.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  })
  return items.map(i => ({
    id: i.id, stockCode: i.stockCode, stockName: i.stockName, sector: i.sector,
    shares: i.shares, averageBuyPrice: i.averageBuyPrice, totalInvested: i.totalInvested,
    addedAt: i.addedAt.toISOString(),
  }))
}

export async function savePortfolio(userId: string, items: { id?: string; stockCode: string; stockName?: string; sector?: string; shares: number; averageBuyPrice: number; totalInvested: number }[]) {
  await prisma.$transaction(async (tx) => {
    await tx.portfolioHolding.deleteMany({ where: { userId } })
    if (items.length > 0) {
      await tx.portfolioHolding.createMany({
        data: items.map(i => ({
          userId, stockCode: i.stockCode, stockName: i.stockName || i.stockCode,
          sector: i.sector || "Unknown", shares: i.shares,
          averageBuyPrice: i.averageBuyPrice, totalInvested: i.totalInvested,
        })),
      })
    }
  })
}

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") || ""
  const match = cookie.match(/token=([^;]+)/)
  return match ? match[1] : null
}

export function setTokenCookie(token: string): string {
  return `token=${token}; HttpOnly; Path=/; Max-Age=${TOKEN_EXPIRY}; SameSite=Lax`
}

export function clearTokenCookie(): string {
  return `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}
