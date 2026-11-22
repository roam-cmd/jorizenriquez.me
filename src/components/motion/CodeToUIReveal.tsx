import { Code2, Eye } from 'lucide-react'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type ItemPhase,
  type ItemRevealState,
  RevealSectionContext,
  useRevealSection,
} from '@/components/motion/revealContext'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import {
  TOKEN_COLOR_CLASS,
  countCodeChars,
  sliceTokenizedLines,
  tokenizeCodeLines,
} from '@/lib/syntaxHighlight'
import { cn } from '@/lib/utils'

export interface RevealSectionProps {
  label: string
  children: ReactNode
  typingMs?: number
  holdMs?: number
  materializeMs?: number
  initialImmediate?: boolean
  showToggle?: boolean
  className?: string
  toggleOffsetClassName?: string
}

interface ItemMeta {
  element: HTMLElement
  phase: ItemPhase
  progress: number
  startTime: number
  durationMs: number
  waveId: number | null
}

interface RevealWave {
  id: number
  startedAt: number
  allTypedAt: number | null
  itemIds: Set<string>
}

const REPLAY_COOLDOWN_MS = 4000
const WAVE_JOIN_WINDOW_MS = 160
const IDLE_STATE: ItemRevealState = { phase: 'idle', progress: 0 }
const RENDERED_STATE: ItemRevealState = { phase: 'rendered', progress: 1 }

function updateCompilingDataset(delta: number) {
  if (typeof document === 'undefined') {
    return
  }
  const current = Number(document.documentElement.dataset.compilingCount ?? '0')
  const next = Math.max(0, current + delta)
  if (next === 0) {
    delete document.documentElement.dataset.compilingCount
  } else {
    document.documentElement.dataset.compilingCount = String(next)
  }
}

/**
 * Coordinates a synchronized code-to-interface reveal for every `CodeRevealItem`
 * inside a section. Guarantees that every component in an active wave finishes
 * 100% of its typing animation before materializing into its rendered UI.
 */
