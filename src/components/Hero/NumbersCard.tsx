import { MiniCard } from './MiniCard'
import { heroStats } from '../../data'

export function NumbersCard() {
  return (
    <MiniCard eyebrow="by the numbers">
      <ul className="divide-border/60 divide-y">
        {heroStats.map((s) => (
          <li key={s.label} className="flex items-baseline gap-3 py-1.5 first:pt-0 last:pb-0">
            <span
              className="text-ink w-14 shrink-0 text-lg font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {s.value}
            </span>
            <span className="text-muted text-[11px] leading-tight">{s.label}</span>
          </li>
        ))}
      </ul>
    </MiniCard>
  )
}
