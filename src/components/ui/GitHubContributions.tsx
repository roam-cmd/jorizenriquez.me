import { useEffect, useMemo, useRef, useState } from 'react'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { githubProfile } from '@/data/portfolio'
import {
  type ContributionDay,
  type ContributionLevel,
  useGitHubContributions,
} from '@/hooks/useGitHubContributions'

const LEVEL_COLORS: Record<ContributionLevel, string> = {
  0: 'var(--line-subtle)',
  1: 'rgba(var(--accent-rgb), 0.28)',
  2: 'rgba(var(--accent-rgb), 0.5)',
  3: 'rgba(var(--accent-rgb), 0.75)',
  4: 'rgba(var(--accent-rgb), 1)',
}

const LEGEND_LEVELS: ContributionLevel[] = [0, 1, 2, 3, 4]
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const
const SKELETON_WEEKS = 53

function formatContributionDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return dateStr
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getShortMonth(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString('en-US', { month: 'short' })
}

/**
 * Displays a live, theme-aware GitHub contribution heatmap for `@roam-cmd`
 * with lazy viewport fetching, mobile horizontal scroll to recent weeks, and
 * accessible loading/error fallbacks.
 */
export function GitHubContributions() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<{
    day: ContributionDay
    x: number
    y: number
  } | null>(null)
  const [shouldFetch, setShouldFetch] = useState(
    () => typeof IntersectionObserver === 'undefined'
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node || shouldFetch || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldFetch(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldFetch])

  const { status, total, days } = useGitHubContributions(shouldFetch)

  const { weeks, monthLabels } = useMemo(() => {
    if (days.length === 0) {
      return {
        weeks: [] as (ContributionDay | null)[][],
        monthLabels: [] as string[],
      }
    }

    const firstDate = new Date(`${days[0].date}T00:00:00`)
    const leadingEmpty = Number.isNaN(firstDate.getTime())
      ? 0
      : firstDate.getDay()

    const padded: (ContributionDay | null)[] = [
      ...Array<null>(leadingEmpty).fill(null),
      ...days,
    ]

    const columns: (ContributionDay | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      const slice = padded.slice(i, i + 7)
      while (slice.length < 7) {
        slice.push(null)
      }
      columns.push(slice)
    }

    const labels: string[] = []
    let prevMonth = ''
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const firstValidDay = columns[colIdx].find((cell) => cell !== null)
      if (!firstValidDay) {
        labels.push('')
        continue
      }
      const month = getShortMonth(firstValidDay.date)
      const nextValidDay =
        colIdx === 0 && columns[1]
          ? columns[1].find((cell) => cell !== null)
          : null
      const nextMonth = nextValidDay ? getShortMonth(nextValidDay.date) : ''

      if (colIdx === 0 && nextMonth && nextMonth !== month) {
        labels.push('')
        prevMonth = month
      } else if (month !== prevMonth) {
        labels.push(month)
        prevMonth = month
      } else {
        labels.push('')
      }
    }

    return { weeks: columns, monthLabels: labels }
  }, [days])

  useEffect(() => {
    const scroller = scrollRef.current
    if (status === 'ready' && scroller) {
      scroller.scrollLeft = scroller.scrollWidth
    }
  }, [status, weeks.length])

  return (
    <div
      ref={containerRef}
      className="theme-card relative mx-auto mt-8 max-w-4xl rounded-2xl border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] p-5 sm:p-6"
    >
      {hovered && (
        <div
          role="tooltip"
          style={{ left: hovered.x, top: hovered.y - 8 }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-[var(--line-border)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono text-[11px] text-[var(--fg-primary)] shadow-lg"
        >
          <span className="font-semibold text-[var(--accent)]">
            {hovered.day.count === 0
              ? 'No contributions'
              : `${hovered.day.count} contribution${hovered.day.count === 1 ? '' : 's'}`}
          </span>{' '}
          on {formatContributionDate(hovered.day.date)}
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-wider text-[var(--accent)] uppercase">
            GitHub Activity
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-[var(--fg-primary)]">
            {status === 'ready'
              ? `${total.toLocaleString()} contributions in the last year`
              : status === 'loading'
                ? 'Loading contributions…'
                : 'GitHub contributions unavailable'}
          </h3>
        </div>

        <a
          href={githubProfile.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--line-border)] px-3.5 py-2 text-xs font-medium text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] sm:min-h-[38px]"
        >
          <SocialIcon
            platform="github"
            className="h-3.5 w-3.5 text-[var(--accent)]"
          />
          <span>@{githubProfile.username}</span>
        </a>
      </div>

      {/* Heatmap / Skeleton / Error */}
      {status === 'error' ? (
        <p className="mt-5 font-mono text-xs text-[var(--fg-muted)]">
          Couldn&apos;t load contributions right now.
        </p>
      ) : (
        <div
          ref={scrollRef}
          onScroll={() => setHovered(null)}
          className="mt-5 w-full overflow-x-auto pb-1"
        >
          <div className="mx-auto flex w-max items-start">
            {/* Day labels */}
            <div
              aria-hidden="true"
              className="hidden grid-rows-7 gap-[3px] pt-[18px] pr-2 font-mono text-[10px] leading-[10px] text-[var(--fg-subtle)] sm:grid sm:leading-[12px]"
            >
              {DAY_LABELS.map((label, idx) => (
                <span key={idx} className="flex h-[10px] items-center sm:h-[12px]">
                  {label}
                </span>
              ))}
            </div>

            {status === 'loading' ? (
              <div className="inline-block">
                <div className="mb-1.5 h-[12px]" aria-hidden="true" />
                <div
                  role="img"
                  aria-label="Loading GitHub contribution graph"
                  className="grid grid-flow-col grid-rows-7 gap-[3px]"
                >
                  {Array.from({ length: SKELETON_WEEKS * 7 }, (_, idx) => (
                    <span
                      key={idx}
                      aria-hidden="true"
                      className="h-[10px] w-[10px] animate-pulse rounded-[2px] motion-reduce:animate-none sm:h-[12px] sm:w-[12px]"
                      style={{ backgroundColor: LEVEL_COLORS[0] }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="inline-block">
                {/* Month labels */}
                <div
                  aria-hidden="true"
                  className="mb-1.5 grid auto-cols-[10px] grid-flow-col gap-[3px] font-mono text-[10px] leading-none text-[var(--fg-subtle)] sm:auto-cols-[12px]"
                >
                  {monthLabels.map((month, idx) => (
                    <span key={idx} className="overflow-visible whitespace-nowrap">
                      {month}
                    </span>
                  ))}
                </div>

                {/* 53x7 contribution cells */}
                <div
                  role="img"
                  aria-label={`${total.toLocaleString()} GitHub contributions in the last year`}
                  onMouseLeave={() => setHovered(null)}
                  className="grid grid-flow-col grid-rows-7 gap-[3px]"
                >
                  {weeks.map((week, weekIdx) =>
                    week.map((day, dayIdx) =>
                      day ? (
                        <span
                          key={day.date}
                          aria-hidden="true"
                          onMouseEnter={(e) => {
                            const card = containerRef.current
                            if (!card) return
                            const cardRect = card.getBoundingClientRect()
                            const cellRect =
                              e.currentTarget.getBoundingClientRect()
                            setHovered({
                              day,
                              x:
                                cellRect.left -
                                cardRect.left +
                                cellRect.width / 2,
                              y: cellRect.top - cardRect.top,
                            })
                          }}
                          className="h-[10px] w-[10px] rounded-[2px] hover:ring-1 hover:ring-[var(--fg-primary)] sm:h-[12px] sm:w-[12px]"
                          style={{ backgroundColor: LEVEL_COLORS[day.level] }}
                        />
                      ) : (
                        <span
                          key={`empty-${weekIdx}-${dayIdx}`}
                          aria-hidden="true"
                          className="h-[10px] w-[10px] sm:h-[12px] sm:w-[12px]"
                        />
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[var(--fg-subtle)]">
        <span>Live from GitHub · updates automatically</span>
        <div className="inline-flex items-center gap-1.5">
          <span>Less</span>
          <div className="inline-flex items-center gap-[3px]" aria-hidden="true">
            {LEGEND_LEVELS.map((level) => (
              <span
                key={level}
                className="h-[10px] w-[10px] rounded-[2px] sm:h-[12px] sm:w-[12px]"
                style={{ backgroundColor: LEVEL_COLORS[level] }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
