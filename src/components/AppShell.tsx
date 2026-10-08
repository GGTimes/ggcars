'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import type { SessionUser } from '@/types/session'

export function AppShell({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  const t = useTranslations('nav')
  const app = useTranslations('app')
  const roles = useTranslations('roles')
  const pathname = usePathname()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/login')
  }

  const links = [
    { href: '/', label: t('current'), active: pathname === '/' },
    {
      href: '/cycles',
      label: t('archive'),
      active: pathname.startsWith('/cycles'),
    },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <Link href="/" className="min-w-0">
              <span className="block text-lg font-semibold leading-tight tracking-tight">
                {app('name')}
              </span>
              <span className="hidden truncate text-xs text-gold sm:block">
                {app('tagline')}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-end leading-tight">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-ink/50">{roles(user.role)}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost px-3 py-2"
                onClick={logout}
              >
                {t('logout')}
              </button>
            </div>
          </div>
          <nav className="flex gap-2 pb-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm ${
                  link.active
                    ? 'bg-leaf/15 font-medium text-leaf'
                    : 'text-ink/70 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
