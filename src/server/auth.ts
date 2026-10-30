import { GraphQLError } from 'graphql'
import type { SessionUser } from '@/types/session'
import { messages } from './messages'

export function requireUser(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new GraphQLError(messages.unauthenticated, {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  return user
}

export function requireOwner(user: SessionUser | null): SessionUser {
  const current = requireUser(user)
  if (current.role !== 'OWNER') {
    throw new GraphQLError(messages.forbidden, {
      extensions: { code: 'FORBIDDEN' },
    })
  }
  return current
}

export function requireStaff(
  user: SessionUser | null,
): SessionUser & { role: 'OWNER' | 'MANAGER' } {
  const current = requireUser(user)
  if (current.role === 'PARTNER') {
    throw new GraphQLError(messages.forbidden, {
      extensions: { code: 'FORBIDDEN' },
    })
  }
  return current as SessionUser & { role: 'OWNER' | 'MANAGER' }
}
