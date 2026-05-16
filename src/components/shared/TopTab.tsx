/**
 * Cyan accent strip that sits at the top of paper cards.
 * - `small` (default): thin, left-aligned — used on MiniCards, IdentityCard, PraiseCard
 * - `large`: thicker, centered — used on the big PaperCard
 */
export function TopTab({ variant = 'small' }: { variant?: 'small' | 'large' }) {
  if (variant === 'large') {
    return (
      <span
        className="bg-accent absolute top-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-b-sm"
        aria-hidden
      />
    )
  }
  return (
    <span
      className="bg-accent absolute top-0 left-5 h-0.5 w-10 rounded-b-sm"
      aria-hidden
    />
  )
}
