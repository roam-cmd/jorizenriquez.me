import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { ProjectItem } from '@/data/portfolio'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { type TokenType, tokenizeCodeLines } from '@/lib/syntaxHighlight'
import { cn } from '@/lib/utils'

interface ProjectMiniPreviewProps {
  project: ProjectItem
  isActive: boolean
  compileDelayMs?: number
}

const DARK_PREVIEW_TOKEN_CLASS: Record<TokenType, string> = {
  comment: 'text-[var(--preview-subtle)] italic',
  keyword: 'text-[var(--preview-accent)] font-medium',
  string: 'text-[var(--preview-fg)]',
  tag: 'text-[var(--preview-accent)]',
  prop: 'text-[var(--preview-muted)]',
  type: 'text-[var(--preview-fg)]',
  punctuation: 'text-[var(--preview-subtle)]',
  plain: 'text-[var(--preview-fg)]',
}

function renderMiniMockup(projectId: string) {
  switch (projectId) {
    case 'diabetes-analytics': {
      const bars = [34, 52, 45, 76, 64, 92]
      return (
        <div className="flex h-full flex-col justify-between gap-2 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-[rgba(var(--preview-accent-rgb),0.22)] bg-[var(--preview-surface)] px-2.5 py-1.5">
              <p className="font-mono text-[8px] tracking-wider text-[var(--preview-muted)] uppercase">
                Dataset
              </p>
              <p className="mt-0.5 font-display text-xs font-bold text-[var(--preview-fg)]">
                100k+ Records
              </p>
            </div>
            <div className="rounded-md border border-[rgba(var(--preview-accent-rgb),0.22)] bg-[var(--preview-surface)] px-2.5 py-1.5">
              <p className="font-mono text-[8px] tracking-wider text-[var(--preview-muted)] uppercase">
                Model
              </p>
              <p className="mt-0.5 font-display text-xs font-bold text-[var(--preview-accent)]">
                Star Schema
              </p>
            </div>
          </div>

          <div className="relative flex flex-1 items-end gap-1.5 rounded-md border border-white/10 bg-[var(--preview-chrome)] px-2.5 pt-3 pb-2">
            <svg
              viewBox="0 0 120 36"
              className="pointer-events-none absolute inset-x-2 top-1.5 h-8 w-[calc(100%-1rem)]"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="var(--preview-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="6,28 28,20 50,23 72,11 94,15 114,5"
              />
            </svg>
            {bars.map((heightPct, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${heightPct}%`,
                  background:
                    'linear-gradient(to top, rgba(var(--preview-accent-rgb), 0.3), rgba(var(--preview-accent-rgb), 0.85))',
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    case 'trimclick': {
      const days = [
        { label: 'Tue', num: '12', active: false },
        { label: 'Wed', num: '13', active: false },
        { label: 'Thu', num: '14', active: true },
        { label: 'Fri', num: '15', active: false },
        { label: 'Sat', num: '16', active: false },
      ]
      const slots = ['09:00', '10:30', '13:15', '15:00']
      return (
        <div className="flex h-full flex-col justify-between gap-2 p-2.5">
          <div className="grid grid-cols-5 gap-1">
            {days.map((day) => (
              <div
                key={day.num}
                className={cn(
                  'rounded border py-1 text-center font-mono',
                  day.active
                    ? 'border-[rgba(var(--preview-accent-rgb),0.7)] bg-[rgba(var(--preview-accent-rgb),0.16)] text-[var(--preview-accent)]'
                    : 'border-white/10 bg-[var(--preview-surface)] text-[var(--preview-muted)]'
                )}
              >
                <div className="text-[8px]">{day.label}</div>
                <div className="text-[10px] font-semibold">{day.num}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((slot) => {
              const selected = slot === '10:30'
              return (
                <div
                  key={slot}
                  className={cn(
                    'rounded border py-1.5 text-center font-mono text-[9px]',
                    selected
                      ? 'border-[var(--preview-accent)] bg-[var(--preview-accent)] font-semibold text-[var(--preview-accent-fg)]'
                      : 'border-white/10 bg-[var(--preview-surface)] text-[var(--preview-fg)]'
                  )}
                >
                  {slot}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between rounded-md border border-white/10 bg-[var(--preview-chrome)] px-2.5 py-1.5">
            <span className="rounded-full border border-[rgba(var(--preview-accent-rgb),0.38)] bg-[rgba(var(--preview-accent-rgb),0.12)] px-2 py-0.5 font-mono text-[9px] text-[var(--preview-accent)]">
              Loyalty -15%
            </span>
            <span className="rounded bg-[var(--preview-accent)] px-2 py-0.5 font-mono text-[9px] font-semibold text-[var(--preview-accent-fg)]">
              Confirm Cut
            </span>
          </div>
        </div>
      )
    }

    case 'chronolist': {
      const tasks = [
        { label: 'Review algorithm notes', done: true },
        { label: 'Draft weekly diary log', done: true },
        { label: 'Prep UI layout specs', done: false },
      ]
      return (
        <div className="grid h-full grid-cols-12 gap-2 p-2.5">
          <div className="col-span-3 flex flex-col justify-between rounded-md border border-white/10 bg-[var(--preview-chrome)] p-1.5 font-mono text-[8px]">
            <div className="space-y-1">
              <div className="rounded bg-[rgba(var(--preview-accent-rgb),0.16)] px-1.5 py-0.5 text-[var(--preview-accent)]">
                Tasks
              </div>
              <div className="px-1.5 py-0.5 text-[var(--preview-muted)]">
                Diary
              </div>
              <div className="px-1.5 py-0.5 text-[var(--preview-muted)]">
                Events
              </div>
            </div>
            <div className="px-1.5 text-[7px] text-[var(--preview-subtle)]">
              Tkinter
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-between rounded-md border border-white/10 bg-[var(--preview-surface)] p-2">
            <span className="font-mono text-[8px] tracking-wider text-[var(--preview-muted)] uppercase">
              Daily Tasks
            </span>
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div key={task.label} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-[2px] border text-[7px]',
                      task.done
                        ? 'border-[var(--preview-accent)] bg-[var(--preview-accent)] text-[var(--preview-accent-fg)]'
                        : 'border-[var(--preview-subtle)]'
                    )}
                  >
                    {task.done ? '✓' : ''}
                  </span>
                  <span
                    className={cn(
                      'truncate text-[9px]',
                      task.done
                        ? 'text-[var(--preview-muted)] line-through'
                        : 'text-[var(--preview-fg)]'
                    )}
                  >
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-4 flex flex-col justify-between rounded-md border border-white/10 bg-[var(--preview-surface)] p-2">
            <div className="flex items-center justify-between font-mono text-[8px]">
              <span className="text-[var(--preview-accent)]">DEC 14</span>
              <span className="text-[var(--preview-muted)]">DIARY</span>
            </div>
            <div className="grid grid-cols-5 gap-0.5">
              {Array.from({ length: 10 }, (_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'h-2 rounded-[2px]',
                    idx === 6 ? 'bg-[var(--preview-accent)]' : 'bg-white/10'
                  )}
                />
              ))}
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded bg-white/15" />
              <div className="h-1 w-3/4 rounded bg-[rgba(var(--preview-accent-rgb),0.4)]" />
            </div>
          </div>
        </div>
      )
    }

    case 'blockbased-hrms':
      return (
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden p-2.5"
          style={{
            backgroundImage:
              'radial-gradient(rgba(var(--preview-accent-rgb), 0.18) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-[rgba(var(--preview-accent-rgb),0.38)] bg-[var(--preview-chrome)]/90 px-2 py-0.5 font-mono text-[8px] text-[var(--preview-accent)]">
              AUDIT VERIFIED
            </span>
            <span className="font-mono text-[8px] text-[var(--preview-muted)]">
              React Flow · SHA-256
            </span>
          </div>

          <div className="relative my-auto flex items-center justify-between gap-1.5">
            <svg
              viewBox="0 0 220 40"
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M 52 20 C 70 20, 72 20, 86 20"
                fill="none"
                stroke="var(--preview-accent)"
                strokeWidth="1.5"
                strokeOpacity="0.65"
              />
              <path
                d="M 134 20 C 150 20, 152 20, 168 20"
                fill="none"
                stroke="var(--preview-accent)"
                strokeWidth="1.5"
                strokeOpacity="0.65"
              />
            </svg>

            <div className="relative z-10 rounded-md border border-white/15 bg-[var(--preview-surface)] px-2 py-1.5 text-center">
              <div className="font-mono text-[7px] text-[var(--preview-muted)]">
                01
              </div>
              <div className="text-[9px] font-medium text-[var(--preview-fg)]">
                Doc Intake
              </div>
            </div>

            <div className="relative z-10 rounded-md border border-[rgba(var(--preview-accent-rgb),0.72)] bg-[var(--preview-window)] px-2.5 py-1.5 text-center shadow-[0_0_12px_rgba(var(--preview-accent-rgb),0.22)]">
              <div className="font-mono text-[7px] text-[var(--preview-accent)]">
                HASH
              </div>
              <div className="text-[9px] font-semibold text-[var(--preview-fg)]">
                SHA-256 Chain
              </div>
            </div>

            <div className="relative z-10 rounded-md border border-white/15 bg-[var(--preview-surface)] px-2 py-1.5 text-center">
              <div className="font-mono text-[7px] text-[var(--preview-muted)]">
                DR
              </div>
              <div className="text-[9px] font-medium text-[var(--preview-fg)]">
                Cloud Sync
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[8px] text-[var(--preview-muted)]">
            <span>Block #482 · Tamper-proof</span>
            <span className="text-[var(--preview-accent)]">99.98% OK</span>
          </div>
        </div>
      )

    case 'assay-coin':
      return (
        <div className="grid h-full grid-cols-12 items-center gap-2.5 p-2.5">
          <div className="col-span-6 flex items-center justify-center">
            <div className="h-[112px] w-[112px] shrink-0 rounded-md border border-white/10 bg-[var(--preview-chrome)] p-1.5">
              <div className="grid h-full w-full grid-cols-9 grid-rows-9 gap-[2px]">
                {Array.from({ length: 81 }, (_, idx) => {
                  const isCenter = idx === 40
                  const isHighlight = idx === 22 || idx === 31 || idx === 50
                  return (
                    <span
                      key={idx}
                      className={cn(
                        'block h-full w-full rounded-[1px]',
                        isCenter
                          ? 'bg-[var(--preview-accent)] shadow-[0_0_6px_rgba(var(--preview-accent-rgb),0.9)]'
                          : isHighlight
                            ? 'bg-[rgba(var(--preview-accent-rgb),0.52)]'
                            : idx % 5 === 0
                              ? 'bg-white/25'
                              : 'bg-white/10'
                      )}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <div className="col-span-6 flex h-full flex-col justify-between rounded-md border border-white/10 bg-[var(--preview-surface)] p-2">
            <div>
              <span className="font-mono text-[8px] tracking-wider text-[var(--preview-accent)] uppercase">
                9×9 City Grid
              </span>
              <p className="mt-0.5 font-display text-xs font-bold text-[var(--preview-fg)]">
                Persona: Saver
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[8px] text-[var(--preview-muted)]">
                <span>Reserve</span>
                <span className="text-[var(--preview-accent)]">$12.4k</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-[var(--preview-accent)]" />
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-[rgba(var(--preview-accent-rgb),0.5)]" />
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="flex h-full items-center justify-center p-2.5">
          <div className="flex h-full w-44 flex-col justify-between rounded-xl border border-[rgba(var(--preview-accent-rgb),0.28)] bg-[var(--preview-chrome)] p-2">
            <div className="mx-auto h-1 w-8 rounded-full bg-white/15" />

            <div className="rounded-lg border border-[rgba(var(--preview-accent-rgb),0.38)] bg-[var(--preview-surface)] p-2">
              <div className="flex items-center justify-between font-mono text-[8px]">
                <span className="text-[var(--preview-accent)]">ADJ</span>
                <span className="text-[var(--preview-muted)]">14 / 40</span>
              </div>
              <p className="mt-0.5 font-display text-xs font-bold text-[var(--preview-fg)]">
                Ephemeral
              </p>
              <p className="mt-0.5 text-[9px] leading-tight text-[var(--preview-muted)]">
                Lasting for a very short time.
              </p>
            </div>

            <div className="flex items-center justify-between rounded border border-white/10 bg-[var(--preview-surface)]/70 px-2 py-1 font-mono text-[8px] text-[var(--preview-muted)]">
              <span>Next: Lucid</span>
              <span className="text-[var(--preview-accent)]">Scroll ↓</span>
            </div>
          </div>
        </div>
      )
  }
}

/**
 * Miniature dark-mode preview window that rests as syntax-highlighted source code
 * on inactive cards and sweeps a vertical theme-matched scanline to reveal a bespoke
 * compiled UI mockup when the card enters the center spotlight.
 */
export function ProjectMiniPreview({
  project,
  isActive,
  compileDelayMs = 250,
}: ProjectMiniPreviewProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const tokenizedLines = useMemo(
    () => tokenizeCodeLines(project.previewCode),
    [project.previewCode]
  )

  const timingStyle = {
    '--scanline-delay': `${compileDelayMs}ms`,
    '--glow-delay': `${compileDelayMs + 520}ms`,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      style={timingStyle}
      className="relative h-52 w-full overflow-hidden border-b border-[var(--line-subtle)] bg-[var(--preview-bg)] p-3 sm:h-56"
    >
      {/* Radial theme-matched glow behind compiled preview */}
      <div
        key={isActive ? 'glow-active' : 'glow-idle'}
        className={cn(
          'pointer-events-none absolute inset-0',
          !isActive && 'opacity-0',
          isActive && prefersReducedMotion && 'opacity-100',
          isActive && !prefersReducedMotion && 'animate-preview-glow'
        )}
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 48%, rgba(var(--preview-accent-rgb), 0.30), rgba(var(--preview-accent-rgb), 0.10) 55%, transparent 78%)',
        }}
      />

      {/* Miniature dark-mode window */}
      <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-lg border border-[rgba(var(--preview-accent-rgb),0.18)] bg-[var(--preview-window)] shadow-inner">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[var(--preview-chrome)] px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-[rgba(var(--preview-accent-rgb),0.48)]" />
            <span className="ml-1.5 font-mono text-[10px] text-[var(--preview-muted)]">
              {project.previewFile}
            </span>
          </div>

          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase',
              isActive
                ? 'bg-[rgba(var(--preview-accent-rgb),0.16)] text-[var(--preview-accent)]'
                : 'bg-white/5 text-[var(--preview-subtle)]'
            )}
          >
            {isActive ? 'Compiled' : 'Source'}
          </span>
        </div>

        {/* Preview stage */}
        <div className="relative flex-1 overflow-hidden">
          {/* Layer 1: Syntax-highlighted source code */}
          <div
            key={isActive ? 'code-active' : 'code-idle'}
            className={cn(
              'absolute inset-0 flex items-center overflow-hidden px-3 py-2',
              isActive && prefersReducedMotion && 'hidden',
              isActive && !prefersReducedMotion && 'animate-scanline-code-wipe'
            )}
          >
            <pre className="m-0 w-full overflow-hidden font-mono text-[10.5px] leading-[1.55]">
              <code>
                {tokenizedLines.map((lineTokens, lineIdx) => (
                  <span key={lineIdx} className="flex items-baseline gap-2.5">
                    <span className="w-4 shrink-0 select-none text-right text-[9px] text-[var(--preview-subtle)] tabular-nums">
                      {String(lineIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate">
                      {lineTokens.map((token, tokenIdx) => (
                        <span
                          key={tokenIdx}
                          className={DARK_PREVIEW_TOKEN_CLASS[token.type]}
                        >
                          {token.value}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          </div>

          {/* Layer 2: Compiled bespoke mini-UI */}
          <div
            key={isActive ? 'ui-active' : 'ui-idle'}
            className={cn(
              'absolute inset-0',
              !isActive && 'pointer-events-none opacity-0',
              isActive && prefersReducedMotion && 'opacity-100',
              isActive && !prefersReducedMotion && 'animate-scanline-ui-reveal'
            )}
          >
            {renderMiniMockup(project.id)}
          </div>

          {/* Layer 3: Glowing horizontal theme-matched scanline beam */}
          {isActive && !prefersReducedMotion && (
            <div
              key="scanline-beam"
              className="animate-scanline-beam pointer-events-none absolute inset-x-0 z-20 -translate-y-full"
            >
              <div
                className="h-4 w-full"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgba(var(--preview-accent-rgb), 0.22))',
                }}
              />
              <div
                className="h-[2px] w-full"
                style={{
                  background:
                    'linear-gradient(to right, transparent, var(--preview-accent), transparent)',
                  boxShadow:
                    '0 0 14px 2px rgba(var(--preview-accent-rgb), 0.9)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
