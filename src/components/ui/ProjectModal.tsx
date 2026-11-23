import { ArrowUpRight, FolderGit2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ProjectItem } from '@/data/portfolio'

interface ProjectModalProps {
  project: ProjectItem | null
  onClose: () => void
}

/**
 * Accessible dialog modal presenting deeper implementation notes, challenges,
 * and outcomes for a selected project.
 */
export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!project) {
      return
    }

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [project, onClose])

  if (!project) {
    return null
  }

  const isExternalDemo = Boolean(project.demoUrl?.startsWith('http'))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="theme-card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line-border)] bg-[var(--bg-surface)] p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[var(--line-border)] bg-[var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--accent)]">
                {project.origin}
              </span>
              {project.period && (
                <span className="font-mono text-xs text-[var(--fg-subtle)]">
                  {project.period}
                </span>
              )}
            </div>
            <h3
              id="project-modal-title"
              className="mt-3 font-display text-2xl font-bold text-[var(--fg-primary)]"
            >
              {project.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--accent)]">
              {project.tagline}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="rounded-lg border border-[var(--line-border)] p-2 text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[var(--fg-muted)]">
          <section>
            <h4 className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
              Overview
            </h4>
            <p className="mt-1.5">{project.summary}</p>
          </section>

          <section>
            <h4 className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
              Implementation
            </h4>
            <p className="mt-1.5">{project.implementation}</p>
          </section>

          <section>
            <h4 className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
              Challenges &amp; Trade-offs
            </h4>
            <p className="mt-1.5">{project.challenges}</p>
          </section>

          <section>
            <h4 className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">
              Outcomes
            </h4>
            <p className="mt-1.5">{project.outcomes}</p>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line-subtle)] pt-5">
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-xs text-[var(--fg-primary)]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                <FolderGit2 className="h-4 w-4" aria-hidden="true" />
                <span>View Repository</span>
              </a>
            )}

            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target={isExternalDemo ? '_blank' : undefined}
                rel={isExternalDemo ? 'noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                <span>{isExternalDemo ? 'Visit Live Site' : 'Preview'}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}

            {!project.repoUrl && !project.demoUrl && project.linkNote && (
              <span className="font-mono text-xs text-[var(--fg-subtle)]">
                {project.linkNote}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
