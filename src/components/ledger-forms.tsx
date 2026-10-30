'use client'

import type { DocumentNode } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type UseFormRegisterReturn, useForm } from 'react-hook-form'
import {
  ACTIVE_QUERIES,
  ADD_COST,
  ADD_EXTRA,
  BUY_CAR,
  GRANT_PARTNER_ACCESS,
  OPEN_CYCLE,
  PARTNERS,
  RECORD_PAYOUT,
  SELL_CAR,
} from '@/graphql/operations'
import { errorText } from '@/lib/errors'
import { parseTomanInput } from '@/lib/format'
import { parseJalali, todayJalaliInput } from '@/lib/jalali'
import { personalMoneyShare, sharesForSale } from '@/server/finance'
import type { Role } from '@/types/session'
import { MoneyInput } from './MoneyInput'
import { MoneyText } from './MoneyText'
import { useSession } from './session'

function useLedgerMutation(document: DocumentNode, extra: DocumentNode[] = []) {
  return useMutation(document, {
    refetchQueries: [...ACTIVE_QUERIES, ...extra],
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

function PartnerNameOptions({ listId }: { listId: string }) {
  const partners = useQuery<{
    partners: { id: string; name: string; linked: boolean }[]
  }>(PARTNERS)
  return (
    <datalist id={listId}>
      {(partners.data?.partners ?? [])
        .filter((partner) => !partner.linked)
        .map((partner) => (
          <option key={partner.id} value={partner.name} />
        ))}
    </datalist>
  )
}

function FundingFields({
  sourceField,
  partnerField,
  source,
  viewer,
  listId,
}: {
  sourceField: UseFormRegisterReturn
  partnerField: UseFormRegisterReturn
  source: string
  viewer: Role
  listId: string
}) {
  const t = useTranslations('dashboard')
  return (
    <>
      <label>
        <span className="label">{t('fundingSource')}</span>
        <select className="field" {...sourceField}>
          <option value="COMPANY">{t('fundingCompany')}</option>
          <option value="MANAGER">
            {viewer === 'MANAGER' ? t('fundingMyself') : t('fundingManager')}
          </option>
          <option value="PARTNER">{t('fundingPartner')}</option>
        </select>
      </label>
      {source === 'PARTNER' ? (
        <label>
          <span className="label">{t('partnerName')}</span>
          <input
            className="field"
            list={viewer === 'OWNER' ? listId : undefined}
            {...partnerField}
          />
          {viewer === 'OWNER' ? <PartnerNameOptions listId={listId} /> : null}
        </label>
      ) : null}
    </>
  )
}

function fundingPayload(values: { source: string; partnerName: string }) {
  return {
    source: values.source,
    partnerName: values.source === 'PARTNER' ? values.partnerName.trim() : null,
  }
}

export function OpenCycleForm() {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(OPEN_CYCLE)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      title: '',
      amount: '',
      receiptNumber: '',
      source: 'COMPANY',
      partnerName: '',
    },
  })
  const source = form.watch('source')

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
    if (values.source === 'PARTNER' && !values.partnerName.trim()) {
      setFormError(tv('required'))
      return
    }
    try {
      await mutate({
        variables: {
          title: values.title.trim(),
          amount,
          receiptNumber: values.receiptNumber.trim() || null,
          ...fundingPayload(values),
        },
      })
      form.reset()
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('openTitle')}</h2>
        <p className="mt-1 text-sm text-ink/60">{t('fundingHint')}</p>
      </div>
      <label>
        <span className="label">{t('cycleTitle')}</span>
        <input className="field" {...form.register('title')} />
      </label>
      <FundingFields
        sourceField={form.register('source')}
        partnerField={form.register('partnerName')}
        source={source}
        viewer="OWNER"
        listId="open-partner-names"
      />
      <div>
        <span className="label">{t('amount')}</span>
        <MoneyInput control={form.control} name="amount" label={t('amount')} />
      </div>
      <label>
        <span className="label">
          {t('receiptNumber')} ({t('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={t('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
      </label>
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
  const [mutate] = useLedgerMutation(ADD_EXTRA, [PARTNERS])
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      amount: '',
      note: '',
      receiptNumber: '',
      source: 'COMPANY',
      partnerName: '',
    },
  })
  const source = form.watch('source')

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    if (values.source === 'PARTNER' && !values.partnerName.trim()) {
      setFormError(tv('required'))
      return
    }
    try {
      await mutate({
        variables: {
          cycleId,
          amount,
          note: values.note.trim() || null,
          receiptNumber: values.receiptNumber.trim() || null,
          ...fundingPayload(values),
        },
      })
      form.reset({
        amount: '',
        note: '',
        receiptNumber: '',
        source: 'COMPANY',
        partnerName: '',
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('extraForm')}</h2>
        <p className="mt-1 text-sm text-ink/60">{t('fundingHint')}</p>
      </div>
      <FundingFields
        sourceField={form.register('source')}
        partnerField={form.register('partnerName')}
        source={source}
        viewer="OWNER"
        listId="extra-partner-names"
      />
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
      <label>
        <span className="label">
          {t('receiptNumber')} ({t('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={t('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
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

export function PartnerAccessForm({ partnerId }: { partnerId: string }) {
  const partners = useQuery<{
    partners: { id: string; linked: boolean; email: string | null }[]
  }>(PARTNERS)
  const record = partners.data?.partners.find(
    (partner) => partner.id === partnerId,
  )
  if (!record) return null
  return (
    <PartnerAccessFields
      key={`${record.email ?? ''}:${record.linked}`}
      partnerId={partnerId}
      email={record.email ?? ''}
      linked={record.linked}
    />
  )
}

function PartnerAccessFields({
  partnerId,
  email,
  linked,
}: {
  partnerId: string
  email: string
  linked: boolean
}) {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useMutation(GRANT_PARTNER_ACCESS, {
    refetchQueries: [PARTNERS],
    awaitRefetchQueries: true,
  })
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const form = useForm({ defaultValues: { email, password: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    setSaved(false)
    if (!values.email.trim() || !values.email.includes('@')) {
      setFormError(tv('email'))
      return
    }
    if (values.password.length < 8) {
      setFormError(tv('password'))
      return
    }
    try {
      await mutate({
        variables: {
          partnerId,
          email: values.email.trim(),
          password: values.password,
        },
      })
      form.reset({ email: values.email.trim(), password: '' })
      setSaved(true)
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl bg-white/5 p-3">
      <div>
        <p className="font-medium">{t('partnerAccess')}</p>
        <p className="mt-1 text-ink/60">
          {linked ? t('partnerLinked') : t('partnerAccessHint')}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">{t('partnerEmail')}</span>
          <input
            className="field"
            type="email"
            autoComplete="off"
            {...form.register('email')}
          />
        </label>
        <label>
          <span className="label">{t('partnerPassword')}</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
        </label>
      </div>
      <FieldError message={formError} />
      {saved ? (
        <p className="text-sm text-leaf">{t('partnerAccessSaved')}</p>
      ) : null}
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('savePartnerAccess')}
      </button>
    </form>
  )
}

export function PocketMoneyForm({ cycleId }: { cycleId: string }) {
  const t = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(ADD_EXTRA)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: { amount: '', note: '', receiptNumber: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('')
    const amount = parseTomanInput(values.amount)
    if (amount == null || BigInt(amount) <= 0n) {
      setFormError(tv('amount'))
      return
    }
    try {
      await mutate({
        variables: {
          cycleId,
          amount,
          note: values.note.trim() || null,
          receiptNumber: values.receiptNumber.trim() || null,
          source: 'MANAGER',
        },
      })
      form.reset()
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('pocketForm')}</h2>
        <p className="mt-1 text-sm text-ink/60">{t('pocketHint')}</p>
      </div>
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
      <label>
        <span className="label">
          {t('receiptNumber')} ({t('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={t('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
      </label>
      <FieldError message={formError} />
      <button
        className="btn btn-primary"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {t('savePocket')}
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
  const { role } = useSession()
  const [mutate] = useLedgerMutation(
    BUY_CAR,
    role === 'OWNER' ? [PARTNERS] : [],
  )
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
      receiptNumber: '',
      source: 'COMPANY',
      partnerName: '',
      fundedAmount: '',
    },
  })
  const source = form.watch('source')

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
    let funded: string | null = null
    if (values.source !== 'COMPANY' && values.fundedAmount.trim()) {
      const parsed = parseTomanInput(values.fundedAmount)
      if (parsed == null || BigInt(parsed) <= 0n) {
        setFormError(tv('amount'))
        return
      }
      if (BigInt(parsed) > BigInt(amount)) {
        setFormError(tv('fundedTooMuch'))
        return
      }
      funded = parsed
    }
    const fromCard = BigInt(amount) - (funded == null ? 0n : BigInt(funded))
    const coveredByPerson = values.source !== 'COMPANY' && funded == null
    if (!coveredByPerson && fromCard > BigInt(cash)) {
      setFormError(tv('insufficient'))
      return
    }
    if (values.source === 'PARTNER' && !values.partnerName.trim()) {
      setFormError(tv('required'))
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
          receiptNumber: values.receiptNumber.trim() || null,
          ...fundingPayload(values),
          fundedAmount: funded,
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
        receiptNumber: '',
        source: 'COMPANY',
        partnerName: '',
        fundedAmount: '',
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{t('buyForm')}</h2>
      <FundingFields
        sourceField={form.register('source')}
        partnerField={form.register('partnerName')}
        source={source}
        viewer={role}
        listId="buy-partner-names"
      />
      {source === 'COMPANY' ? null : (
        <div>
          <span className="label">
            {source === 'MANAGER' && role === 'MANAGER'
              ? t('fundedMyself')
              : t('fundedAmount')}{' '}
            ({t('optional')})
          </span>
          <MoneyInput
            control={form.control}
            name="fundedAmount"
            label={
              source === 'MANAGER' && role === 'MANAGER'
                ? t('fundedMyself')
                : t('fundedAmount')
            }
          />
          <p className="mt-1 text-sm text-ink/60">{t('fundedHint')}</p>
        </div>
      )}
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
      <label>
        <span className="label">
          {t('receiptNumber')} ({t('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={t('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
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
  partnerId,
  title,
  tooMuch,
}: {
  cycleId: string
  payable: string
  partnerId?: string
  title?: string
  tooMuch?: string
}) {
  const t = useTranslations('dashboard')
  const car = useTranslations('car')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(RECORD_PAYOUT)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      amount: '',
      note: '',
      paidAt: todayJalaliInput(),
      receiptNumber: '',
    },
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
      setFormError(tooMuch ?? tv('payoutTooMuch'))
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
          receiptNumber: values.receiptNumber.trim() || null,
          partnerId: partnerId ?? null,
        },
      })
      form.reset({
        amount: '',
        note: '',
        paidAt: todayJalaliInput(),
        receiptNumber: '',
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <h2 className="text-lg font-semibold">{title ?? t('payoutForm')}</h2>
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
      <label>
        <span className="label">
          {t('receiptNumber')} ({t('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={t('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
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
  const dash = useTranslations('dashboard')
  const cost = useTranslations('cost')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const { role } = useSession()
  const [mutate] = useLedgerMutation(
    ADD_COST,
    role === 'OWNER' ? [PARTNERS] : [],
  )
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      category: 'REPAIR',
      amount: '',
      description: '',
      spentAt: todayJalaliInput(),
      receiptNumber: '',
      source: 'COMPANY',
      partnerName: '',
    },
  })
  const source = form.watch('source')

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
    if (values.source === 'PARTNER' && !values.partnerName.trim()) {
      setFormError(tv('required'))
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
          receiptNumber: values.receiptNumber.trim() || null,
          ...fundingPayload(values),
        },
      })
      form.reset({
        category: 'REPAIR',
        amount: '',
        description: '',
        spentAt: todayJalaliInput(),
        receiptNumber: '',
        source: 'COMPANY',
        partnerName: '',
      })
    } catch (error) {
      setFormError(errorText(error, app('error')))
    }
  })

  return (
    <form onSubmit={onSubmit} className="card grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('addCost')}</h2>
        <p
          className={
            source === 'COMPANY'
              ? 'mt-1 text-sm text-gold'
              : 'mt-1 text-sm text-ink/60'
          }
        >
          {source === 'COMPANY' ? t('costBeyondCash') : t('fromPocketHint')}
        </p>
      </div>
      <FundingFields
        sourceField={form.register('source')}
        partnerField={form.register('partnerName')}
        source={source}
        viewer={role}
        listId="cost-partner-names"
      />
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
      <label>
        <span className="label">
          {dash('receiptNumber')} ({dash('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={dash('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
      </label>
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
  role,
  stake,
}: {
  carId: string
  purchasePrice: string
  costs: string
  role: Role
  stake: {
    capitalTotal: string
    companyCapital: string
    myCapital: string
    partners: {
      id: string
      name: string
      capital: string
      isManager: boolean
    }[]
  }
}) {
  const t = useTranslations('car')
  const dash = useTranslations('dashboard')
  const tv = useTranslations('validation')
  const app = useTranslations('app')
  const [mutate] = useLedgerMutation(SELL_CAR)
  const [formError, setFormError] = useState('')
  const form = useForm({
    defaultValues: {
      salePrice: '',
      soldAt: todayJalaliInput(),
      receiptNumber: '',
    },
  })
  const typed = parseTomanInput(form.watch('salePrice') ?? '')
  const profit =
    typed == null ? null : BigInt(typed) - BigInt(purchasePrice) - BigInt(costs)
  const preview =
    profit == null
      ? null
      : role === 'MANAGER'
        ? {
            salesShare: sharesForSale(profit, [
              { key: 'company', capital: BigInt(stake.capitalTotal) },
            ]).salesShare,
            moneyShare: personalMoneyShare(
              profit,
              BigInt(stake.myCapital),
              BigInt(stake.capitalTotal),
            ),
            companyShare: null as bigint | null,
            partners: [] as { name: string; amount: bigint }[],
          }
        : (() => {
            const shares = sharesForSale(profit, [
              { key: 'company', capital: BigInt(stake.companyCapital) },
              ...stake.partners
                .filter((partner) => BigInt(partner.capital) > 0n)
                .map((partner) => ({
                  key: partner.id,
                  capital: BigInt(partner.capital),
                })),
            ])
            return {
              salesShare: shares.salesShare,
              moneyShare: 0n,
              companyShare: shares.companyShare,
              partners: stake.partners
                .filter((partner) => BigInt(partner.capital) > 0n)
                .map((partner) => ({
                  name: partner.name,
                  amount:
                    shares.partnerShares.find(
                      (share) => share.key === partner.id,
                    )?.amount ?? 0n,
                })),
            }
          })()

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
        variables: {
          carId,
          salePrice: amount,
          soldAt: soldAt.toISOString(),
          receiptNumber: values.receiptNumber.trim() || null,
        },
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
      <label>
        <span className="label">
          {dash('receiptNumber')} ({dash('optional')})
        </span>
        <textarea
          className="field min-h-20"
          placeholder={dash('receiptPlaceholder')}
          {...form.register('receiptNumber')}
        />
      </label>
      {preview && profit != null ? (
        <div className="grid gap-3 rounded-xl bg-white/5 p-3 text-sm sm:grid-cols-3">
          <p className="text-ink/60 sm:col-span-3">{t('preview')}</p>
          <p>
            <span className="block text-ink/50">{t('profit')}</span>
            <MoneyText value={profit} />
          </p>
          {preview.companyShare != null ? (
            <p>
              <span className="block text-ink/50">{t('company')}</span>
              <MoneyText value={preview.companyShare} />
            </p>
          ) : null}
          <p>
            <span className="block text-ink/50">
              {role === 'MANAGER' ? dash('mySalesShare') : t('manager')}
            </span>
            <MoneyText value={preview.salesShare} tone="neutral" />
          </p>
          {role === 'MANAGER' && BigInt(stake.myCapital) > 0n ? (
            <p>
              <span className="block text-ink/50">{t('moneyShare')}</span>
              <MoneyText value={preview.moneyShare} tone="neutral" />
            </p>
          ) : null}
          {preview.partners.map((partner) => (
            <p key={partner.name}>
              <span className="block text-ink/50">
                {t('moneyShare')} — {partner.name}
              </span>
              <MoneyText value={partner.amount} tone="neutral" />
            </p>
          ))}
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
