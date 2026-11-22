import { ArrowUpRight, FolderGit2, Layers } from 'lucide-react'
import { memo } from 'react'
import { ProjectMiniPreview } from '@/components/ui/ProjectMiniPreview'
import type { ProjectItem } from '@/data/portfolio'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: ProjectItem
  onInspect: (project: ProjectItem) => void
  onSelectCard?: () => void
  isFeaturedSlot?: boolean
  shouldCompile?: boolean
  compileDelayMs?: number
}

/**
 * Reusable project showcase card with bespoke miniature dark-mode UI previews,
 * scanline code-to-interface reveal on the center spotlight, and card actions.
 */
export const ProjectCard = memo(function ProjectCard({
  project,
  onInspect,
  onSelectCard,
  isFeaturedSlot = false,
  shouldCompile = isFeaturedSlot,
  compileDelayMs = 250,
}: ProjectCardProps) {
  const isExternalDemo = Boolean(project.demoUrl?.startsWith('http'))
  const isSideClickable = !isFeaturedSlot && Boolean(onSelectCard)

  return (
    <article
      onClick={
        isSideClickable
          ? (event) => {
              if ((event.target as HTMLElement).closest('a, button')) {
                return
              }
              onSelectCard?.()
            }
          : undefined
      }
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-[var(--bg-surface-translucent)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isSideClickable && 'cursor-pointer',
        isFeaturedSlot
          ? 'z-20 -translate-y-2 border-[rgba(var(--accent-rgb),0.65)] border-t-2 border-t-[var(--accent)] opacity-100 ring-1 ring-[rgba(var(--accent-rgb),0.32)] shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.28),0_24px_54px_-14px_rgba(var(--accent-rgb),0.34),0_0_34px_-8px_rgba(var(--accent-rgb),0.22)] lg:-translate-y-4 lg:scale-[1.03]'
          : 'z-10 translate-y-3 scale-[0.93] border-[var(--line-subtle)] opacity-40 brightness-[0.82] hover:border-[var(--accent)] hover:opacity-65 hover:brightness-95'
      )}
    >
      <ProjectMiniPreview
        project={project}
        isActive={shouldCompile}
        compileDelayMs={compileDelayMs}
      />

      {/* Card content */}
      <div className="flex flex-1 flex-col p-5">
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
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
          {project.tagline}
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
})
