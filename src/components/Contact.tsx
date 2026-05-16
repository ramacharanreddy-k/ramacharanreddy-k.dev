import { SectionFrame } from './shared/SectionFrame'
import { PaperCard } from './shared/PaperCard'
import { Pin } from './shared/Pin'
import { Highlight } from './shared/Highlight'
import { Cta } from './shared/Cta'

export function Contact() {
  return (
    <SectionFrame id="contact" eyebrow="// let's chat" title="Get in touch">
      <div className="relative mx-auto max-w-2xl">
        <Pin className="left-1/2 -translate-x-1/2" />
        <PaperCard rotate={-0.5}>
          <p
            className="text-ink text-2xl leading-snug font-bold md:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Got an interesting AI problem, <Highlight>a role to fill</Highlight>, or just want to
            compare notes on production LLM systems?
          </p>
          <p className="text-muted mt-4 text-base">
            My inbox is open. I usually reply within a day.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Cta href="mailto:ramacharanreddykasireddy@gmail.com" variant="primary" size="md">
              ramacharanreddykasireddy@gmail.com →
            </Cta>
            <Cta href="https://github.com/ramacharanreddy-k" variant="outline" size="md">
              GitHub ↗
            </Cta>
            <Cta href="https://www.linkedin.com/in/ramacharanreddy-k" variant="outline" size="md">
              LinkedIn ↗
            </Cta>
          </div>
        </PaperCard>
      </div>
    </SectionFrame>
  )
}
