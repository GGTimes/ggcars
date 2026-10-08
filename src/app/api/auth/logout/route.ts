import { NextResponse } from 'next/server'
import { COOKIE_NAME, cookieOptions } from '@/server/session'

export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 })
  return response
}
