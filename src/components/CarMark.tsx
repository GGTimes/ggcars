export function CarMark({ sold = false }: { sold?: boolean }) {
  return (
    <span
      className={`car-mark ${sold ? 'border-gold/35 bg-gold/10' : 'border-leaf/35 bg-leaf/10'}`}
      aria-hidden="true"
    >
      <span className="car-mark-body" />
      <span className="car-mark-wheel start-3" />
      <span className="car-mark-wheel end-3" />
    </span>
  )
}
