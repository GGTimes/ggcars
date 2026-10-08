'use client'

import type { DocumentNode } from '@apollo/client'
import { useMutation } from '@apollo/client/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ACTIVE_QUERIES } from '@/graphql/operations'
import { errorText } from '@/lib/errors'

export function ReceiptEditor({
  mutation,
  idName,
  id,
  value,
}: {
  mutation: DocumentNode
  idName: string
  id: string
  value: string | null
}) {
  const t = useTranslations('dashboard')
  const app = useTranslations('app')
  const [receiptNumber, setReceiptNumber] = useState(value ?? '')
  const [message, setMessage] = useState('')
  const [mutate, state] = useMutation(mutation, {
    refetchQueries: ACTIVE_QUERIES,
    awaitRefetchQueries: true,
  })

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    try {
      await mutate({
        variables: {
          [idName]: id,
          receiptNumber: receiptNumber.trim() || null,
        },
      })
      setMessage(t('receiptSaved'))
    } catch (error) {
      setMessage(errorText(error, app('error')))
    }
  }

  return (
    <form onSubmit={save} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
      <label>
        <span className="label">{t('receiptNumber')}</span>
        <textarea
          className="field min-h-20 py-2"
          value={receiptNumber}
          onChange={(event) => setReceiptNumber(event.target.value)}
          placeholder={t('receiptPlaceholder')}
        />
      </label>
      <button
        type="submit"
        className="btn btn-ghost self-end"
        disabled={state.loading}
      >
        {t('saveReceipt')}
      </button>
      {message ? (
        <p
          className={`text-xs ${message === t('receiptSaved') ? 'text-leaf' : 'text-danger'} sm:col-span-2`}
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}