export function RevealSection({
  label,
  children,
  typingMs = 820,
  holdMs = 130,
  materializeMs = 380,
  initialImmediate = false,
  showToggle = true,
  className,
  toggleOffsetClassName = 'top-4 right-4 sm:top-6 sm:right-6',
}: RevealSectionProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const itemObserverRef = useRef<IntersectionObserver | null>(null)
  const itemsMetaRef = useRef<Map<string, ItemMeta>>(new Map())
  const elementToIdRef = useRef<Map<HTMLElement, string>>(new Map())
  const wavesRef = useRef<RevealWave[]>([])
  const nextWaveIdRef = useRef(1)
  const rafIdRef = useRef<number | null>(null)
  const scrollDirectionRef = useRef<'down' | 'up'>('down')
  const lastScrollYRef = useRef(0)
  const lastCompletedTimeRef = useRef(0)

  const [manualInspect, setManualInspect] = useState(false)
  const manualInspectRef = useRef(false)
  const isCompilingRef = useRef(false)
  const [itemStates, setItemStates] = useState<Record<string, ItemRevealState>>(
    {}
  )

  const setCompilingActive = useCallback((active: boolean) => {
    if (isCompilingRef.current === active) {
      return
    }
    isCompilingRef.current = active
    updateCompilingDataset(active ? 1 : -1)
  }, [])

  useEffect(() => {
    manualInspectRef.current = manualInspect
  }, [manualInspect])

  const commitStates = useCallback(() => {
    const snapshot: Record<string, ItemRevealState> = {}
    for (const [id, meta] of itemsMetaRef.current.entries()) {
      snapshot[id] = { phase: meta.phase, progress: meta.progress }
    }
    setItemStates(snapshot)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setCompilingActive(false)
  }, [setCompilingActive])

  const registerItem = useCallback(
    (id: string, element: HTMLElement) => {
      itemsMetaRef.current.set(id, {
        element,
        phase: 'idle',
        progress: 0,
        startTime: 0,
        durationMs: typingMs,
        waveId: null,
      })
      elementToIdRef.current.set(element, id)
      itemObserverRef.current?.observe(element)

      return () => {
        itemObserverRef.current?.unobserve(element)
        elementToIdRef.current.delete(element)
        itemsMetaRef.current.delete(id)
        for (const wave of wavesRef.current) {
          wave.itemIds.delete(id)
        }
      }
    },
    [typingMs]
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      stopRaf()
      wavesRef.current = []
      return
    }

    lastScrollYRef.current = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollYRef.current + 2) {
        scrollDirectionRef.current = 'down'
      } else if (currentY < lastScrollYRef.current - 2) {
        scrollDirectionRef.current = 'up'
      }
      lastScrollYRef.current = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [prefersReducedMotion, stopRaf])

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const tick = (now: number) => {
      const remainingWaves: RevealWave[] = []

      for (const wave of wavesRef.current) {
        let allFinishedTyping = true
        let hasLiveItems = false

        for (const itemId of wave.itemIds) {
          const meta = itemsMetaRef.current.get(itemId)
          if (!meta) {
            continue
          }
          hasLiveItems = true

          const nextProgress = Math.min(
            1,
            Math.max(0, (now - meta.startTime) / meta.durationMs)
          )
          meta.progress = nextProgress

          if (nextProgress < 1) {
            allFinishedTyping = false
            meta.phase = 'typing'
          } else {
            meta.phase = 'typed'
          }
        }

        if (!hasLiveItems) {
          continue
        }

        if (!allFinishedTyping) {
          wave.allTypedAt = null
          remainingWaves.push(wave)
          continue
        }

        if (wave.allTypedAt === null) {
          wave.allTypedAt = now
        }

        const postTypeElapsed = now - wave.allTypedAt

        if (postTypeElapsed < holdMs) {
          for (const itemId of wave.itemIds) {
            const meta = itemsMetaRef.current.get(itemId)
            if (meta) {
              meta.phase = 'typed'
              meta.progress = 1
            }
          }
          remainingWaves.push(wave)
        } else if (postTypeElapsed < holdMs + materializeMs) {
          for (const itemId of wave.itemIds) {
            const meta = itemsMetaRef.current.get(itemId)
            if (meta) {
              meta.phase = 'materializing'
              meta.progress = 1
            }
          }
          remainingWaves.push(wave)
        } else {
          for (const itemId of wave.itemIds) {
            const meta = itemsMetaRef.current.get(itemId)
            if (meta) {
              meta.phase = 'rendered'
              meta.progress = 1
              meta.waveId = null
            }
          }
          lastCompletedTimeRef.current = Date.now()
        }
      }

      wavesRef.current = remainingWaves
      commitStates()

      if (wavesRef.current.length > 0) {
        rafIdRef.current = requestAnimationFrame(tick)
      } else {
        rafIdRef.current = null
        setCompilingActive(false)
      }
    }

    const ensureLoopRunning = () => {
      if (rafIdRef.current === null && wavesRef.current.length > 0) {
        setCompilingActive(true)
        rafIdRef.current = requestAnimationFrame(tick)
      }
    }

    const enqueueWave = (itemIds: string[], direction: 'down' | 'up') => {
      if (itemIds.length === 0 || manualInspectRef.current) {
        return
      }

      const now = performance.now()
      const activeDuration =
        direction === 'up' ? Math.min(540, typingMs) : typingMs

      let targetWave = wavesRef.current.find(
        (wave) =>
          wave.allTypedAt === null && now - wave.startedAt <= WAVE_JOIN_WINDOW_MS
      )

      if (!targetWave) {
        targetWave = {
          id: nextWaveIdRef.current++,
          startedAt: now,
          allTypedAt: null,
          itemIds: new Set<string>(),
        }
        wavesRef.current.push(targetWave)
      }

      for (const id of itemIds) {
        const meta = itemsMetaRef.current.get(id)
        if (!meta || meta.phase !== 'idle') {
          continue
        }
        meta.phase = 'typing'
        meta.progress = 0
        meta.startTime = now
        meta.durationMs = activeDuration
        meta.waveId = targetWave.id
        targetWave.itemIds.add(id)
      }

      commitStates()
      ensureLoopRunning()
    }

    const itemObserver = new IntersectionObserver(
      (entries) => {
        if (manualInspectRef.current) {
          return
        }

        const newlyVisibleIds: string[] = []
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }
          const id = elementToIdRef.current.get(entry.target as HTMLElement)
          if (!id) {
            continue
          }
          const meta = itemsMetaRef.current.get(id)
          if (meta && meta.phase === 'idle') {
            newlyVisibleIds.push(id)
          }
        }

        if (newlyVisibleIds.length > 0) {
          enqueueWave(newlyVisibleIds, scrollDirectionRef.current)
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -32px 0px',
      }
    )

    itemObserverRef.current = itemObserver
    for (const meta of itemsMetaRef.current.values()) {
      itemObserver.observe(meta.element)
    }

    const sectionNode = sectionRef.current
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            continue
          }
          if (wavesRef.current.length > 0 || itemsMetaRef.current.size === 0) {
            continue
          }

          const allRendered = Array.from(itemsMetaRef.current.values()).every(
            (meta) => meta.phase === 'rendered'
          )
          const cooldownElapsed =
            Date.now() - lastCompletedTimeRef.current > REPLAY_COOLDOWN_MS

          if (allRendered && cooldownElapsed) {
            for (const meta of itemsMetaRef.current.values()) {
              meta.phase = 'idle'
              meta.progress = 0
              meta.waveId = null
            }
            commitStates()
          }
        }
      },
      { threshold: 0 }
    )

    if (sectionNode) {
      sectionObserver.observe(sectionNode)
    }

    let bootRafId: number | null = null
    if (initialImmediate) {
      bootRafId = requestAnimationFrame(() => {
        if (manualInspectRef.current) {
          return
        }
        const allIdleIds: string[] = []
        for (const [id, meta] of itemsMetaRef.current.entries()) {
          if (meta.phase === 'idle') {
            allIdleIds.push(id)
          }
        }
        if (allIdleIds.length > 0) {
          enqueueWave(allIdleIds, 'down')
        }
      })
    }

    return () => {
      if (bootRafId !== null) {
        cancelAnimationFrame(bootRafId)
      }
      itemObserver.disconnect()
      itemObserverRef.current = null
      sectionObserver.disconnect()
      stopRaf()
    }
  }, [
    commitStates,
    holdMs,
    initialImmediate,
    materializeMs,
    prefersReducedMotion,
    setCompilingActive,
    stopRaf,
    typingMs,
  ])

  const getItemState = useCallback(
    (id: string): ItemRevealState => {
      if (prefersReducedMotion) {
        return RENDERED_STATE
      }
      return itemStates[id] ?? IDLE_STATE
    },
    [itemStates, prefersReducedMotion]
  )

  const contextValue = useMemo(
    () => ({
      manualInspect,
      prefersReducedMotion,
      getItemState,
      registerItem,
    }),
    [getItemState, manualInspect, prefersReducedMotion, registerItem]
  )

  return (
    <RevealSectionContext.Provider value={contextValue}>
      <div ref={sectionRef} className={cn('relative w-full', className)}>
        {showToggle && (
          <button
            type="button"
            data-cursor="code"
            onClick={() => {
              stopRaf()
              wavesRef.current = []
              setManualInspect((prev) => {
                const next = !prev
                if (!next) {
                  for (const meta of itemsMetaRef.current.values()) {
                    meta.phase = 'rendered'
                    meta.progress = 1
                    meta.waveId = null
                  }
                  commitStates()
                }
                return next
              })
            }}
            aria-pressed={manualInspect}
            aria-label={
              manualInspect
                ? `Show rendered UI for ${label}`
                : `Inspect source code for ${label}`
            }
            className={cn(
              'absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] px-3 py-1.5 font-mono text-[11px] text-[var(--accent)] shadow-sm backdrop-blur-md transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)]',
              toggleOffsetClassName
            )}
          >
            {manualInspect ? (
              <>
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>UI</span>
              </>
            ) : (
              <>
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Source</span>
              </>
            )}
          </button>
        )}

        {children}
      </div>
    </RevealSectionContext.Provider>
  )
}

