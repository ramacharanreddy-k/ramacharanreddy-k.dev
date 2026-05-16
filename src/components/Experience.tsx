import { useState } from 'react'
import { SectionFrame } from './shared/SectionFrame'
import { Eyebrow } from './shared/Eyebrow'
import { experience } from '../data'
import type { Job, ProjectBullet } from '../data'

/**
 * Experience section — horizontal underline tabs per company,
 * with all of the selected company's projects expanded inline below.
 */
export function Experience() {
  const [active, setActive] = useState(0)
  const job = experience[active]
  const projects = job.bullets.filter(isProject)

  return (
    <SectionFrame id="experience" eyebrow="// where I've worked" title="Experience">
      <div className="bg-paper text-ink overflow-hidden rounded-md shadow-md">
        <CompanyTabs active={active} onChange={setActive} />
        <div className="p-6 md:p-8">
          <JobHeader job={job} />
          <Eyebrow className="mb-3">projects</Eyebrow>
          <div className="space-y-3">
            {projects.map((p) => (
              <ProjectCard key={p.client} project={p} />
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  )
}

/* ─────────── Sub-components ─────────── */

function CompanyTabs({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <nav className="border-border/50 flex overflow-x-auto border-b" aria-label="Companies">
      {experience.map((j, idx) => {
        const isActive = idx === active
        return (
          <button
            key={j.company}
            onClick={() => onChange(idx)}
            aria-current={isActive ? 'true' : undefined}
            className={`relative px-5 py-4 text-sm whitespace-nowrap transition-colors ${
              isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink-soft'
            }`}
          >
            <span style={{ fontFamily: 'var(--font-display)' }}>{j.company}</span>
            <span className="text-muted ml-2 font-mono text-[10px] tracking-wide uppercase">
              {j.period}
            </span>
            {isActive && (
              <span className="bg-accent absolute right-0 bottom-0 left-0 h-0.5" aria-hidden />
            )}
          </button>
        )
      })}
    </nav>
  )
}

function JobHeader({ job }: { job: Job }) {
  return (
    <header className="border-border/50 mb-6 border-b pb-5">
      <h3
        className="text-ink text-xl leading-tight font-bold md:text-2xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {job.role}
      </h3>
      <p className="text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-ink-soft font-semibold">{job.company}</span>
        <Dot />
        <span>{job.location}</span>
        <Dot />
        <span className="text-accent-deep font-mono tracking-wide uppercase">{job.period}</span>
      </p>
    </header>
  )
}

function ProjectCard({ project: p }: { project: ProjectBullet }) {
  return (
    <article className="border-border/50 hover:border-accent/40 rounded-md border p-4 transition-colors">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <h4
          className="text-ink text-sm font-bold md:text-base"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {p.client}
        </h4>
        {p.current && (
          <span className="bg-accent text-ink rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
            Current
          </span>
        )}
      </div>
      <p className="text-ink-soft text-xs leading-relaxed md:text-sm">{p.text}</p>
      {p.tags && p.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span
              key={t}
              className="bg-accent-soft/50 text-accent-deep rounded px-1.5 py-0.5 text-[10px] font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function Dot() {
  return <span className="text-border">·</span>
}

/* ─────────── Helpers ─────────── */

const isProject = (b: Job['bullets'][number]): b is ProjectBullet => typeof b !== 'string'
