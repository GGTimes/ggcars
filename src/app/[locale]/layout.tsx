import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { type LocaleType, routing } from '@/i18n/routing'
import { ApolloWrapper } from '@/providers/apollo-wrapper'
import '@/styles/globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GG Cars',
  description: 'دفتر مالی خرید و فروش خودرو، به تومان',
  robots: { index: false, follow: false },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as LocaleType)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale} dir="rtl" className={`${vazirmatn.variable} dark`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ApolloWrapper>{children}</ApolloWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
