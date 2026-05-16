import { MiniCard } from './MiniCard'
import { availability, status, statusByMode } from '../../data'

export function AvailabilityCard() {
  return (
    <MiniCard eyebrow="availability">
      <ul className="space-y-2 text-sm">
        <li className="text-ink flex items-center gap-2">
          <span className="shrink-0 text-xs">{statusByMode[status].emoji}</span>
          <span className="font-semibold">{statusByMode[status].label}</span>
          <span className="text-muted text-xs">{statusByMode[status].detail}</span>
        </li>
        <li className="text-ink flex items-center gap-2">
          <span className="text-accent inline-block size-1.5 shrink-0">◆</span>
          <span className="font-semibold">{availability.timezone}</span>
          <span className="text-muted text-xs">{availability.gmtOffset}</span>
        </li>
        <li className="text-ink flex items-center gap-2">
          <span className="text-accent inline-block size-1.5 shrink-0">◆</span>
          <span className="text-muted">Currently @</span>
          <span className="font-semibold">{availability.employer}</span>
        </li>
      </ul>
      <a
        href={availability.calUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-accent/40 bg-accent-soft text-accent-deep hover:bg-accent hover:text-paper mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors"
      >
        📅 Schedule a call →
      </a>
    </MiniCard>
  )
}
