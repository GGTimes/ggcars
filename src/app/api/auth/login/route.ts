import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { COOKIE_NAME, cookieOptions, signSession } from '@/server/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 })
  }

  const email =
    typeof body === 'object' && body && 'email' in body
      ? String((body as { email: unknown }).email)
          .trim()
          .toLowerCase()
      : ''
  const password =
    typeof body === 'object' && body && 'password' in body
      ? String((body as { password: unknown }).password)
      : ''

  if (!email || !password) {
    return NextResponse.json(
      { error: 'ایمیل یا رمز عبور نادرست است' },
      { status: 401 },
    )
  }

  const user = await prisma.user.findUnique({ where: { email } })
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!user || !valid) {
    return NextResponse.json(
      { error: 'ایمیل یا رمز عبور نادرست است' },
      { status: 401 },
    )
  }

  const token = await signSession(user.id)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, cookieOptions)
  return response
}
