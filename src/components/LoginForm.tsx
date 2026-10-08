'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
export function LoginForm() {
  const t = useTranslations('login')
  const app = useTranslations('app')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const form = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    setPending(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }),
      })
      if (!response.ok) {
        setError(t('failed'))
        return
      }
      window.location.assign('/')
    } catch {
      setError(t('failed'))
    } finally {
      setPending(false)
    }
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{app('name')}</h1>
        <p className="mt-1 text-sm text-gold">{app('tagline')}</p>
      </div>
      <form onSubmit={onSubmit} className="card grid gap-4">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <label>
          <span className="label">{t('email')}</span>
          <input
            className="field"
            type="email"
            autoComplete="username"
            {...form.register('email')}
          />
        </label>
        <label>
          <span className="label">{t('password')}</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </label>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {t('submit')}
        </button>
      </form>
    </div>
  )
}
