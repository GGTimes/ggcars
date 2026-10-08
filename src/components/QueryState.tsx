'use client'

import { useTranslations } from 'next-intl'
import { errorText } from '@/lib/errors'

export function QueryState({
  loading,
  error,
}: {
  loading: boolean
  error?: unknown
}) {
  const t = useTranslations('app')
  if (loading) return <p className="card text-sm text-ink/60">{t('loading')}</p>
  if (error) {
    return (
      <p className="card text-danger" role="alert">
        {errorText(error, t('error'))}
      </p>
    )
  }
  return null
}