export interface CodeRevealItemProps {
  code: string
  children: ReactNode
  inline?: boolean
  align?: 'start' | 'center'
  className?: string
}

/**
 * Wraps an individual UI component (card, button, badge, nav link, etc.) so it
 * briefly appears as frameless syntax-highlighted code typed left-to-right, then
 * smoothly materializes into its rendered UI once every sibling in its wave finishes.
 */
export function CodeRevealItem({
  code,
  children,
  inline = false,
  align = inline ? 'center' : 'start',
  className,
}: CodeRevealItemProps) {
  const id = useId()
  const itemRef = useRef<HTMLDivElement>(null)
  const { manualInspect, prefersReducedMotion, getItemState, registerItem } =
    useRevealSection()

  useEffect(() => {
    const node = itemRef.current
    if (!node) {
      return
    }
    return registerItem(id, node)
  }, [id, registerItem])

  const { phase, progress } = getItemState(id)

  const tokenizedLines = useMemo(() => tokenizeCodeLines(code), [code])
  const totalChars = useMemo(
    () => countCodeChars(tokenizedLines),
    [tokenizedLines]
  )

  const showCode =
    manualInspect ||
    (!prefersReducedMotion &&
      (phase === 'typing' || phase === 'typed' || phase === 'materializing'))

  const isUiVisible =
    !manualInspect &&
    (prefersReducedMotion || phase === 'materializing' || phase === 'rendered')

  const visibleChars = manualInspect
    ? totalChars
    : phase === 'typed' || phase === 'materializing'
      ? totalChars
      : Math.max(1, Math.floor(progress * totalChars))

  const visibleLines = useMemo(
    () => (showCode ? sliceTokenizedLines(tokenizedLines, visibleChars) : []),
    [showCode, tokenizedLines, visibleChars]
  )

  const showCaret =
    !manualInspect && !prefersReducedMotion && phase === 'typing'

  return (
    <div
      ref={itemRef}
      className={cn(
        'relative',
        inline ? 'inline-flex' : 'block',
        className
      )}
    >
      {/* Rendered UI remains in normal flow for zero layout shift */}
      <div
        className={cn(
          inline ? 'inline-flex w-full items-center' : 'h-full w-full',
          'transition-all duration-300 ease-out',
          isUiVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-1.5 scale-[0.99] pointer-events-none select-none'
        )}
        aria-hidden={manualInspect}
      >
        {children}
      </div>

      {/* Frameless left-to-right typed code overlay */}
      {showCode && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-10 flex overflow-hidden transition-all duration-300 ease-out',
            align === 'center'
              ? 'items-center justify-start px-1'
              : 'items-start justify-start p-2 sm:p-3',
            !manualInspect && phase === 'materializing'
              ? 'opacity-0 blur-[2px] scale-[0.99]'
              : 'opacity-100 blur-0 scale-100'
          )}
        >
          <pre
            className={cn(
              'm-0 max-w-full overflow-hidden font-mono leading-relaxed drop-shadow-[0_0_8px_var(--syntax-glow)]',
              inline
                ? 'truncate text-[11px] sm:text-xs'
                : 'whitespace-pre-wrap break-words text-[11px] sm:text-xs'
            )}
          >
            <code>
              {visibleLines.map((lineTokens, lineIndex) => {
                const isLastLine = lineIndex === visibleLines.length - 1
                return (
                  <span key={lineIndex} className="block">
                    {lineTokens.map((token, tokenIndex) => (
                      <span
                        key={tokenIndex}
                        className={TOKEN_COLOR_CLASS[token.type]}
                      >
                        {token.value}
                      </span>
                    ))}
                    {showCaret && isLastLine && (
                      <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-[var(--accent)]" />
                    )}
                  </span>
                )
              })}
            </code>
          </pre>
        </div>
      )}
    </div>
  )
}
