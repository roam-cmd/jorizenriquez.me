import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  type KeyboardEvent,
  type TransitionEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import TopoBackground from '@/components/kokonutui/topo-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { ProjectModal } from '@/components/ui/ProjectModal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  buildProjectCardCode,
  projectsSnippets,
  sectionHeaderCode,
} from '@/data/codeSnippets'
import { type ProjectItem, projects } from '@/data/portfolio'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

function getVisibleCount(width: number): number {
  if (width >= 1024) {
    return 3
  }
  if (width >= 768) {
    return 2
  }
  return 1
}

/**
 * Interactive sliding project showcase displaying 3 cards on desktop (2 on
 * tablet, 1 on mobile) with fluid slot transitions, wrap-around controls,
 * and an accessible Details modal.
 */
export function ProjectsSection() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null
  )
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    typeof window === 'undefined' ? 3 : getVisibleCount(window.innerWidth)
  )
  const carouselRef = useRef<HTMLDivElement>(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const [navigationCount, setNavigationCount] = useState(0)
  const [trackPos, setTrackPos] = useState(projects.length)
  const [isTransitioning, setIsTransitioning] = useState(true)

  const loopedProjects = useMemo(
    () => [...projects, ...projects, ...projects],
    []
  )

  useEffect(() => {
    const node = carouselRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEnteredView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onResize = () => {
      setVisibleCount(getVisibleCount(window.innerWidth))
    }

    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const totalProjects = projects.length
  const activeProjectIndex =
    ((trackPos % totalProjects) + totalProjects) % totalProjects
  const leadingSlot = visibleCount === 3 ? trackPos - 1 : trackPos

  const handlePrev = () => {
    setNavigationCount((count) => count + 1)
    setIsTransitioning(true)
    setTrackPos((prev) =>
      prev <= 1 ? totalProjects + activeProjectIndex - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setNavigationCount((count) => count + 1)
    setIsTransitioning(true)
    setTrackPos((prev) =>
      prev >= totalProjects * 3 - 2
        ? totalProjects + activeProjectIndex + 1
        : prev + 1
    )
  }

  const handleSelectDot = (targetIdx: number) => {
    let delta = targetIdx - activeProjectIndex
    if (delta > totalProjects / 2) {
      delta -= totalProjects
    } else if (delta < -totalProjects / 2) {
      delta += totalProjects
    }
    if (delta === 0) {
      return
    }
    setNavigationCount((count) => count + 1)
    setIsTransitioning(true)
    setTrackPos((prev) => prev + delta)
  }

  const handleTrackTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== 'transform'
    ) {
      return
    }
    if (trackPos < totalProjects || trackPos >= totalProjects * 2) {
      setIsTransitioning(false)
      setTrackPos(totalProjects + activeProjectIndex)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNext()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlePrev()
    }
  }

  const activeNum = String(activeProjectIndex + 1).padStart(2, '0')
  const totalCount = String(totalProjects).padStart(2, '0')

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="ProjectsSection"
        revealAllOnEnter
        toggleOffsetClassName="top-6 right-4 sm:right-6"
      >
        <TopoBackground
          className="min-h-0 bg-transparent py-20 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] sm:py-24"
          interval={0.14}
          speed={0.45}
          seed={21}
          labels={false}
        >
          <div
            className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6"
            onKeyDown={handleKeyDown}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div id="projects-heading">
                <CodeRevealItem
                  code={sectionHeaderCode(
                    '03',
                    'PROJECTS',
                    'Selected Projects'
                  )}
                >
                  <SectionHeader
                    index="03"
                    eyebrow="PROJECTS"
                    title="Selected Projects"
                    description="Full-stack platforms, web tools, data analytics, and desktop/mobile projects I have built. Select Details on any card for a closer look."
                  />
                </CodeRevealItem>
              </div>

              {/* Navigation Control Dock */}
              <CodeRevealItem
                code={projectsSnippets.controls}
                inline
                className="mb-10 self-start sm:mb-12 sm:self-end"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-[var(--fg-muted)] tabular-nums">
                    {activeNum} / {totalCount}
                  </span>

                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous project"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next project"
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 font-mono text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
                    >
                      <span>Next Project</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </CodeRevealItem>
            </div>

            {/* Sliding Showcase Viewport */}
            <div
              ref={carouselRef}
              role="region"
              aria-roledescription="carousel"
              aria-label="Selected projects showcase"
              className="overflow-hidden py-8"
            >
              <div
                onTransitionEnd={handleTrackTransitionEnd}
                className={cn(
                  'flex gap-6 will-change-transform',
                  !prefersReducedMotion &&
                    isTransitioning &&
                    'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
                )}
                style={{
                  transform: `translate3d(calc(-${leadingSlot} * ((100% + 24px) / ${visibleCount})), 0, 0)`,
                }}
              >
                {loopedProjects.map((project, slotIndex) => {
                  const slotProjectIndex = slotIndex % totalProjects
                  const isFeatured = slotProjectIndex === activeProjectIndex

                  return (
                    <div
                      key={`${project.id}-${slotIndex}`}
                      className={cn(
                        'relative shrink-0',
                        isFeatured ? 'z-20' : 'z-10'
                      )}
                      style={{
                        width: `calc((100% - ${(visibleCount - 1) * 24}px) / ${visibleCount})`,
                      }}
                    >
                      <CodeRevealItem
                        code={buildProjectCardCode(project)}
                        className="h-full"
                      >
                        <ProjectCard
                          project={project}
                          onInspect={setSelectedProject}
                          onSelectCard={
                            isFeatured
                              ? undefined
                              : slotIndex < trackPos
                                ? handlePrev
                                : handleNext
                          }
                          isFeaturedSlot={isFeatured}
                          shouldCompile={isFeatured && hasEnteredView}
                          compileDelayMs={navigationCount === 0 ? 1150 : 250}
                        />
                      </CodeRevealItem>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Slot Progress Indicators */}
            <div className="mt-4 flex justify-center">
              <CodeRevealItem
                code={projectsSnippets.progressDots(totalProjects)}
                inline
              >
                <div
                  className="flex min-h-6 min-w-[140px] items-center justify-center gap-2 px-1"
                  role="tablist"
                  aria-label="Select featured project"
                >
                  {projects.map((project, slotIdx) => {
                    const isActive = slotIdx === activeProjectIndex
                    return (
                      <button
                        key={project.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Center project ${project.title}`}
                        onClick={() => handleSelectDot(slotIdx)}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          isActive
                            ? 'w-8 bg-[var(--accent)]'
                            : 'w-2.5 bg-[var(--line-border)] hover:bg-[var(--fg-muted)]'
                        )}
                      />
                    )
                  })}
                </div>
              </CodeRevealItem>
            </div>
          </div>
        </TopoBackground>
      </RevealSection>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}
