import { ArrowUp } from 'lucide-react'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { footerSnippets } from '@/data/codeSnippets'
import { navLinks, siteProfile } from '@/data/portfolio'
import { buildMailtoHref, handleEmailLinkClick } from '@/lib/email'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Minimal semantic footer with quick navigation, social links, and back-to-top anchor.
 */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--line-subtle)] bg-[var(--bg-footer)] py-10 backdrop-blur-[2px]">
      <RevealSection label="Footer" showToggle={false} typingMs={620}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <CodeRevealItem code={footerSnippets.brand}>
            <div>
              <p className="font-display text-sm font-semibold text-[var(--fg-primary)] transition-colors duration-300 ease-out hover:text-[var(--name-hover)]">
                {siteProfile.displayName}{' '}
                <span className="font-mono text-xs font-normal text-[var(--accent)]">
                  (@{siteProfile.brandHandle})
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                &copy; {CURRENT_YEAR} {siteProfile.brandHandle}. Built with
                React, TypeScript &amp; Tailwind CSS.
              </p>
            </div>
          </CodeRevealItem>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-4"
          >
            {navLinks.map((link) => (
              <CodeRevealItem
                key={link.id}
                code={footerSnippets.link(link.id, link.label)}
                inline
              >
                <a
                  href={link.href}
                  className="text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--fg-primary)]"
                >
                  {link.label}
                </a>
              </CodeRevealItem>
            ))}
          </nav>

          <CodeRevealItem code={footerSnippets.actions} inline>
            <div className="flex items-center gap-3">
              {siteProfile.socials.map((social) => {
                const isEmail = social.platform === 'email'
                return (
                  <a
                    key={social.label}
                    href={
                      isEmail ? buildMailtoHref(siteProfile.email) : social.href
                    }
                    onClick={
                      isEmail
                        ? (e) => handleEmailLinkClick(e, siteProfile.email)
                        : undefined
                    }
                    target={isEmail ? undefined : '_blank'}
                    rel={isEmail ? undefined : 'noreferrer'}
                    aria-label={
                      isEmail
                        ? `Email ${siteProfile.displayName}`
                        : social.label
                    }
                    className="rounded-lg border border-[var(--line-border)] p-2 text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
                  >
                    <SocialIcon platform={social.platform} className="h-4 w-4" />
                  </a>
                )
              })}

              <a
                href="#top"
                aria-label="Back to top"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--line-border)] px-2.5 py-2 font-mono text-xs text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Top</span>
              </a>
            </div>
          </CodeRevealItem>
        </div>
      </RevealSection>
    </footer>
  )
}
