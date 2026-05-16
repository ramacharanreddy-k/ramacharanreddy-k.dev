import { PraiseCard } from './PraiseCard'
import { recognition } from '../../data'

export function RecognitionGrid() {
  return (
    <div className="mt-12 grid gap-4 md:grid-cols-2">
      {recognition.map((r) => (
        <PraiseCard key={r.client} text={r.text} source={r.source} client={r.client} />
      ))}
    </div>
  )
}
