import { ArrowUpRight, FolderGit2, Layers } from 'lucide-react'
import type { ProjectItem } from '@/data/portfolio'

interface ProjectCardProps {
  project: ProjectItem
  onInspect: (project: ProjectItem) => void
  isFeaturedSlot?: boolean
}

/**
 * Reusable project showcase card with architectural preview, honest origin
 * and period labels, technology tags, and conditional live/repo actions.
 */
export function ProjectCard({
  project,
  onInspect,
  isFeaturedSlot = false,
}: ProjectCardProps) {
  const isExternalDemo = Boolean(project.demoUrl?.startsWith('http'))

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] backdrop-blur-[2px] transition-all duration-300 hover:border-[var(--accent)] ${
        isFeaturedSlot
          ? 'border-t-2 border-t-[var(--accent)] lg:-translate-y-1'
          : ''
      }`}
    >
      {/* Stylized 16:9 wireframe preview */}
      <div
        aria-hidden="true"
        className="relative aspect-video w-full overflow-hidden border-b border-[var(--line-subtle)] bg-[var(--bg-base)] p-4"
      >
        <div className="flex h-full flex-col justify-between rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-soft)]" />
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]/70" />
            </div>
            <span className="font-mono text-[10px] text-[var(--fg-muted)]">
              {project.previewVariant}.tsx
            </span>
          </div>

          {project.previewVariant === 'editor' && (
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 h-12 rounded bg-[var(--bg-elevated)]" />
              <div className="col-span-2 space-y-1.5">
                <div className="h-3 w-4/5 rounded bg-[var(--accent-soft)]/60" />
                <div className="h-3 w-3/5 rounded bg-[var(--accent)]/25" />
                <div className="h-3 w-2/3 rounded bg-[var(--bg-elevated)]" />
              </div>
            </div>
          )}

          {project.previewVariant === 'topology' && (
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="h-8 w-8 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-elevated)]" />
              <div className="h-px flex-1 bg-[var(--accent-soft)]" />
              <div className="h-10 w-10 rounded-full border border-[var(--accent)]/50 bg-[var(--accent-soft)]/35" />
              <div className="h-px flex-1 bg-[var(--accent-soft)]" />
              <div className="h-8 w-8 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-elevated)]" />
            </div>
          )}

          {project.previewVariant === 'grid' && (
            <div className="grid grid-cols-4 gap-1.5">
              <div className="col-span-2 h-11 rounded bg-[var(--bg-elevated)]" />
              <div className="col-span-2 h-11 rounded bg-[var(--accent-soft)]/45" />
            </div>
          )}
        </div>
      </div>

      {/* Card content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-[var(--line-border)] bg-[var(--bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--accent)]">
            {project.origin}
          </span>
          {project.period && (
            <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
              {project.period}
            </span>
          )}
        </div>

        <h3 className="mt-3 font-display text-xl font-semibold text-[var(--fg-primary)]">
          {project.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-[var(--accent)]">
          {project.tagline}
        </p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
          {project.summary}
        </p>

        {/* Tech stack */}
        <ul
          className="mt-5 flex flex-wrap gap-1.5"
          aria-label="Technologies used"
        >
          {project.technologies.map((tech) => (
            <li
              key={tech}
              className="rounded-md border border-[var(--line-border)] bg-[var(--bg-base)] px-2.5 py-1 font-mono text-[11px] text-[var(--fg-primary)]"
            >
              {tech}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--line-subtle)] pt-4">
          <button
            type="button"
            onClick={() => onInspect(project)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Details</span>
          </button>

          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-border)] px-3 py-2 text-xs font-medium text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Repository</span>
            </a>
          )}

          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target={isExternalDemo ? '_blank' : undefined}
              rel={isExternalDemo ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-border)] px-3 py-2 text-xs font-medium text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
            >
              <span>{isExternalDemo ? 'Live Site' : 'Preview'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}

          {!project.repoUrl && !project.demoUrl && project.linkNote && (
            <span className="font-mono text-[11px] text-[var(--fg-subtle)]">
              {project.linkNote}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
