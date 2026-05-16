import { MiniCard } from './MiniCard'
import { useScrollToSection } from '../shared/useScrollToSection'
import { buildingNow } from '../../data'

export function BuildingNowCard() {
  const goTo = useScrollToSection()
  const isHashLink = buildingNow.href.startsWith('#')

  return (
    <MiniCard eyebrow="building now">
      <a
        href={buildingNow.href}
        onClick={isHashLink ? goTo(buildingNow.href.slice(1)) : undefined}
        className="group block"
      >
        <p
          className="text-ink group-hover:text-accent-deep text-sm leading-snug font-bold transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {buildingNow.client} · {buildingNow.role}
        </p>
        <p className="text-muted mt-1.5 text-[11px] leading-relaxed">{buildingNow.blurb}</p>
        <p className="text-accent-deep mt-2 text-[11px] font-semibold">See projects →</p>
      </a>
    </MiniCard>
  )
}
