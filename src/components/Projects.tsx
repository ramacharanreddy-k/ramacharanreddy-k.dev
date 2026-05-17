import { SectionFrame } from './shared/SectionFrame'
import { projects } from '../data'

export function Projects() {
  return (
    <SectionFrame id="projects" eyebrow="// stuff I've built" title="Projects">
      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-paper text-ink relative block rounded-md p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{ transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
          >
            {p.pinned && (
              <span className="bg-accent text-ink absolute -top-2 right-4 rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase shadow">
                Pinned
              </span>
            )}
            <div className="bg-bg relative aspect-video overflow-hidden rounded-sm">
              {/* Blurred backdrop fills the box edge-to-edge */}
              <img
                src={p.cover}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              {/* Crisp image on top — full, not cropped */}
              <img
                src={p.cover}
                alt={`${p.name} cover`}
                className="relative h-full w-full object-contain"
                loading="lazy"
              />
              <span className="bg-bg/70 text-paper absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
                {p.type}
              </span>
              <span
                aria-hidden
                className="bg-bg/70 text-paper absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px] backdrop-blur-sm"
              >
                ↗
              </span>
            </div>
            <div className="mt-4 px-1 pb-1">
              <h3
                className="text-ink group-hover:text-accent-deep text-xl font-bold transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {p.name}
              </h3>
              <p className="text-ink-soft mt-2 text-sm leading-relaxed">{p.blurb}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="border-ink/15 text-ink-soft rounded-full border px-2 py-0.5 text-xs font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </SectionFrame>
  )
}
