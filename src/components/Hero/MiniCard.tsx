import type { ReactNode } from 'react'
import { TopTab } from '../shared/TopTab'
import { Eyebrow } from '../shared/Eyebrow'

export function MiniCard({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  return (
    <div className="bg-paper text-ink relative rounded-md p-5 shadow-md">
      <TopTab />
      <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
      {children}
    </div>
  )
}
