import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { SessionProvider } from '@/components/session'
import { getSession } from '@/server/session'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()
  if (!user) redirect('/login')

  return (
    <SessionProvider user={user}>
      <AppShell user={user}>{children}</AppShell>
    </SessionProvider>
  )
}
