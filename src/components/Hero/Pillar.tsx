export function Pillar({
  num,
  verb,
  area,
  body,
  punchline,
}: {
  num: string
  verb: string
  area: string
  body: string
  punchline: string
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-muted font-mono text-[10px] font-bold tracking-widest">{num}</span>
        <p
          className="text-ink text-lg font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {verb}
        </p>
      </div>
      <p className="text-accent-deep mb-1.5 font-mono text-[10px] font-semibold tracking-widest uppercase">
        {area}
      </p>
      <p className="text-muted text-[13px] leading-snug">{body}</p>
      <p className="text-ink mt-auto pt-3 text-[13px] font-semibold italic">{punchline}</p>
    </div>
  )
}
