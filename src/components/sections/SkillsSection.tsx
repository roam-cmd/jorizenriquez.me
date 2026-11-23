import {
  Cloud,
  Code2,
  Database,
  Layers,
  Monitor,
  Server,
  Wrench,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import TopoBackground from '@/components/kokonutui/topo-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  buildSkillCategoryCode,
  sectionHeaderCode,
  skillsSnippets,
} from '@/data/codeSnippets'
import { skillCategories } from '@/data/portfolio'
import { cn } from '@/lib/utils'

const PRIMARY_PILLARS = [
  {
    index: '01 // API',
    name: 'FastAPI',
    role: 'Typed Python APIs & Async Services',
    Icon: Zap,
  },
  {
    index: '02 // UI',
    name: 'React',
    role: 'Interactive Component Systems',
    Icon: Layers,
  },
  {
    index: '03 // DATA',
    name: 'PostgreSQL',
    role: 'Relational Modeling & Persistence',
    Icon: Database,
  },
] as const

const CORE_SKILLS = new Set([
  'TypeScript',
  'Python',
  'React.js',
  'Tailwind CSS',
  'FastAPI',
  'PostgreSQL',
  'Docker & Docker Compose',
  'AWS (EC2, IAM)',
  'Git/GitHub',
])

function getCategoryIcon(id: string) {
  switch (id) {
    case 'languages':
      return Code2
    case 'frontend':
      return Monitor
    case 'backend':
      return Server
    case 'databases':
      return Database
    case 'cloud':
      return Cloud
    default:
      return Wrench
  }
}

/**
 * Architectural Stack Ledger showcasing the Primary Stack trio, interactive
 * layer filters, and structured 6-row technical inventory.
 */
export function SkillsSection() {
  const [activeLayer, setActiveLayer] = useState<string>('all')

  const visibleCategories =
    activeLayer === 'all'
      ? skillCategories
      : skillCategories.filter((category) => category.id === activeLayer)

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="overflow-x-clip border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="SkillsSection"
        toggleOffsetClassName="top-6 right-5 sm:right-8"
      >
        <TopoBackground
          className="min-h-0 bg-transparent py-16 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] md:py-24"
          interval={0.14}
          speed={0.45}
          seed={14}
          labels={false}
        >
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div id="skills-heading">
              <CodeRevealItem
                code={sectionHeaderCode(
                  '02',
                  'SKILLS',
                  'Tools & Technical Stack'
                )}
              >
                <SectionHeader
                  index="02"
                  eyebrow="SKILLS"
                  title="Tools & Technical Stack"
                  description="Core technologies and supporting tools I use across backend APIs, interactive frontends, databases, and cloud deployments."
                />
              </CodeRevealItem>
            </div>

            {/* Primary Stack Architecture Trio */}
            <CodeRevealItem
              code={skillsSnippets.primaryPillars}
              className="mb-8"
            >
              <div className="theme-card grid divide-y divide-[var(--line-subtle)] overflow-hidden rounded-2xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] md:grid-cols-3 md:divide-x md:divide-y-0">
                {PRIMARY_PILLARS.map(({ index, name, role, Icon }) => (
                  <div
                    key={name}
                    className="group flex items-start gap-4 p-5 transition-colors hover:bg-[var(--accent-tint)]/35 sm:p-6"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line-border)] bg-[var(--bg-elevated)] text-[var(--accent)] transition-colors group-hover:border-[var(--accent)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="font-mono text-[11px] tracking-wider text-[var(--accent)] uppercase">
                        {index}
                      </span>
                      <h3 className="mt-1 font-display text-lg font-semibold text-[var(--fg-primary)]">
                        {name}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                        {role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CodeRevealItem>

            {/* Interactive Layer Filter */}
            <div
              role="group"
              aria-label="Filter technical stack layers"
              className="mb-6 flex flex-wrap items-center gap-2"
            >
              <CodeRevealItem
                code={skillsSnippets.layerFilterPill(
                  `All Layers (${skillCategories.length})`
                )}
                inline
              >
                <button
                  type="button"
                  onClick={() => setActiveLayer('all')}
                  aria-pressed={activeLayer === 'all'}
                  className={cn(
                    'inline-flex min-h-[40px] items-center rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors sm:min-h-[34px]',
                    activeLayer === 'all'
                      ? 'border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--accent-fg)]'
                      : 'border-[var(--line-border)] bg-[var(--bg-surface-translucent)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg-primary)]'
                  )}
                >
                  All Layers ({skillCategories.length})
                </button>
              </CodeRevealItem>

              {skillCategories.map((category) => {
                const isActive = activeLayer === category.id
                return (
                  <CodeRevealItem
                    key={category.id}
                    code={skillsSnippets.layerFilterPill(category.title)}
                    inline
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLayer(category.id)}
                      aria-pressed={isActive}
                      className={cn(
                        'inline-flex min-h-[40px] items-center rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors sm:min-h-[34px]',
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--accent-fg)]'
                          : 'border-[var(--line-border)] bg-[var(--bg-surface-translucent)] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg-primary)]'
                      )}
                    >
                      {category.title}
                    </button>
                  </CodeRevealItem>
                )
              })}
            </div>

            {/* Structured Engineering Stack Ledger */}
            <div className="theme-card divide-y divide-[var(--line-subtle)] overflow-hidden rounded-2xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)]">
              {visibleCategories.map((category) => {
                const CategoryIcon = getCategoryIcon(category.id)
                const originalIndex = skillCategories.findIndex(
                  (item) => item.id === category.id
                )
                const rowNumber = String(originalIndex + 1).padStart(2, '0')

                return (
                  <CodeRevealItem
                    key={category.id}
                    code={buildSkillCategoryCode(category)}
                  >
                    <article className="grid gap-5 p-6 transition-colors hover:bg-[var(--accent-tint)]/25 lg:grid-cols-12 lg:items-center lg:gap-8">
                      <div className="flex items-start gap-4 lg:col-span-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--line-border)] bg-[var(--bg-elevated)] text-[var(--accent)]">
                          <CategoryIcon
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-[var(--accent)]">
                              {rowNumber}
                            </span>
                            <h3 className="font-display text-base font-semibold text-[var(--fg-primary)]">
                              {category.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--fg-muted)]">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      <ul
                        className="flex flex-wrap gap-2 lg:col-span-8"
                        aria-label={category.title}
                      >
                        {category.skills.map((skill) => {
                          const isCore = CORE_SKILLS.has(skill)
                          return (
                            <li
                              key={skill}
                              className={cn(
                                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
                                isCore
                                  ? 'border-[var(--accent)]/45 bg-[var(--bg-elevated)] font-medium text-[var(--fg-primary)]'
                                  : 'border-[var(--line-border)] bg-[var(--bg-base)]/75 text-[var(--fg-muted)]'
                              )}
                            >
                              {isCore && (
                                <span
                                  aria-hidden="true"
                                  className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                                />
                              )}
                              <span>{skill}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </article>
                  </CodeRevealItem>
                )
              })}
            </div>
          </div>
        </TopoBackground>
      </RevealSection>
    </section>
  )
}
