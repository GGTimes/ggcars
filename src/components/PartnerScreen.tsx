'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { formatJalaliIso } from '@/lib/jalali'
import type { CycleData } from '@/types/api'
import { MoneyText } from './MoneyText'
import { StatusPill } from './StatusPill'

export function PartnerScreen({ cycle }: { cycle: CycleData }) {
  const t = useTranslations('dashboard')
  const capital = useTranslations('capital')
  const status = useTranslations('status')
  const shares = cycle.cars.filter((car) => car.capitalShares.length > 0)
  const hasStake =
    BigInt(cycle.summary.myCapital) > 0n ||
    BigInt(cycle.summary.myCapitalShare) !== 0n ||
    BigInt(cycle.summary.myPaid) > 0n ||
    cycle.capitalEntries.length > 0 ||
    cycle.payouts.length > 0 ||
    shares.length > 0

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {cycle.title}
            </h1>
            <StatusPill status={cycle.status} label={status(cycle.status)} />
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {formatJalaliIso(cycle.openedAt)}
          </p>
        </div>
      </header>

      {hasStake ? (
        <>
          <p className="text-sm text-ink/60">{t('partnerHint')}</p>
          <section className="grid gap-3 md:grid-cols-2">
            <article className="card stat-card">
              <p className="text-sm text-ink/55">{t('myCapital')}</p>
              <p className="mt-1 text-xl font-semibold">
                <MoneyText value={cycle.summary.myCapital} tone="neutral" />
              </p>
            </article>
            <article className="card stat-card">
              <p className="text-sm text-ink/55">{t('myMoneyShare')}</p>
              <p className="mt-1 text-xl font-semibold">
                <MoneyText value={cycle.summary.myCapitalShare} />
              </p>
            </article>
            <article className="card stat-card">
              <p className="text-sm text-ink/55">{t('myPaid')}</p>
              <p className="mt-1 text-xl font-semibold">
                <MoneyText value={cycle.summary.myPaid} tone="neutral" />
              </p>
            </article>
            <article className="card stat-card">
              <p className="text-sm text-ink/55">{t('myPayable')}</p>
              <p className="mt-1 text-xl font-semibold">
                <MoneyText value={cycle.summary.myPayable} tone="neutral" />
              </p>
            </article>
          </section>

          <section className="card grid gap-3">
            <h2 className="font-semibold">{t('myEntries')}</h2>
            {cycle.capitalEntries.length === 0 ? (
              <p className="text-sm text-ink/55">{t('noPersonalMoney')}</p>
            ) : (
              <ul className="grid gap-3 text-sm">
                {cycle.capitalEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 border-b border-line/70 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{capital(entry.kind)}</p>
                      {entry.note ? (
                        <p className="text-ink/60">{entry.note}</p>
                      ) : null}
                      <p className="text-xs text-ink/45">
                        {formatJalaliIso(entry.createdAt)}
                      </p>
                    </div>
                    <MoneyText value={entry.amount} tone="neutral" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card grid gap-3">
            <h2 className="font-semibold">{t('partnerPayouts')}</h2>
            {cycle.payouts.length === 0 ? (
              <p className="text-sm text-ink/55">{t('noPartnerPayouts')}</p>
            ) : (
              <ul className="grid gap-3 text-sm">
                {cycle.payouts.map((payout) => (
                  <li
                    key={payout.id}
                    className="flex items-start justify-between gap-3 border-b border-line/70 pb-3 last:border-0"
                  >
                    <div>
                      {payout.note ? <p>{payout.note}</p> : null}
                      <p className="text-xs text-ink/45">
                        {formatJalaliIso(payout.paidAt)}
                      </p>
                    </div>
                    <MoneyText value={payout.amount} tone="neutral" />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {shares.length > 0 ? (
            <section className="card grid gap-3">
              <h2 className="font-semibold">{t('partnerCars')}</h2>
              <ul className="grid gap-3 text-sm">
                {shares.map((car) => (
                  <li key={car.id}>
                    <Link href={`/cars/${car.id}`} className="font-medium">
                      {car.title}
                    </Link>
                    <p className="text-ink/60">
                      {t('myMoneyShare')}:{' '}
                      <MoneyText
                        value={car.capitalShares
                          .reduce(
                            (sum, share) => sum + BigInt(share.amount),
                            0n,
                          )
                          .toString()}
                      />
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className="card text-sm text-ink/60">{t('partnerEmpty')}</p>
      )}
    </div>
  )
}
