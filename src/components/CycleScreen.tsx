'use client'

import { useMutation } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  ACTIVE_QUERIES,
  CLOSE_CYCLE,
  DELETE_CYCLE,
  UPDATE_CAPITAL_RECEIPT,
  UPDATE_PAYOUT_RECEIPT,
} from '@/graphql/operations'
import { Link, useRouter } from '@/i18n/routing'
import { errorText } from '@/lib/errors'
import { toPersianDigits } from '@/lib/format'
import { formatJalaliIso } from '@/lib/jalali'
import type { CarListItem, CycleData } from '@/types/api'
import { CarMark } from './CarMark'
import {
  BuyCarForm,
  ExtraMoneyForm,
  PartnerAccessForm,
  PayoutForm,
  PocketMoneyForm,
} from './ledger-forms'
import { MoneyText } from './MoneyText'
import { ReceiptEditor } from './ReceiptEditor'
import { StatusPill } from './StatusPill'
import { useSession } from './session'

function costsOf(car: CarListItem): bigint {
  if (car.status === 'SOLD' && car.totalCost != null)
    return BigInt(car.totalCost)
  return car.costs.reduce((sum, cost) => sum + BigInt(cost.amount), 0n)
}

function metaLine(car: CarListItem) {
  return [car.year, car.color, car.plate].filter(Boolean).join(' · ')
}

function Stat({
  label,
  children,
  hint,
  className = '',
}: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
  className?: string
}) {
  return (
    <article className={`card stat-card ${className}`}>
      <p className="text-sm text-ink/55">{label}</p>
      <p className="mt-1 text-xl font-semibold leading-snug">{children}</p>
      {hint ? <p className="mt-2 text-xs text-ink/50">{hint}</p> : null}
    </article>
  )
}

