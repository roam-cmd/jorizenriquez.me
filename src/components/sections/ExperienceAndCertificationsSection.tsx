import TopoBackground from '@/components/kokonutui/topo-background'
import { RevealSection } from '@/components/motion/CodeToUIReveal'
import { CertificationsSection } from '@/components/sections/CertificationsSection'
import { ExperienceSection } from '@/components/sections/ExperienceSection'

/**
 * Combined Experience & Credentials section placing the Background Timeline
 * side-by-side with the interactive PageFlip credential book on desktop,
 * stacking cleanly on smaller viewports.
 */
export function ExperienceAndCertificationsSection() {
  return (
    <section
      aria-label="Experience and Certifications"
      className="overflow-x-clip border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="BackgroundAndCredentials"
        toggleOffsetClassName="top-6 right-5 sm:right-8"
      >
        <TopoBackground
          className="min-h-0 bg-transparent py-16 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] md:py-24"
          interval={0.14}
          speed={0.45}
          seed={33}
          labels={false}
        >
          <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-14 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
              <div id="experience" className="scroll-mt-24 lg:col-span-5">
                <ExperienceSection embedded />
              </div>
              <div id="certifications" className="scroll-mt-24 lg:col-span-7">
                <CertificationsSection embedded />
              </div>
            </div>
          </div>
        </TopoBackground>
      </RevealSection>
    </section>
  )
}
