export function Pin({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`bg-accent absolute -top-[0.4rem] z-10 size-3 rounded-full border-2 border-white/80 shadow-md ${className}`}
    />
  )
}
