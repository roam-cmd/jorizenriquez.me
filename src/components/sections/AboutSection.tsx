import profilePhoto from '@/assets/profile.jpg'
import HalftoneBackground from '@/components/kokonutui/halftone-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { aboutSnippets, sectionHeaderCode } from '@/data/codeSnippets'
import { aboutData } from '@/data/portfolio'

/**
 * About section combining Kokonut UI HalftoneBackground with a vertically
 * centered two-column layout.
 */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="AboutSection"
        toggleOffsetClassName="top-6 right-4 sm:right-6"
      >
        <HalftoneBackground
          className="min-h-0 bg-transparent py-20 dark:bg-transparent sm:py-24"
          inkClassName="text-[var(--accent-soft)]"
          canvasClassName="opacity-45"
          cell={13}
          angle={45}
          loupe
        >
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="space-y-6 lg:col-span-7">
                <div id="about-heading">
                  <CodeRevealItem
                    code={sectionHeaderCode(
                      '01',
                      'ABOUT',
                      'Background & Engineering Approach'
                    )}
                  >
                    <SectionHeader
                      index="01"
                      eyebrow="ABOUT"
                      title="Background & Engineering Approach"
                      description="An honest overview of how I think about building software and where my curiosity is focused."
                    />
                  </CodeRevealItem>
                </div>

                <CodeRevealItem code={aboutSnippets.narrative}>
                  <div className="space-y-5">
                    {aboutData.paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-base leading-relaxed text-[var(--fg-muted)]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CodeRevealItem>

                <div className="grid gap-4 pt-2 sm:grid-cols-3">
                  {aboutData.focusAreas.map((area) => (
                    <CodeRevealItem
                      key={area.label}
                      code={aboutSnippets.focusCard(area.label, area.detail)}
                      className="h-full"
                    >
                      <div className="h-full rounded-xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] p-4 backdrop-blur-[2px]">
                        <h3 className="font-display text-sm font-semibold text-[var(--fg-primary)]">
                          {area.label}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--fg-muted)]">
                          {area.detail}
                        </p>
                      </div>
                    </CodeRevealItem>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
                <CodeRevealItem code={aboutSnippets.snapshot}>
                  <aside
                    aria-label="Developer profile snapshot"
                    className="rounded-2xl border border-[var(--line-border)] bg-[var(--bg-elevated-soft)] p-6 backdrop-blur-[2px]"
                  >
                    <div className="mb-5 overflow-hidden rounded-xl border border-[var(--line-border)] bg-[var(--bg-base)]">
                      <img
                        src={profilePhoto}
                        alt="Portrait of Joriz Enriquez"
                        loading="lazy"
                        className="aspect-[4/4] max-h-[290px] w-full object-cover object-top"
                      />
                    </div>
                    <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
                      Profile Snapshot
                    </p>
                    <dl className="mt-4 divide-y divide-[var(--line-subtle)]">
                      {aboutData.snapshot.map((item) => (
                        <div
                          key={item.label}
                          className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <dt className="font-mono text-xs text-[var(--fg-muted)]">
                            {item.label}
                          </dt>
                          <dd className="text-sm font-medium text-[var(--fg-primary)]">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </aside>
                </CodeRevealItem>
              </div>
            </div>
          </div>
        </HalftoneBackground>
      </RevealSection>
    </section>
  )
}
