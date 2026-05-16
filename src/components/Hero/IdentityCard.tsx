import type { ReactNode } from 'react'
import { SocialButton } from '../shared/SocialButton'
import { GitHubIcon, LinkedInIcon, MailIcon } from '../shared/Icons'
import { TopTab } from '../shared/TopTab'
import { Eyebrow } from '../shared/Eyebrow'
import { identity, status, upForByMode } from '../../data'
import type { SocialKind } from '../../data'

const socialIcons: Record<SocialKind, ReactNode> = {
  github: <GitHubIcon />,
  linkedin: <LinkedInIcon />,
  email: <MailIcon />,
}

export function IdentityCard() {
  return (
    <div className="bg-paper text-ink relative flex flex-col rounded-md p-4 shadow-md xl:h-full">
      <TopTab />

      {/* Photo */}
      <img
        src={identity.photo}
        alt={identity.name}
        className="aspect-square w-full rounded-sm object-cover grayscale-[15%]"
        loading="eager"
      />

      {/* Name + role */}
      <div className="mt-5">
        <p
          className="text-ink text-base leading-tight font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {identity.name}
        </p>
        <p className="text-muted mt-1 text-xs">{identity.role}</p>
      </div>

      {/* Facts table */}
      <div className="border-border/50 mt-4 space-y-1.5 border-t pt-3 text-xs">
        {identity.facts.map((f) => (
          <p key={f.label} className="text-ink-soft flex items-baseline justify-between gap-2">
            <span className="text-muted">{f.label}</span>
            <span className="text-right font-semibold">{f.value}</span>
          </p>
        ))}
      </div>

      {/* Pills — eyebrow + items both driven by current status (heads-down vs active) */}
      <div className="border-border/50 mt-4 border-t pt-3">
        <Eyebrow className="mb-2">{upForByMode[status].eyebrow}</Eyebrow>
        <div className="flex flex-wrap gap-1.5">
          {upForByMode[status].pills.map((t) => (
            <span
              key={t}
              className="border-accent/40 bg-accent-soft text-accent-deep rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Social icons — natural at small screens, pinned to bottom at xl+ */}
      <div className="border-border/50 mt-4 flex justify-center gap-2 border-t pt-4 xl:mt-auto">
        {identity.socials.map((s) => (
          <SocialButton key={s.kind} href={s.href} label={s.label}>
            {socialIcons[s.kind]}
          </SocialButton>
        ))}
      </div>
    </div>
  )
}
