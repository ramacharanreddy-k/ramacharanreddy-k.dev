import { PaperCard } from '../shared/PaperCard'
import { Highlight } from '../shared/Highlight'
import { Eyebrow } from '../shared/Eyebrow'
import { Cta } from '../shared/Cta'
import { ResumeButton } from '../shared/ResumeButton'
import { Pillar } from './Pillar'
import { heroPillars, pitch } from '../../data'

export function PitchCard() {
  return (
    <PaperCard>
      <h1
        className="text-ink text-3xl leading-[1.08] font-bold tracking-tight md:text-4xl lg:text-5xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {pitch.headline.before}
        <Highlight>{pitch.headline.highlight}</Highlight>
        {pitch.headline.after}
      </h1>
      <p className="text-ink-soft mt-5 max-w-xl text-sm leading-relaxed md:text-base">
        {pitch.caption}
      </p>

      {/* How I work — story arc: SEE → SHAPE → SHIP */}
      <div className="border-ink/15 mt-6 border-t pt-5">
        <Eyebrow className="mb-4">
          how I work <span className="text-ink-soft">— from signal to ship</span>
        </Eyebrow>
        <div className="grid gap-5 md:grid-cols-[3fr_4fr_3fr]">
          {heroPillars.map((p) => (
            <Pillar
              key={p.num}
              num={p.num}
              verb={p.verb}
              area={p.area}
              body={p.body}
              punchline={p.punchline}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {pitch.ctas.map((cta) => (
          <Cta key={cta.label} href={cta.href} variant={cta.variant}>
            {cta.label}
          </Cta>
        ))}
        <ResumeButton />
      </div>
    </PaperCard>
  )
}
