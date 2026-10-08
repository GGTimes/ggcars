'use client'

import { useQuery } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { CURRENT_CYCLE } from '@/graphql/operations'
import type { CycleData } from '@/types/api'
import { CycleScreen } from './CycleScreen'
import { OpenCycleForm } from './ledger-forms'
import { QueryState } from './QueryState'
import { useSession } from './session'

export function DashboardScreen() {
  const t = useTranslations('dashboard')
  const { role } = useSession()
  const { data, loading, error } = useQuery<{ currentCycle: CycleData | null }>(
    CURRENT_CYCLE,
    {
      fetchPolicy: 'network-only',
    },
  )

  if (loading && !data) return <QueryState loading error={undefined} />
  if (error) return <QueryState loading={false} error={error} />

  const cycle = data?.currentCycle
  if (!cycle) {
    return (
      <div className="mx-auto grid max-w-xl gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('emptyTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            {role === 'OWNER' ? t('emptyOwner') : t('emptyManager')}
          </p>
        </div>
        {role === 'OWNER' ? <OpenCycleForm /> : null}
      </div>
    )
  }

  return <CycleScreen cycle={cycle} allowEdits />
}
