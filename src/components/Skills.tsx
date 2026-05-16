import { SectionFrame } from './shared/SectionFrame'
import { skillGroups } from '../data'

export function Skills() {
  return (
    <SectionFrame id="skills" eyebrow="// what's in the toolbelt" title="Skills">
      <div className="grid gap-4 md:grid-cols-2">
        {skillGroups.map((group) => (
          <div key={group.label} className="bg-paper text-ink rounded-md p-5 shadow-md">
            <p className="text-accent-deep mb-3 text-xs font-bold tracking-widest uppercase">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="border-ink/20 text-ink hover:border-accent hover:bg-accent-soft hover:text-accent-deep bg-paper rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}
