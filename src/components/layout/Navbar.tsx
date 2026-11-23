import { Menu, Terminal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { navSnippets } from '@/data/codeSnippets'
import { navLinks, siteProfile } from '@/data/portfolio'
import { cn } from '@/lib/utils'

/**
 * Sticky glass navigation bar with active-section tracking, theme switcher,
 * component-level code-to-UI reveal, and an accessible mobile drawer.
 */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const sections = navLinks
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -50% 0px' }
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line-subtle)] bg-[var(--bg-nav)] backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-[var(--accent-fg)]"
      >
        Skip to main content
      </a>

      <RevealSection
        label="Navbar"
        initialImmediate
        typingMs={580}
        showToggle={false}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <CodeRevealItem code={navSnippets.brand} inline>
            <a
              href="#top"
              className="inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight text-[var(--fg-primary)] transition-colors hover:text-[var(--accent)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line-border)] bg-[var(--bg-elevated)] text-[var(--accent)]">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{siteProfile.brandHandle}</span>
            </a>
          </CodeRevealItem>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav aria-label="Primary navigation" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = activeId === link.id
                  return (
                    <li key={link.id}>
                      <CodeRevealItem
                        code={navSnippets.link(link.id, link.label)}
                        inline
                      >
                        <a
                          href={link.href}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-[var(--bg-elevated)] text-[var(--fg-primary)]'
                              : 'text-[var(--fg-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]'
                          )}
                        >
                          {link.label}
                        </a>
                      </CodeRevealItem>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <CodeRevealItem code={navSnippets.themeSwitcher} inline>
              <ThemeSwitcher />
            </CodeRevealItem>

            <CodeRevealItem
              code={navSnippets.mobileMenu}
              inline
              className="md:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                aria-label={
                  mobileOpen ? 'Close navigation menu' : 'Open navigation menu'
                }
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--line-border)] p-2 text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </CodeRevealItem>
          </div>
        </div>
      </RevealSection>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[var(--line-subtle)] bg-[var(--bg-base)] px-5 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    activeId === link.id
                      ? 'bg-[var(--bg-elevated)] text-[var(--fg-primary)]'
                      : 'text-[var(--fg-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--fg-primary)]'
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
