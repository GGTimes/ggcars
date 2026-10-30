export type Role = 'OWNER' | 'MANAGER' | 'PARTNER'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}
