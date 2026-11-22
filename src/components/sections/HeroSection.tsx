import { ArrowDownRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { HalftoneShaderBackground } from '@/components/motion/HalftoneShaderBackground'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { heroSnippets } from '@/data/codeSnippets'
import { siteProfile } from '@/data/portfolio'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { type ThemeId, useTheme } from '@/hooks/useTheme'
import { handleEmailLinkClick } from '@/lib/email'
import { cn } from '@/lib/utils'

const THEME_SHADER_COLORS: Record<
  ThemeId,
  { bgColor: string; dotColor: string; accentColor: string; maxOpacity: number }
> = {
  midnight: {
    bgColor: '#0B0E0E',
    dotColor: '#7FA3A6',
    accentColor: '#7DD3FC',
    maxOpacity: 0.52,
  },
  'slate-sand': {
    bgColor: '#222831',
    dotColor: '#B8AA96',
    accentColor: '#A5B4FC',
    maxOpacity: 0.5,
  },
  'sage-stone': {
    bgColor: '#EEEEEE',
    dotColor: '#777C6D',
    accentColor: '#2B7A78',
    maxOpacity: 0.52,
  },
}

/**
 * Landing hero section layered over the interactive deep-sea WebGL Halftone /
 * Dot-Matrix Shader background, with simultaneous component-level
 * code-to-interface reveals.
 */
export function HeroSection() {
  const { theme } = useTheme()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isShaking, setIsShaking] = useState(false)
  const shakeTimeoutRef = useRef<number | null>(null)
  const shaderColors = THEME_SHADER_COLORS[theme]

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current)
      }
    }
  }, [])

  const handleChompImpact = useCallback(() => {
    if (prefersReducedMotion) {
      return
    }

    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([35, 25, 90])
      }
    } catch {
      // Unsupported browsers fail silently
    }

    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current)
    }
    setIsShaking(false)
    requestAnimationFrame(() => {
      setIsShaking(true)
      shakeTimeoutRef.current = window.setTimeout(() => {
        setIsShaking(false)
        shakeTimeoutRef.current = null
      }, 380)
    })
  }, [prefersReducedMotion])

  const handleShakeEnd = useCallback(() => {
    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current)
      shakeTimeoutRef.current = null
    }
    setIsShaking(false)
  }, [])

  return (
    <section
      id="top"
      aria-label="Introduction"
      className="relative -mt-16 overflow-hidden pt-16"
    >
      <div
        className={cn('relative', isShaking && 'animate-hero-chomp-shake')}
        onAnimationEnd={handleShakeEnd}
      >
        <HalftoneShaderBackground
          bgColor={shaderColors.bgColor}
          dotColor={shaderColors.dotColor}
          accentColor={shaderColors.accentColor}
          dotSpacing={8}
          maxOpacity={shaderColors.maxOpacity}
          fishCount={54}
          jellyfishCount={6}
          mouseRadius={0.22}
          chompIntervalMs={18000}
          enableClickChomp
          chompScale={0.7}
          onChompImpact={handleChompImpact}
          debug={false}
        />

        <RevealSection
        label="HeroSection"
        initialImmediate
        typingMs={860}
        toggleOffsetClassName="top-5 right-5 sm:top-6 sm:right-8"
      >
        <div className="relative flex min-h-[88svh] w-full items-center justify-center">
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-3xl">
              <CodeRevealItem code={heroSnippets.badge} inline>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-border)] bg-[var(--bg-surface)]/95 px-3.5 py-1.5">
                  <span
                    className="h-2 w-2 rounded-full bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs text-[var(--accent)]">
                    {siteProfile.availability}
                  </span>
                </div>
              </CodeRevealItem>

              <CodeRevealItem code={heroSnippets.heading} className="mt-6">
                <div>
                  <h1 className="inline-block font-display text-4xl font-bold tracking-tight text-[var(--fg-primary)] transition-colors duration-300 ease-out hover:text-[var(--name-hover)] sm:text-6xl">
                    {siteProfile.displayName}
                  </h1>
                  <p className="mt-3 font-mono text-sm tracking-wide text-[var(--accent)] sm:text-base">
                    {siteProfile.roleTitle}
                  </p>
                </div>
              </CodeRevealItem>

              <CodeRevealItem code={heroSnippets.intro} className="mt-5">
                <div>
                  <p className="max-w-2xl text-lg leading-relaxed text-[var(--fg-primary)] sm:text-xl">
                    {siteProfile.headline}
                  </p>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--fg-muted)]">
                    {siteProfile.tagline}
                  </p>
                </div>
              </CodeRevealItem>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <CodeRevealItem code={heroSnippets.primaryCta} inline>
                  <a
                    href="#projects"
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
                  >
                    <span>Explore Projects</span>
                    <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </CodeRevealItem>

                <CodeRevealItem code={heroSnippets.secondaryCta} inline>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface)]/95 px-5 py-3 text-sm font-medium text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <span>Contact Me</span>
                  </a>
                </CodeRevealItem>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {siteProfile.socials.map((social) => (
                  <CodeRevealItem
                    key={social.label}
                    code={heroSnippets.socialChip(social.label)}
                    inline
                  >
                    <a
                      href={social.href}
                      onClick={
                        social.platform === 'email'
                          ? (e) => handleEmailLinkClick(e, siteProfile.email)
                          : undefined
                      }
                      target={social.platform === 'email' ? undefined : '_blank'}
                      rel={
                        social.platform === 'email' ? undefined : 'noreferrer'
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface)]/95 px-3 py-2 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
                    >
                      <SocialIcon
                        platform={social.platform}
                        className="h-3.5 w-3.5 text-[var(--accent)]"
                      />
                      <span>{social.label}</span>
                    </a>
                  </CodeRevealItem>
                ))}
              </div>
            </div>
          </div>
        </div>
      </RevealSection>
      </div>
    </section>
  )
}
