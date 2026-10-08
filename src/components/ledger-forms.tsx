'use client'

import type { DocumentNode } from '@apollo/client'
import { useMutation } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ACTIVE_QUERIES,
  ADD_COST,
  ADD_EXTRA,
  BUY_CAR,
  OPEN_CYCLE,
  RECORD_PAYOUT,
  SELL_CAR,
} from '@/graphql/operations'
import { errorText } from '@/lib/errors'
import { parseTomanInput } from '@/lib/format'
import { parseJalali, todayJalaliInput } from '@/lib/jalali'
import { splitProfit } from '@/server/finance'
import { MoneyInput } from './MoneyInput'
import { MoneyText } from './MoneyText'

function useLedgerMutation(document: DocumentNode) {
  return useMutation(document, {
    refetchQueries: ACTIVE_QUERIES,
    awaitRefetchQueries: true,
  })
}

function FieldError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-danger" role="alert">
      {message}
    </p>
  )
}

export function OpenCycleForm() {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(OPEN_CYCLE)
  const [formError, setFormError] = useState('')
  const form = useForm({ defaultValues: { title: '', amount: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    if (!values.title.trim()) {
      setFormError(tv('required'))
      return
    }
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    try {
      await mutate({ variables: { title: values.title.trim(), amount } })
      form.reset()
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{t('openTitle')}</h2>
      <label>
        <span className="label">{t('cycleTitle')}</span>
        <input className="field" {...form.register('title')} />
      </label>
      <div>
        <span className="label">{t('amount')}</span>
        <MoneyInput control={form.control} name="amount" label={t('amount')} />
      </div>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('openSubmit')}
      </button>
    </form>
  )
}

export function ExtraMoneyForm({ cycleId }: { cycleId: string }) {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(ADD_EXTRA)
  const [formError, setFormError] = useState('')
  const form = useForm({ defaultValues: { amount: '', note: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    try {
      await mutate({
        variables: { cycleId, amount, note: values.note.trim() || null },
      })
      form.reset()
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{t('extraForm')}</h2>
      <div>
        <span className="label">{t('amount')}</span>
        <MoneyInput control={form.control} name="amount" label={t('amount')} />
      </div>
      <label>
        <span className="label">
          {t('note')} ({t('optional')})
        </span>
        <input className="field" {...form.register('note')} />
      </label>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('saveExtra')}
      </button>
    </form>
  )
}

export function BuyCarForm({
  cycleId,
  cash,
}: {
  cycleId: string
  cash: string
}) {
  const t = useTranslations('dashboard')
  const car = useTranslations('car')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(BUY_CAR)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      title: '',
      year: '',
      color: '',
      plate: '',
      purchasePrice: '',
      purchasedAt: todayJalaliInput(),
      note: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.purchasePrice)
    const purchasedAt = parseJalali(values.purchasedAt)
    if (!values.title.trim()) {
      setFormError(tv('required'))
      return
    }
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    if (BigInt(amount) > BigInt(cash)) {
      setFormError(tv('insufficient'))
      return
    }
    if (!purchasedAt) {
      setFormError(tv('date'))
      return
    }
    const year = values.year.trim() ? Number(values.year) : null
    if (
      year != null &&
      (!Number.isInteger(year) || year < 1300 || year > 2100)
    ) {
      setFormError(tv('required'))
      return
    }
    try {
      await mutate({
        variables: {
          cycleId,
          title: values.title.trim(),
          year,
          color: values.color.trim() || null,
          plate: values.plate.trim() || null,
          purchasePrice: amount,
          purchasedAt: purchasedAt.toISOString(),
          note: values.note.trim() || null,
        },
      })
      form.reset({
        title: '',
        year: '',
        color: '',
        plate: '',
        purchasePrice: '',
        purchasedAt: todayJalaliInput(),
        note: '',
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{t('buyForm')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t('carTitle')}</span>
          <input className="field" {...form.register('title')} />
        </label>
        <div>
          <span className="label">{car('purchase')}</span>
          <MoneyInput
            control={form.control}
            name="purchasePrice"
            label={car('purchase')}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <label>
          <span className="label">{car('date')}</span>
          <input className="field" {...form.register('purchasedAt')} />
        </label>
        <label>
          <span className="label">
            {t('year')} ({t('optional')})
          </span>
          <input
            className="field"
            inputMode="numeric"
            {...form.register('year')}
          />
        </label>
        <label>
          <span className="label">
            {t('color')} ({t('optional')})
          </span>
          <input className="field" {...form.register('color')} />
        </label>
        <label>
          <span className="label">
            {t('plate')} ({t('optional')})
          </span>
          <input className="field" {...form.register('plate')} />
        </label>
      </div>
      <label>
        <span className="label">
          {t('note')} ({t('optional')})
        </span>
        <input className="field" {...form.register('note')} />
      </label>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('saveCar')}
      </button>
    </form>
  )
}

export function PayoutForm({
  cycleId,
  payable,
}: {
  cycleId: string
  payable: string
}) {
  const t = useTranslations('dashboard')
  const car = useTranslations('car')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(RECORD_PAYOUT)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: { amount: '', note: '', paidAt: todayJalaliInput() },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    const paidAt = parseJalali(values.paidAt)
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    if (BigInt(amount) > BigInt(payable)) {
      setFormError(tv('payoutTooMuch'))
      return
    }
    if (!paidAt) {
      setFormError(tv('date'))
      return
    }
    try {
      await mutate({
        variables: {
          cycleId,
          amount,
          note: values.note.trim() || null,
          paidAt: paidAt.toISOString(),
        },
      })
      form.reset({ amount: '', note: '', paidAt: todayJalaliInput() })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{t('payoutForm')}</h2>
      <div>
        <span className="label">{t('payoutAmount')}</span>
        <MoneyInput
          control={form.control}
          name="amount"
          label={t('payoutAmount')}
        />
      </div>
      <label>
        <span className="label">{car('date')}</span>
        <input className="field" {...form.register('paidAt')} />
      </label>
      <label>
        <span className="label">
          {t('note')} ({t('optional')})
        </span>
        <input className="field" {...form.register('note')} />
      </label>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('savePayout')}
      </button>
    </form>
  )
}

export function CostForm({ carId }: { carId: string }) {
  const t = useTranslations('car')
  const cost = useTranslations('cost')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(ADD_COST)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      category: 'REPAIR',
      amount: '',
      description: '',
      spentAt: todayJalaliInput(),
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    const spentAt = parseJalali(values.spentAt)
    if (!values.description.trim()) {
      setFormError(tv('required'))
      return
    }
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    if (!spentAt) {
      setFormError(tv('date'))
      return
    }
    try {
      await mutate({
        variables: {
          carId,
          category: values.category,
          amount,
          description: values.description.trim(),
          spentAt: spentAt.toISOString(),
        },
      })
      form.reset({
        category: 'REPAIR',
        amount: '',
        description: '',
        spentAt: todayJalaliInput(),
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('addCost')}</h2>
        <p className="mt-1 text-sm text-gold">{t('costBeyondCash')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t('category')}</span>
          <select className="field" {...form.register('category')}>
            <option value="REPAIR">{cost('REPAIR')}</option>
            <option value="PARTS">{cost('PARTS')}</option>
            <option value="TRANSPORT">{cost('TRANSPORT')}</option>
            <option value="OTHER">{cost('OTHER')}</option>
          </select>
        </label>
        <div>
          <span className="label">{t('costAmount')}</span>
          <MoneyInput
            control={form.control}
            name="amount"
            label={t('costAmount')}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">{t('description')}</span>
          <input className="field" {...form.register('description')} />
        </label>
        <label>
          <span className="label">{t('date')}</span>
          <input className="field" {...form.register('spentAt')} />
        </label>
      </div>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('saveCost')}
      </button>
    </form>
  )
}

export function SellCarForm({
  carId,
  purchasePrice,
  costs,
}: {
  carId: string
  purchasePrice: string
  costs: string
}) {
  const t = useTranslations('car')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(SELL_CAR)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: { salePrice: '', soldAt: todayJalaliInput() },
  })
  const typed = parseTomanInput(form.watch('salePrice') ?? '')
  const preview =
    typed == null
      ? null
      : splitProfit(BigInt(typed) - BigInt(purchasePrice) - BigInt(costs))
  const profit =
    typed == null ? null : BigInt(typed) - BigInt(purchasePrice) - BigInt(costs)

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.salePrice)
    const soldAt = parseJalali(values.soldAt)
    if (amount == null) {
      setFormError(tv('amount'))
      return
    }
    if (!soldAt) {
      setFormError(tv('date'))
      return
    }
    try {
      await mutate({
        variables: { carId, salePrice: amount, soldAt: soldAt.toISOString() },
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 border-gold/30">
      <div>
        <h2 className="text-lg font-semibold">{t('sell')}</h2>
        <p className="mt-1 text-sm text-ink/60">{t('sellWarning')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label">{t('salePrice')}</span>
          <MoneyInput
            control={form.control}
            name="salePrice"
            label={t('salePrice')}
          />
        </div>
        <label>
          <span className="label">{t('date')}</span>
          <input className="field" {...form.register('soldAt')} />
        </label>
      </div>
      {preview && profit != null ? (
        <div className="grid gap-3 rounded-xl bg-white/5 p-3 text-sm sm:grid-cols-3">
          <p className="text-ink/60 sm:col-span-3">{t('preview')}</p>
          <p>
            <span className="block text-ink/50">{t('profit')}</span>
            <MoneyText value={profit} />
          </p>
          <p>
            <span className="block text-ink/50">{t('company')}</span>
            <MoneyText value={preview.companyShare} />
          </p>
          <p>
            <span className="block text-ink/50">{t('manager')}</span>
            <MoneyText value={preview.managerShare} />
          </p>
        </div>
      ) : null}
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('saveSale')}
      </button>
    </form>
  )
}