export function CycleScreen({
  cycle,
  allowEdits,
}: {
  cycle: CycleData
  allowEdits: boolean
}) {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const carT = useTranslations('car')
  const status = useTranslations('status')
  const capital = useTranslations('capital')
  const app = useTranslations('app')
  const roles = useTranslations('roles')
  const { role } = useSession()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [closeError, setCloseError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [closeCycle, closeState] = useMutation(CLOSE_CYCLE, {
    refetchQueries: ACTIVE_QUERIES,
    awaitRefetchQueries: true,
  })
  const [removeCycle, deleteState] = useMutation(DELETE_CYCLE, {
    refetchQueries: ACTIVE_QUERIES,
    awaitRefetchQueries: true,
  })
  const payable = BigInt(cycle.summary.managerPayable)
  // Uncovered costs sit in the total budget. They belong to the company's principal.
  const companyPrincipal =
    BigInt(cycle.summary.totalBudget) - BigInt(cycle.summary.partnerCapital)
  const companyProfit = BigInt(cycle.summary.companyShare)
  const companyTotal = companyPrincipal + companyProfit
  const inventoryCost = BigInt(cycle.summary.inventoryCost)
  const otherDue = cycle.summary.partners.some(
    (partner) => !partner.isManager && BigInt(partner.payable) > 0n,
  )
  const editable = allowEdits && cycle.status === 'OPEN'
  const isOwner = role === 'OWNER'

  async function confirmDelete() {
    setDeleteError('')
    try {
      await removeCycle({ variables: { cycleId: cycle.id } })
      router.push(cycle.status === 'OPEN' ? '/' : '/cycles')
    } catch (error) {
      setDeleteError(errorText(error, app('error')))
    }
  }

  async function confirmClose() {
    setCloseError('')
    try {
      await closeCycle({ variables: { cycleId: cycle.id } })
      setConfirming(false)
    } catch (error) {
      setCloseError(errorText(error, app('error')))
    }
  }

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
            {cycle.closedAt ? ` — ${formatJalaliIso(cycle.closedAt)}` : ''}
          </p>
        </div>
        <p className="pill border border-leaf/20 bg-leaf/10 text-leaf">
          {t('rolePanel', { role: roles(role) })}
        </p>
      </header>

      {cycle.status === 'CLOSED' ? (
        <p className="card border-gold/30 text-sm text-gold">
          {t('closedBanner')}
        </p>
      ) : null}

      <section className="card car-hero overflow-hidden border-leaf/30 bg-leaf/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CarMark />
            <div>
              <p className="text-sm text-gold">{t('cardTitle')}</p>
              <p className="text-xs text-ink/55">{t('cardHolder')}</p>
            </div>
          </div>
          <p className="rounded-full border border-white/10 px-3 py-1 text-sm font-semibold tracking-tight">
            GG Cars
          </p>
        </div>
        <p className="mt-6 text-sm text-ink/55">{t('totalBudget')}</p>
        <p className="text-3xl font-semibold leading-tight">
          <MoneyText value={cycle.summary.totalBudget} tone="neutral" />
        </p>
        <p className="mt-2 text-xs text-ink/55">{t('totalBudgetHint')}</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
          <div>
            <dt className="text-ink/50">{t('budget')}</dt>
            <dd>
              <MoneyText value={cycle.summary.initialAmount} tone="neutral" />
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">{t('sales')}</dt>
            <dd>
              <MoneyText value={cycle.summary.sales} tone="neutral" />
            </dd>
          </div>
        </dl>
        {inventoryCost > 0n ? (
          <p className="mt-3 text-xs text-ink/50">
            {t('inventoryHint')}:{' '}
            <MoneyText value={cycle.summary.inventoryCost} tone="neutral" />
          </p>
        ) : null}
      </section>

      {isOwner ? (
        <section className="grid gap-3 md:grid-cols-3">
          <Stat
            label={t('companyCash')}
            hint={
              <>
                {t('companyPrincipal')}:{' '}
                <MoneyText value={companyPrincipal} tone="neutral" />
                <span className="mt-1 block">
                  {t('companyProfit')}:{' '}
                  <MoneyText value={companyProfit} tone="neutral" />
                </span>
              </>
            }
          >
            <MoneyText value={companyTotal} tone="neutral" />
          </Stat>
          <Stat
            className={payable > 0n ? 'border-gold/40' : ''}
            label={t('payable')}
            hint={t('payableHint')}
          >
            <MoneyText value={cycle.summary.managerPayable} tone="neutral" />
          </Stat>
          <Stat label={t('company')} hint={t('companyHint')}>
            <MoneyText value={cycle.summary.companyShare} />
          </Stat>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-3">
          <Stat label={t('mySalesShare')} hint={t('mySalesHint')}>
            <MoneyText value={cycle.summary.managerShare} tone="neutral" />
          </Stat>
          <Stat
            label={t('myMoneyShare')}
            hint={
              <>
                {t('myMoneyHint')}
                <span className="mt-1 block">
                  {t('myCapital')}:{' '}
                  <MoneyText value={cycle.summary.myCapital} tone="neutral" />
                </span>
              </>
            }
          >
            <MoneyText value={cycle.summary.myCapitalShare} tone="neutral" />
          </Stat>
          <Stat
            className={payable > 0n ? 'border-gold/40' : ''}
            label={t('myPayable')}
            hint={t('myPayableHint')}
          >
            <MoneyText value={cycle.summary.managerPayable} tone="neutral" />
          </Stat>
        </section>
      )}

      {isOwner ? (
        <section className="card grid gap-4">
          <div>
            <h2 className="font-semibold">
              {cycle.summary.partners.length > 0
                ? t('stakes')
                : t('companyAccount')}
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              {cycle.summary.partners.length > 0
                ? t('stakesHint')
                : t('companyAccountHint')}
            </p>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="grid gap-2 border-b border-line/70 pb-3 last:border-0 sm:grid-cols-2 lg:grid-cols-4">
              <span className="font-medium">{t('companyFunder')}</span>
              <span>
                {t('companyPrincipal')}:{' '}
                <MoneyText value={companyPrincipal} tone="neutral" />
              </span>
              <span>
                {t('companyProfit')}: <MoneyText value={companyProfit} />
              </span>
              <span>
                {t('companyCash')}:{' '}
                <MoneyText value={companyTotal} tone="neutral" />
              </span>
            </li>
            {inventoryCost > 0n ? (
              <li className="text-ink/60">
                {t('companyHeld')}{' '}
                <MoneyText value={inventoryCost} tone="neutral" />
              </li>
            ) : null}
            {cycle.summary.partners.map((partner) => (
              <li
                key={partner.id}
                className="grid gap-2 border-b border-line/70 pb-3 last:border-0 sm:grid-cols-3"
              >
                <span className="font-medium">{partner.name}</span>
                <span>
                  {t('partnerCapital')}:{' '}
                  <MoneyText value={partner.capital} tone="neutral" />
                </span>
                <span>
                  {t('partnerProfit')}:{' '}
                  <MoneyText value={partner.profitShare} tone="neutral" />
                  {partner.isManager ? (
                    <span className="mt-1 block text-ink/55">
                      {t('payable')}:{' '}
                      <MoneyText
                        value={cycle.summary.managerPayable}
                        tone="neutral"
                      />
                    </span>
                  ) : BigInt(partner.payable) > 0n ? (
                    <span className="mt-1 block text-ink/55">
                      {t('payable')}:{' '}
                      <MoneyText value={partner.payable} tone="neutral" />
                    </span>
                  ) : null}
                </span>
                {partner.isManager ? null : (
                  <div className="sm:col-span-3">
                    <PartnerAccessForm partnerId={partner.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {editable
            ? cycle.summary.partners
                .filter(
                  (partner) =>
                    !partner.isManager && BigInt(partner.payable) > 0n,
                )
                .map((partner) => (
                  <PayoutForm
                    key={partner.id}
                    cycleId={cycle.id}
                    payable={partner.payable}
                    partnerId={partner.id}
                    title={t('payPartner', { name: partner.name })}
                    tooMuch={tv('payoutTooMuchPartner')}
                  />
                ))
            : null}
        </section>
      ) : null}

      <section className="grid gap-3">
        <div className="section-heading">
          <div>
            <p className="text-xs font-medium text-gold">{t('garage')}</p>
            <h2 className="text-lg font-semibold">{t('cars')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="pill">
              {t('inStock')}:{' '}
              {toPersianDigits(String(cycle.summary.inStockCount))}
            </span>
            <span className="pill">
              {t('soldHint', {
                count: toPersianDigits(String(cycle.summary.soldCount)),
              })}
            </span>
          </div>
        </div>
        {cycle.cars.length === 0 ? (
          <p className="card text-sm text-ink/60">{t('noCars')}</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {cycle.cars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="card vehicle-card block transition hover:border-leaf/50 hover:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <CarMark sold={car.status === 'SOLD'} />
                    <div className="min-w-0">
                      <h3 className="font-semibold">{car.title}</h3>
                      <p className="mt-0.5 text-sm text-ink/55">
                        {metaLine(car) || formatJalaliIso(car.purchasedAt)}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={car.status} label={status(car.status)} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-ink/50">{carT('purchase')}</dt>
                    <dd>
                      <MoneyText value={car.purchasePrice} tone="neutral" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">{carT('totalCosts')}</dt>
                    <dd>
                      <MoneyText value={costsOf(car)} tone="neutral" />
                    </dd>
                  </div>
                  {car.status === 'SOLD' && car.profit != null ? (
                    <>
                      <div>
                        <dt className="text-ink/50">{carT('profit')}</dt>
                        <dd>
                          <MoneyText value={car.profit} />
                        </dd>
                      </div>
                      {isOwner ? (
                        <div>
                          <dt className="text-ink/50">{t('company')}</dt>
                          <dd>
                            <MoneyText value={car.companyShare ?? '0'} />
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-ink/50">
                          {isOwner ? carT('managerShort') : t('mySalesShare')}
                        </dt>
                        <dd>
                          <MoneyText
                            value={car.managerShare ?? '0'}
                            tone="neutral"
                          />
                        </dd>
                      </div>
                      {car.capitalShares.map((share) => (
                        <div key={share.partner.id}>
                          <dt className="text-ink/50">
                            {isOwner
                              ? `${carT('moneyShare')} — ${share.partner.name}`
                              : carT('moneyShare')}
                          </dt>
                          <dd>
                            <MoneyText value={share.amount} tone="neutral" />
                          </dd>
                        </div>
                      ))}
                    </>
                  ) : null}
                </dl>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="history-grid grid gap-3 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">
            {isOwner ? t('entries') : t('myEntries')}
          </h2>
          {!isOwner && cycle.capitalEntries.length === 0 ? (
            <p className="text-sm text-ink/55">{t('noPersonalMoney')}</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {cycle.capitalEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-line/70 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ink/80">
                      {entry.partner ? `${entry.partner.name} — ` : ''}
                      {capital(entry.kind)}
                      {entry.note ? ` — ${entry.note}` : ''}
                      {entry.receiptNumber
                        ? ` — ${t('receiptNumber')}: ${entry.receiptNumber}`
                        : ''}
                    </span>
                    <MoneyText value={entry.amount} tone="neutral" />
                  </div>
                  {isOwner ? (
                    <ReceiptEditor
                      mutation={UPDATE_CAPITAL_RECEIPT}
                      idName="entryId"
                      id={entry.id}
                      value={entry.receiptNumber}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">
            {isOwner && cycle.summary.partners.length > 0
              ? t('payoutsAll')
              : t('payouts')}
          </h2>
          {cycle.payouts.length === 0 ? (
            <p className="text-sm text-ink/55">{t('noPayouts')}</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {cycle.payouts.map((payout) => (
                <li
                  key={payout.id}
                  className="border-b border-line/70 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ink/80">
                      {payout.partner ? `${payout.partner.name} — ` : ''}
                      {formatJalaliIso(payout.paidAt)}
                      {payout.note ? ` — ${payout.note}` : ''}
                      {payout.receiptNumber
                        ? ` — ${t('receiptNumber')}: ${payout.receiptNumber}`
                        : ''}
                    </span>
                    <MoneyText value={payout.amount} tone="neutral" />
                  </div>
                  {isOwner ? (
                    <ReceiptEditor
                      mutation={UPDATE_PAYOUT_RECEIPT}
                      idName="payoutId"
                      id={payout.id}
                      value={payout.receiptNumber}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {editable ? (
        <section className="grid gap-4">
          <div className="section-heading">
            <div>
              <p className="text-xs font-medium text-gold">
                {isOwner ? t('ownerActions') : t('managerActions')}
              </p>
              <h2 className="text-lg font-semibold">{t('actions')}</h2>
            </div>
            <span className="pill">{roles(role)}</span>
          </div>
          <p className="muted">
            {isOwner ? t('ownerActionsHint') : t('managerActionsHint')}
          </p>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <BuyCarForm cycleId={cycle.id} cash={cycle.summary.cash} />
            </div>
            {isOwner ? (
              <ExtraMoneyForm cycleId={cycle.id} />
            ) : (
              <PocketMoneyForm cycleId={cycle.id} />
            )}
            {isOwner ? (
              payable > 0n ? (
                <PayoutForm
                  cycleId={cycle.id}
                  payable={cycle.summary.managerPayable}
                />
              ) : (
                <p className="card text-sm text-ink/70">{t('noPayable')}</p>
              )
            ) : null}
          </div>
          {isOwner ? (
            <section className="card grid gap-3">
              <h2 className="font-semibold">{t('close')}</h2>
              {cycle.summary.inStockCount > 0 ? (
                <p className="text-sm text-ink/70">{t('closeBlocked')}</p>
              ) : confirming ? (
                <div className="grid gap-3">
                  <p className="text-sm text-ink/80">
                    {payable > 0n ? t('closeConfirm') : t('closeOk')}
                  </p>
                  {otherDue ? (
                    <p className="text-sm text-ink/80">{t('closePartner')}</p>
                  ) : null}
                  {closeError ? (
                    <p className="text-sm text-danger" role="alert">
                      {closeError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={confirmClose}
                      disabled={closeState.loading}
                    >
                      {t('close')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setConfirming(false)}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger w-fit"
                  onClick={() => setConfirming(true)}
                >
                  {t('close')}
                </button>
              )}
            </section>
          ) : null}
        </section>
      ) : null}

      {isOwner ? (
        <section className="card grid gap-3">
          <h2 className="font-semibold">{t('delete')}</h2>
          {deleting ? (
            <div className="grid gap-3">
              <p className="text-sm text-ink/80">{t('deleteConfirm')}</p>
              {deleteError ? (
                <p className="text-sm text-danger" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleteState.loading}
                >
                  {t('deleteSubmit')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDeleting(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-danger w-fit"
              onClick={() => setDeleting(true)}
            >
              {t('delete')}
            </button>
          )}
        </section>
      ) : null}
    </div>
  )
}
