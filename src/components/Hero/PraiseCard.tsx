import { TopTab } from '../shared/TopTab'
import { Eyebrow } from '../shared/Eyebrow'

export function PraiseCard({
  text,
  source,
  client,
}: {
  text: string
  source: string
  client: string
}) {
  return (
    <div className="bg-paper text-ink relative rounded-md p-6 shadow-md md:p-7">
      <TopTab />
      <Eyebrow className="mb-3">recognition · {client}</Eyebrow>
      <p
        className="text-ink relative pl-5 text-sm leading-relaxed font-medium md:text-base"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span
          className="text-accent absolute top-0 left-0 text-2xl leading-none font-bold"
          aria-hidden
        >
          &ldquo;
        </span>
        {text}
      </p>
      <p className="text-muted mt-4 text-xs font-semibold tracking-wide">— {source}</p>
    </div>
  )
}
