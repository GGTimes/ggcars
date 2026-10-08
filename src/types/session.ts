export type Role = 'OWNER' | 'MANAGER'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}
