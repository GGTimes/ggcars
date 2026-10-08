'use client'

import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import {
  caretAfterDigits,
  groupTomanInput,
  parseTomanInput,
  toEnglishDigits,
  tomanInWords,
} from '@/lib/format'

export function MoneyInput<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>
  name: Path<T>
  label: string
}) {
  const unit = useTranslations('money')
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const current = String(field.value ?? '')
        const parsed = parseTomanInput(current)
        const words = parsed == null ? '' : tomanInWords(parsed)
        return (
          <span className="block">
            <span className="relative block">
              <input
                ref={inputRef}
                name={field.name}
                aria-label={label}
                className="field pe-16"
                inputMode="numeric"
                autoComplete="off"
                value={groupTomanInput(current)}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const input = event.target
                  const cursor = input.selectionStart ?? input.value.length
                  const digitsBefore = toEnglishDigits(
                    input.value.slice(0, cursor),
                  ).replace(/\D/g, '').length
                  const next = groupTomanInput(input.value)
                  field.onChange(next)
                  requestAnimationFrame(() => {
                    const element = inputRef.current
                    if (!element) return
                    const position = caretAfterDigits(next, digitsBefore)
                    element.setSelectionRange(position, position)
                  })
                }}
              />
              <span className="unit">{unit('unit')}</span>
            </span>
            {words ? (
              <p className="mt-1.5 text-xs leading-6 text-gold">{words}</p>
            ) : null}
          </span>
        )
      }}
    />
  )
}
