import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Link href="/" className="btn btn-primary mt-6">
        {t('back')}
      </Link>
    </div>
  )
}
