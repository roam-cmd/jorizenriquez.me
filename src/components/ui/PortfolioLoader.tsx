import { useEffect, useState } from 'react'
import Loader from '@/components/kokonutui/loader'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

const MIN_DISPLAY_MS = 650
const MAX_DISPLAY_MS = 1100
const FADE_OUT_MS = 320

/**
 * Full-screen initial portfolio loader built on Kokonut UI's Loader,
 * themed with portfolio CSS variables and respecting reduced motion.
 */
export function PortfolioLoader() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [fading, setFading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    let cancelled = false
    const start = performance.now()
    let fadeTimer = 0
    let unmountTimer = 0

    const triggerFade = () => {
      if (cancelled) return
      setFading(true)
      unmountTimer = window.setTimeout(() => {
        if (!cancelled) {
          setDismissed(true)
        }
      }, FADE_OUT_MS)
    }

    const maxTimer = window.setTimeout(triggerFade, MAX_DISPLAY_MS)

    const readyPromise = document.fonts?.ready ?? Promise.resolve()
    void readyPromise.then(() => {
      if (cancelled) return
      const elapsed = performance.now() - start
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
      fadeTimer = window.setTimeout(triggerFade, remaining)
    })

    return () => {
      cancelled = true
      window.clearTimeout(maxTimer)
      window.clearTimeout(fadeTimer)
      window.clearTimeout(unmountTimer)
    }
  }, [prefersReducedMotion])

  if (prefersReducedMotion || dismissed) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-center justify-center bg-[var(--bg-base)] transition-opacity duration-300 ease-out',
        fading && 'pointer-events-none opacity-0'
      )}
    >
      <Loader
        size="md"
        title="Joriz Enriquez"
        subtitle="Loading portfolio..."
      />
    </div>
  )
}
