export function StatusPill({
  status,
  label,
}: {
  status: string
  label: string
}) {
  const live = status === 'OPEN' || status === 'IN_STOCK'
  return <span className={live ? 'pill pill-live' : 'pill'}>{label}</span>
}
