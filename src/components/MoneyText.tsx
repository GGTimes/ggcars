import { formatToman } from '@/lib/format'

export function MoneyText({
  value,
  tone = 'auto',
}: {
  value: bigint | string
  tone?: 'auto' | 'neutral'
}) {
  const amount = BigInt(value.toString())
  const toneClass =
    tone === 'neutral'
      ? ''
      : amount < 0n
        ? 'text-danger'
        : amount > 0n
          ? 'text-leaf'
          : ''
  return (
    <span className={`whitespace-nowrap tabular-nums ${toneClass}`}>
      {formatToman(value)}
    </span>
  )
}
