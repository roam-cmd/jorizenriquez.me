import { useState } from 'react'
import TopoBackground from '@/components/kokonutui/topo-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  buildExperienceCardCode,
  experienceFilterCode,
  sectionHeaderCode,
} from '@/data/codeSnippets'
import { type TimelineCategory, experienceItems } from '@/data/portfolio'
import { cn } from '@/lib/utils'

const FILTERS: ('All' | TimelineCategory)[] = [
  'All',
  'Education',
  'Achievements',
]

export interface ExperienceSectionProps {
  embedded?: boolean
}

/**
 * Flexible Experience & Education timeline over Kokonut UI TopoBackground
 * with interactive category filtering and simultaneous code-to-UI reveal.
 */
export function ExperienceSection({ embedded = false }: ExperienceSectionProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | TimelineCategory>(
    'All'
  )

  const filteredItems = experienceItems.filter(
    (item) => activeFilter === 'All' || item.category === activeFilter
  )

  const content = (
    <div
      className={cn(
        'relative z-10 w-full',
        !embedded && 'mx-auto max-w-6xl px-4 sm:px-6'
      )}
    >
      <div
        className={cn(
          'flex flex-col justify-between gap-6',
          !embedded && 'sm:flex-row sm:items-end'
        )}
      >
        <div id={embedded ? undefined : 'experience-heading'}>
          <CodeRevealItem
            code={sectionHeaderCode(
              '04',
              'EDUCATION & ACHIEVEMENTS',
              'Background Timeline'
            )}
          >
            <SectionHeader
              index="04"
              eyebrow="EDUCATION & ACHIEVEMENTS"
              title="Background Timeline"
              description="Academic background, honors, and competitive programming milestones."
            />
          </CodeRevealItem>
        </div>

        <CodeRevealItem
          code={experienceFilterCode}
          inline
          className={cn(
            'self-start',
            embedded ? 'mb-6' : 'mb-10 sm:mb-12'
          )}
        >
                <div
                  role="group"
                  aria-label="Filter timeline entries"
                  className="inline-flex rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] p-1 backdrop-blur-[2px]"
                >
                  {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        aria-pressed={isActive}
                        className={cn(
                          'rounded-md px-3 py-1.5 font-mono text-xs transition-colors',
                          isActive
                            ? 'bg-[var(--bg-elevated)] text-[var(--fg-primary)]'
                            : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
                        )}
                      >
                        {filter}
                      </button>
                    )
                  })}
                </div>
              </CodeRevealItem>
            </div>

            <ol className="relative space-y-6 border-l border-[var(--line-border)] pl-6 sm:pl-8">
              {filteredItems.map((entry) => (
                <li key={entry.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[31px] top-6 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-base)] sm:-left-[39px]"
                  />
                  <CodeRevealItem code={buildExperienceCardCode(entry)}>
                    <article className="rounded-xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] p-6 backdrop-blur-[2px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-[var(--accent)]">
                          {entry.period}
                        </span>
                        <span className="rounded-full border border-[var(--line-border)] bg-[var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--fg-primary)]">
                          {entry.category}
                        </span>
                      </div>

                      <h3 className="mt-2 font-display text-xl font-semibold text-[var(--fg-primary)]">
                        {entry.title}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-[var(--accent)]">
                        {entry.organization}
                        {entry.location ? ` · ${entry.location}` : ''}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
                        {entry.summary}
                      </p>

                      {entry.highlights.length > 0 && (
                        <ul className="mt-4 space-y-1.5 border-t border-[var(--line-subtle)] pt-4 text-sm text-[var(--fg-muted)]">
                          {entry.highlights.map((bullet, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span
                                className="text-[var(--accent)]"
                                aria-hidden="true"
                              >
                                &rsaquo;
                              </span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </CodeRevealItem>
                </li>
              ))}
            </ol>
          </div>
  )

  if (embedded) {
    return content
  }

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="ExperienceSection"
        toggleOffsetClassName="top-6 right-4 sm:right-6"
      >
        <TopoBackground
          className="min-h-0 bg-transparent py-20 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] sm:py-24"
          interval={0.14}
          speed={0.45}
          seed={33}
          labels={false}
        >
          {content}
        </TopoBackground>
      </RevealSection>
    </section>
  )
}
