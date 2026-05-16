import { Eyebrow } from '../shared/Eyebrow'
import { useScrollToSection } from '../shared/useScrollToSection'
import { clientLogos } from '../../data'

export function WorkedWithLogos() {
  const goTo = useScrollToSection()

  return (
    <div className="border-border/50 mt-12 border-t pt-10">
      <Eyebrow className="mb-5 text-center">worked with</Eyebrow>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {clientLogos.map((c) => {
          const href = c.href ?? '#projects'
          const onClick = href.startsWith('#') ? goTo(href.slice(1)) : undefined
          return (
            <li key={c.name}>
              <a
                href={href}
                onClick={onClick}
                title={c.name}
                className="bg-paper flex h-20 items-center justify-center rounded-md px-4 py-3 shadow-md transition-transform hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={c.src}
                  alt={c.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
