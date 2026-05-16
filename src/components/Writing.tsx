import { Link } from 'react-router-dom'
import { SectionFrame } from './shared/SectionFrame'
import { writing } from '../data'
import type { WritingEntry } from '../data'

export function Writing() {
  return (
    <SectionFrame id="writing" eyebrow="// thinking out loud" title="Writing">
      <div className="space-y-4">
        {writing.map((w, i) => (
          <WritingCard key={w.title} entry={w} index={i} />
        ))}
      </div>
    </SectionFrame>
  )
}

function WritingCard({ entry: w, index: i }: { entry: WritingEntry; index: number }) {
  const className =
    'group bg-paper text-ink relative block rounded-md p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl md:p-7'
  const style = { transform: `rotate(${i % 2 === 0 ? -0.2 : 0.2}deg)` }
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-muted font-mono text-xs tracking-widest uppercase">{w.date}</p>
        <span className="text-muted group-hover:text-accent-deep text-sm font-semibold transition-colors">
          {w.slug ? 'Read →' : 'Coming soon'}
        </span>
      </div>
      <h3
        className="group-hover:text-accent-deep mt-2 text-xl leading-snug font-bold transition-colors md:text-2xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {w.title}
      </h3>
      <p className="text-ink-soft mt-2 max-w-2xl text-sm leading-relaxed">{w.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {w.tags.map((t) => (
          <span
            key={t}
            className="border-ink/15 text-ink-soft rounded-full border px-2 py-0.5 text-xs font-medium"
          >
            {t}
          </span>
        ))}
      </div>
    </>
  )

  if (w.slug) {
    return (
      <Link to={`/writing/${w.slug}`} className={className} style={style}>
        {body}
      </Link>
    )
  }
  return (
    <a href={w.href ?? '#'} className={className} style={style}>
      {body}
    </a>
  )
}
