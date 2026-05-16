import type { ReactNode } from 'react'
import { TopTab } from './TopTab'

export function PaperCard({
  children,
  rotate = 0,
  className = '',
}: {
  children: ReactNode
  rotate?: number
  className?: string
}) {
  return (
    <div
      className={`bg-paper text-ink relative rounded-md p-7 shadow-xl md:p-9 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <TopTab variant="large" />
      {children}
    </div>
  )
}
