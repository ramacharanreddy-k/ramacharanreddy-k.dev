import { IdentityCard } from './IdentityCard'
import { PitchCard } from './PitchCard'
import { AvailabilityCard } from './AvailabilityCard'
import { NumbersCard } from './NumbersCard'
import { BuildingNowCard } from './BuildingNowCard'
import { WorkedWithLogos } from './WorkedWithLogos'
import { RecognitionGrid } from './RecognitionGrid'

export function Hero() {
  return (
    <section id="about" className="relative pt-12 pb-6 md:pt-16 md:pb-8">
      <div className="grid gap-5 xl:grid-cols-[22fr_58fr_20fr] xl:items-stretch">
        {/* LEFT — IDENTITY */}
        <IdentityCard />

        {/* CENTER — MAIN PITCH */}
        <PitchCard />

        {/* RIGHT — DASHBOARD */}
        <div className="space-y-[14px] md:grid md:grid-cols-3 md:gap-[14px] md:space-y-0 xl:block xl:space-y-[14px]">
          <AvailabilityCard />
          <NumbersCard />
          <BuildingNowCard />
        </div>
      </div>

      {/* SELECTED CLIENTS */}
      <WorkedWithLogos />

      {/* RECOGNITION — pull quotes from real client leadership */}
      <RecognitionGrid />
    </section>
  )
}
