import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import type { SessionUser } from '@/types/session'

export const COOKIE_NAME = 'ggcars_session'

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

function getSecret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 16) {
    throw new Error(
      'AUTH_SECRET must be set to a string of at least 16 characters',
    )
  }
  return new TextEncoder().encode(value)
}

export async function signSession(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export function readCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export async function userFromToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub) return null
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return null
    return { id: user.id, name: user.name, email: user.email, role: user.role }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return userFromToken(token)
}
