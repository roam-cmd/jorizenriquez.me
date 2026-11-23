import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

type CursorVariant = 'default' | 'pointer' | 'external' | 'code' | 'text'

interface ClickRipple {
  id: number
  x: number
  y: number
}

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], label, summary'
const TEXT_SELECTOR =
  'p, h1, h2, h3, h4, h5, h6, pre, code, input, textarea, li, dd, dt'

function resolveCursorVariant(target: EventTarget | null): CursorVariant {
  if (!(target instanceof Element)) {
    return 'default'
  }
  if (target.closest('[data-cursor="code"]')) {
    return 'code'
  }
  const interactive = target.closest(INTERACTIVE_SELECTOR)
  if (interactive) {
    if (
      interactive instanceof HTMLAnchorElement &&
      interactive.target === '_blank'
    ) {
      return 'external'
    }
    return 'pointer'
  }
  if (target.closest(TEXT_SELECTOR)) {
    return 'text'
  }
  return 'default'
}

/**
 * Bespoke precision reticle cursor for fine-pointer desktop devices.
 * Animates exclusively via GPU-composited transforms and opacity (zero layout
 * thrash) and avoids per-mousemove timer churn.
 */
export function CustomCursor() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  const [isFinePointer, setIsFinePointer] = useState<boolean>(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false
    }
    return window.matchMedia('(pointer: fine) and (hover: hover)').matches
  })
  const [visible, setVisible] = useState(false)
  const [variant, setVariant] = useState<CursorVariant>('default')
  const [pressed, setPressed] = useState(false)
  const [idle, setIdle] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ripples, setRipples] = useState<ClickRipple[]>([])

  const variantRef = useRef<CursorVariant>('default')
  const idleRef = useRef(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    const onChange = (event: MediaQueryListEvent) => {
      setIsFinePointer(event.matches)
      if (!event.matches) {
        setVisible(false)
        document.documentElement.classList.remove('has-custom-cursor')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isFinePointer) {
      document.documentElement.classList.remove('has-custom-cursor')
      return
    }

    const updateCompiling = () => {
      const count = Number(
        document.documentElement.dataset.compilingCount ?? '0'
      )
      setProcessing(count > 0)
    }

    updateCompiling()
    const observer = new MutationObserver(updateCompiling)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-compiling-count'],
    })

    let targetX = -100
    let targetY = -100
    let ringX = -100
    let ringY = -100
    let hasMoved = false
    let lastNow = performance.now()
    let lastMoveAt = performance.now()
    let rafId = 0
    let rippleSeq = 1
    let lastTarget: EventTarget | null = null
    const rippleTimers = new Set<number>()

    const idleIntervalId = window.setInterval(() => {
      if (!hasMoved) {
        return
      }
      const isNowIdle = performance.now() - lastMoveAt > 2400
      if (isNowIdle !== idleRef.current) {
        idleRef.current = isNowIdle
        setIdle(isNowIdle)
      }
    }, 600)

    const markActive = () => {
      lastMoveAt = performance.now()
      if (idleRef.current) {
        idleRef.current = false
        setIdle(false)
      }
    }

    const hideCursor = () => {
      setVisible(false)
      setPressed(false)
      hasMoved = false
      lastTarget = null
      document.documentElement.classList.remove('has-custom-cursor')
    }

    const tick = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.05)
      lastNow = now

      const follow = prefersReducedMotion ? 1 : 1 - Math.exp(-16 * dt)
      ringX += (targetX - ringX) * follow
      ringY += (targetY - ringY) * follow

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }

      if (
        hasMoved &&
        (Math.abs(targetX - ringX) > 0.1 || Math.abs(targetY - ringY) > 0.1)
      ) {
        rafId = requestAnimationFrame(tick)
      } else {
        rafId = 0
      }
    }

    const ensureLoop = () => {
      if (!rafId) {
        lastNow = performance.now() - 16
        rafId = requestAnimationFrame(tick)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        hideCursor()
        return
      }

      targetX = event.clientX
      targetY = event.clientY

      if (!hasMoved) {
        hasMoved = true
        ringX = targetX
        ringY = targetY
        document.documentElement.classList.add('has-custom-cursor')
        setVisible(true)
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      }
      if (prefersReducedMotion && ringRef.current) {
        ringRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      } else {
        ensureLoop()
      }

      if (event.target !== lastTarget) {
        lastTarget = event.target
        const nextVariant = resolveCursorVariant(event.target)
        if (nextVariant !== variantRef.current) {
          variantRef.current = nextVariant
          setVariant(nextVariant)
        }
      }
      markActive()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) {
        return
      }
      setPressed(true)
      markActive()

      if (!prefersReducedMotion) {
        const id = rippleSeq++
        setRipples((prev) => [
          ...prev.slice(-3),
          { id, x: event.clientX, y: event.clientY },
        ])
        const timerId = window.setTimeout(() => {
          rippleTimers.delete(timerId)
          setRipples((prev) => prev.filter((item) => item.id !== id))
        }, 440)
        rippleTimers.add(timerId)
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        setPressed(false)
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('blur', hideCursor)
    document.addEventListener('pointerleave', hideCursor)

    return () => {
      observer.disconnect()
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.clearInterval(idleIntervalId)
      for (const id of rippleTimers) {
        window.clearTimeout(id)
      }
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('blur', hideCursor)
      document.removeEventListener('pointerleave', hideCursor)
    }
  }, [isFinePointer, prefersReducedMotion])

  if (!isFinePointer) {
    return null
  }

  const isExpanded =
    variant === 'pointer' || variant === 'external' || variant === 'code'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {/* Click ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
          className="animate-cursor-ripple fixed h-7 w-7 rounded-full border border-[var(--cursor-ring)]"
        />
      ))}

      {/* Outer damped reticle (fixed 40x40 box, GPU transform-only scaling) */}
      <div
        ref={ringRef}
        className={cn(
          'fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-200',
          visible ? (idle ? 'opacity-40' : 'opacity-100') : 'opacity-0'
        )}
      >
        <div
          style={{
            boxShadow: '0 0 0 1px var(--cursor-halo)',
          }}
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-full border transition-transform duration-150 ease-out',
            variant === 'text'
              ? 'scale-[0.52] border-[var(--cursor-ring)]/65 bg-transparent'
              : isExpanded
                ? 'scale-100 border-[var(--cursor-ring)] bg-[var(--cursor-tint)]'
                : 'scale-[0.7] border-[var(--cursor-ring)]/85 bg-transparent',
            pressed && variant !== 'text' && 'scale-[0.58]'
          )}
        >
          {/* Precision reticle ticks */}
          {variant !== 'text' && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 transition-transform duration-150 ease-out',
                isExpanded ? 'rotate-45' : 'rotate-0'
              )}
            >
              <span className="absolute -top-1 left-1/2 h-1.5 w-px -translate-x-1/2 bg-[var(--cursor-ring)]" />
              <span className="absolute -bottom-1 left-1/2 h-1.5 w-px -translate-x-1/2 bg-[var(--cursor-ring)]" />
              <span className="absolute top-1/2 -left-1 h-px w-1.5 -translate-y-1/2 bg-[var(--cursor-ring)]" />
              <span className="absolute top-1/2 -right-1 h-px w-1.5 -translate-y-1/2 bg-[var(--cursor-ring)]" />
            </div>
          )}

          {/* Subtle processing orbital arc while sections compile */}
          {processing && variant !== 'text' && (
            <span className="animate-cursor-orbit absolute -inset-1.5 rounded-full border border-dashed border-[var(--cursor-ring)]" />
          )}

          {/* Contextual micro-badges */}
          {variant === 'code' && (
            <span
              style={{ textShadow: '0 1px 2px var(--cursor-halo)' }}
              className="font-mono text-[9px] font-semibold tracking-tighter text-[var(--cursor-ring)]"
            >
              &lt;/&gt;
            </span>
          )}

          {variant === 'external' && (
            <span
              style={{ textShadow: '0 1px 2px var(--cursor-halo)' }}
              className="absolute -top-1.5 -right-2 font-mono text-[10px] leading-none text-[var(--cursor-ring)]"
            >
              &#8599;
            </span>
          )}
        </div>
      </div>

      {/* Zero-latency core dot (also morphs to subtle vertical hairline on text) */}
      <div
        ref={dotRef}
        className={cn(
          'fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform transition-opacity duration-150',
          visible && variant !== 'code' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <span
          style={{
            boxShadow: '0 0 0 1px var(--cursor-ring)',
          }}
          className={cn(
            'block transition-transform duration-150 ease-out',
            variant === 'text'
              ? 'h-5 w-[2px] rounded-full bg-[var(--cursor-ring)]'
              : 'h-2 w-2 rounded-full bg-[var(--cursor-dot)]',
            pressed && variant !== 'text' && 'scale-125'
          )}
        />
      </div>
    </div>
  )
}
