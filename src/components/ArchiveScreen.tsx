'use client'

import { useQuery } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { CYCLE, CYCLES } from '@/graphql/operations'
import { Link } from '@/i18n/routing'
import { formatJalaliIso } from '@/lib/jalali'
import type { CycleData, CycleListItem } from '@/types/api'
import { CycleScreen } from './CycleScreen'
import { MoneyText } from './MoneyText'
import { QueryState } from './QueryState'

export function ArchiveScreen() {
  const t = useTranslations('archive')
  const dash = useTranslations('dashboard')
  const { data, loading, error } = useQuery<{ cycles: CycleListItem[] }>(
    CYCLES,
    {
      fetchPolicy: 'network-only',
    },
  )

  if (loading && !data) return <QueryState loading error={undefined} />
  if (error) return <QueryState loading={false} error={error} />

  const cycles = data?.cycles ?? []

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t('title')}
      </h1>
      {cycles.length === 0 ? (
        <p className="card text-sm text-ink/60">{t('empty')}</p>
      ) : (
        cycles.map((cycle) => (
          <Link
            key={cycle.id}
            href={`/cycles/${cycle.id}`}
            className="card block transition hover:border-leaf/50 hover:bg-white/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{cycle.title}</h2>
                <p className="mt-1 text-sm text-ink/55">
                  {t('opened')} {formatJalaliIso(cycle.openedAt)}
                  {cycle.closedAt
                    ? ` · ${t('closed')} ${formatJalaliIso(cycle.closedAt)}`
                    : ''}
                </p>
              </div>
              <span className="text-sm text-leaf">{t('view')}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink/50">{dash('budget')}</dt>
                <dd>
                  <MoneyText
                    value={cycle.summary.initialAmount}
                    tone="neutral"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">{dash('company')}</dt>
                <dd>
                  <MoneyText value={cycle.summary.companyShare} />
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">{dash('payable')}</dt>
                <dd>
                  <MoneyText
                    value={cycle.summary.managerPayable}
                    tone="neutral"
                  />
                </dd>
              </div>
            </dl>
          </Link>
        ))
      )}
    </div>
  )
}

export function CycleDetailScreen({ id }: { id: string }) {
  const t = useTranslations('archive')
  const dash = useTranslations('dashboard')
  const { data, loading, error } = useQuery<{ cycle: CycleData | null }>(
    CYCLE,
    {
      variables: { id },
      fetchPolicy: 'network-only',
    },
  )

  if (loading && !data) return <QueryState loading error={undefined} />
  if (error) return <QueryState loading={false} error={error} />
  if (!data?.cycle) return <p className="card">{t('missing')}</p>
  if (data.cycle.status === 'OPEN') {
    return (
      <div className="card grid gap-3">
        <p>{dash('openBanner')}</p>
        <Link href="/" className="text-sm text-leaf">
          {dash('goCurrent')}
        </Link>
      </div>
    )
  }

  return <CycleScreen cycle={data.cycle} allowEdits={false} />
}
