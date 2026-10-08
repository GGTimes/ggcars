'use client'

import { useQuery } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import {
  CAR_QUERY,
  UPDATE_CAR_PURCHASE_RECEIPT,
  UPDATE_CAR_SALE_RECEIPT,
  UPDATE_COST_RECEIPT,
} from '@/graphql/operations'
import { Link } from '@/i18n/routing'
import { formatJalaliIso } from '@/lib/jalali'
import type { CarDetail } from '@/types/api'
import { CarMark } from './CarMark'
import { CostForm, SellCarForm } from './ledger-forms'
import { MoneyText } from './MoneyText'
import { QueryState } from './QueryState'
import { ReceiptEditor } from './ReceiptEditor'
import { StatusPill } from './StatusPill'
import { useSession } from './session'

export function CarScreen({ id }: { id: string }) {
  const t = useTranslations('car')
  const dash = useTranslations('dashboard')
  const status = useTranslations('status')
  const cost = useTranslations('cost')
  const { role } = useSession()
  const { data, loading, error } = useQuery<{ car: CarDetail | null }>(
    CAR_QUERY,
    {
      variables: { id },
      fetchPolicy: 'network-only',
    },
  )

  if (loading && !data) return <QueryState loading error={undefined} />
  if (error) return <QueryState loading={false} error={error} />
  if (!data?.car) return <p className="card">{t('missing')}</p>

  const car = data.car
  const liveCosts = car.costs.reduce(
    (sum, item) => sum + BigInt(item.amount),
    0n,
  )
  const costsTotal =
    car.status === 'SOLD' && car.totalCost != null
      ? BigInt(car.totalCost)
      : liveCosts
  const editable = car.status === 'IN_STOCK' && car.cycle.status === 'OPEN'
  const back = car.cycle.status === 'OPEN' ? '/' : `/cycles/${car.cycle.id}`
  const meta = [car.year, car.color, car.plate].filter(Boolean).join(' · ')

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div>
        <Link href={back} className="btn btn-ghost px-3 py-1.5 text-sm">
          {t('back')}
        </Link>
        <div className="card car-hero mt-4 overflow-hidden border-leaf/25 bg-leaf/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CarMark sold={car.status === 'SOLD'} />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {car.title}
                </h1>
                <p className="mt-1 text-sm text-ink/55">
                  {car.cycle.title}
                  {meta ? ` · ${meta}` : ''}
                </p>
              </div>
            </div>
            <StatusPill status={car.status} label={status(car.status)} />
          </div>
        </div>
      </div>

      <section
        className={`grid gap-3 ${car.status === 'SOLD' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <article className="card stat-card">
          <p className="text-sm text-ink/55">{t('purchase')}</p>
          <p className="mt-1 text-xl font-semibold">
            <MoneyText value={car.purchasePrice} tone="neutral" />
          </p>
          {car.purchaseReceiptNumber ? (
            <p className="mt-2 text-xs text-gold">
              {dash('receiptNumber')}: {car.purchaseReceiptNumber}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-ink/45">
            {formatJalaliIso(car.purchasedAt)}
          </p>
          {role === 'OWNER' ? (
            <ReceiptEditor
              mutation={UPDATE_CAR_PURCHASE_RECEIPT}
              idName="carId"
              id={car.id}
              value={car.purchaseReceiptNumber}
            />
          ) : null}
        </article>
        <article className="card stat-card">
          <p className="text-sm text-ink/55">{t('totalCosts')}</p>
          <p className="mt-1 text-xl font-semibold">
            <MoneyText value={costsTotal} tone="neutral" />
          </p>
        </article>
        {car.status === 'SOLD' && car.salePrice != null ? (
          <article className="card stat-card border-gold/25">
            <p className="text-sm text-ink/55">{t('sale')}</p>
            <p className="mt-1 text-xl font-semibold">
              <MoneyText value={car.salePrice} tone="neutral" />
            </p>
            {car.soldAt ? (
              <p className="mt-2 text-xs text-ink/45">
                {formatJalaliIso(car.soldAt)}
              </p>
            ) : null}
            {car.saleReceiptNumber ? (
              <p className="mt-2 text-xs text-gold">
                {dash('receiptNumber')}: {car.saleReceiptNumber}
              </p>
            ) : null}
            {role === 'OWNER' ? (
              <ReceiptEditor
                mutation={UPDATE_CAR_SALE_RECEIPT}
                idName="carId"
                id={car.id}
                value={car.saleReceiptNumber}
              />
            ) : null}
          </article>
        ) : null}
        {car.status === 'SOLD' && car.profit != null ? (
          <article className="card car-hero border-leaf/25 bg-leaf/5 sm:col-span-3">
            <p className="text-sm text-ink/55">{t('frozen')}</p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink/50">{t('profit')}</dt>
                <dd className="text-lg font-semibold">
                  <MoneyText value={car.profit} />
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">{t('company')}</dt>
                <dd className="text-lg font-semibold">
                  <MoneyText value={car.companyShare ?? '0'} />
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">{t('manager')}</dt>
                <dd className="text-lg font-semibold">
                  <MoneyText value={car.managerShare ?? '0'} tone="neutral" />
                </dd>
              </div>
            </dl>
          </article>
        ) : null}
      </section>

      {car.note ? <p className="card text-sm text-ink/80">{car.note}</p> : null}

      <section className="card">
        <div className="section-heading mb-3">
          <h2 className="font-semibold">{t('costs')}</h2>
          <span className="pill">
            <MoneyText value={costsTotal} tone="neutral" />
          </span>
        </div>
        {car.costs.length === 0 ? (
          <p className="text-sm text-ink/55">{t('noCosts')}</p>
        ) : (
          <ul className="grid gap-3">
            {car.costs.map((item) => (
              <li
                key={item.id}
                className="border-b border-line/70 pb-3 text-sm last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{cost(item.category)}</p>
                    <p className="text-ink/70">{item.description}</p>
                    {item.receiptNumber ? (
                      <p className="text-xs text-gold">
                        {dash('receiptNumber')}: {item.receiptNumber}
                      </p>
                    ) : null}
                    <p className="text-xs text-ink/45">
                      {formatJalaliIso(item.spentAt)}
                    </p>
                  </div>
                  <MoneyText value={item.amount} tone="neutral" />
                </div>
                {role === 'OWNER' ? (
                  <ReceiptEditor
                    mutation={UPDATE_COST_RECEIPT}
                    idName="costId"
                    id={item.id}
                    value={item.receiptNumber}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {editable ? (
        <>
          <CostForm carId={car.id} />
          <SellCarForm
            carId={car.id}
            purchasePrice={car.purchasePrice}
            costs={liveCosts.toString()}
          />
        </>
      ) : car.status === 'SOLD' ? (
        <p className="text-sm text-ink/55">{t('sold')}</p>
      ) : null}
    </div>
  )
}
