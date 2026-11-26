import { useEffect, useState } from 'react'
import { githubProfile } from '@/data/portfolio'

export type ContributionLevel = 0 | 1 | 2 | 3 | 4

export interface ContributionDay {
  date: string
  count: number
  level: ContributionLevel
}

export interface GitHubContributionsState {
  status: 'loading' | 'ready' | 'error'
  total: number
  days: ContributionDay[]
}

interface CachedContributions {
  savedAt: number
  total: number
  days: ContributionDay[]
}

const CACHE_KEY = 'gh-contrib-roam-cmd'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function clampLevel(value: unknown): ContributionLevel {
  const num = typeof value === 'number' ? Math.round(value) : 0
  if (num <= 0) return 0
  if (num === 1) return 1
  if (num === 2) return 2
  if (num === 3) return 3
  return 4
}

function isValidDaysArray(raw: unknown): raw is ContributionDay[] {
  if (!Array.isArray(raw)) {
    return false
  }
  return raw.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ContributionDay).date === 'string' &&
      typeof (item as ContributionDay).count === 'number'
  )
}

function readCachedContributions(): CachedContributions | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<CachedContributions>
    if (
      typeof parsed.savedAt !== 'number' ||
      typeof parsed.total !== 'number' ||
      !isValidDaysArray(parsed.days)
    ) {
      return null
    }
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      return null
    }
    return {
      savedAt: parsed.savedAt,
      total: parsed.total,
      days: parsed.days.map((day) => ({
        date: day.date,
        count: day.count,
        level: clampLevel(day.level),
      })),
    }
  } catch {
    return null
  }
}

function writeCachedContributions(total: number, days: ContributionDay[]) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    const payload: CachedContributions = {
      savedAt: Date.now(),
      total,
      days,
    }
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

/**
 * Fetches public GitHub contribution history for `roam-cmd` with a 6-hour
 * `sessionStorage` cache and optional lazy activation when near the viewport.
 */
export function useGitHubContributions(
  enabled = true
): GitHubContributionsState {
  const [state, setState] = useState<GitHubContributionsState>(() => {
    const cached = readCachedContributions()
    if (cached) {
      return {
        status: 'ready',
        total: cached.total,
        days: cached.days,
      }
    }
    return {
      status: 'loading',
      total: 0,
      days: [],
    }
  })

  useEffect(() => {
    if (!enabled || state.status === 'ready') {
      return
    }

    const controller = new AbortController()

    async function load() {
      try {
        const cached = readCachedContributions()
        if (cached) {
          setState({
            status: 'ready',
            total: cached.total,
            days: cached.days,
          })
          return
        }

        const response = await fetch(githubProfile.contributionsApi, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const json = (await response.json()) as {
          total?: { lastYear?: unknown }
          contributions?: unknown
        }

        const total = json.total?.lastYear
        if (typeof total !== 'number' || !isValidDaysArray(json.contributions)) {
          throw new Error('Unexpected contributions payload')
        }

        const days: ContributionDay[] = json.contributions.map((day) => ({
          date: day.date,
          count: day.count,
          level: clampLevel(day.level),
        }))

        writeCachedContributions(total, days)
        setState({
          status: 'ready',
          total,
          days,
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setState({
          status: 'error',
          total: 0,
          days: [],
        })
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [enabled, state.status])

  return state
}
