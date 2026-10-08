import prisma from '@/lib/prisma'
import { COOKIE_NAME, readCookie, userFromToken } from '@/server/session'
import type { GraphQLContext } from './builder'

export async function createContext(request: Request): Promise<GraphQLContext> {
  const token = readCookie(request.headers.get('cookie') ?? '', COOKIE_NAME)
  const user = token ? await userFromToken(token) : null
  return { prisma, user }
}
