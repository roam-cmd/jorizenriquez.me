import { useId } from 'react'
import { CLOVER_PATHS } from '@/lib/cloverLogo'

export interface CloverLogoProps {
  className?: string
  'aria-hidden'?: boolean
}

/**
 * Theme-reactive stemless four-leaf clover emblem where opposite leaf pairs
 * (top/bottom vs. left/right) contrast cleanly across all portfolio themes.
 */
export function CloverLogo({
  className,
  'aria-hidden': ariaHidden = true,
}: CloverLogoProps) {
  const id = useId()
  const pairAGrad = `${id}-pair-a`
  const pairBGrad = `${id}-pair-b`
  const crestGrad = `${id}-crest`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={ariaHidden}
      className={className}
    >
      <defs>
        <radialGradient id={pairAGrad} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--clover-a-light)" />
          <stop offset="100%" stopColor="var(--clover-a-dark)" />
        </radialGradient>
        <radialGradient id={pairBGrad} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="var(--clover-b-light)" />
          <stop offset="100%" stopColor="var(--clover-b-dark)" />
        </radialGradient>
        <linearGradient
          id={crestGrad}
          x1="32"
          y1="25.5"
          x2="32"
          y2="38.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--clover-a-light)" />
          <stop offset="100%" stopColor="var(--clover-a-dark)" />
        </linearGradient>
      </defs>

      {/* Top & bottom contrasting leaves (Pair A) */}
      <path
        d={CLOVER_PATHS.top}
        fill={`url(#${pairAGrad})`}
        stroke="var(--clover-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={CLOVER_PATHS.bottom}
        fill={`url(#${pairAGrad})`}
        stroke="var(--clover-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Left & right contrasting leaves (Pair B) */}
      <path
        d={CLOVER_PATHS.left}
        fill={`url(#${pairBGrad})`}
        stroke="var(--clover-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={CLOVER_PATHS.right}
        fill={`url(#${pairBGrad})`}
        stroke="var(--clover-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Subtle leaf veins */}
      <path
        d={CLOVER_PATHS.veins}
        stroke="var(--fg-primary)"
        strokeOpacity="0.45"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* 4-point center star crest */}
      <path
        d={CLOVER_PATHS.crest}
        fill={`url(#${crestGrad})`}
        stroke="var(--clover-stroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
