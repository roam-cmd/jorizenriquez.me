import { Check, Copy, FileText, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import TopoBackground from '@/components/kokonutui/topo-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { contactSnippets, sectionHeaderCode } from '@/data/codeSnippets'
import { siteProfile } from '@/data/portfolio'
import { buildMailtoHref, handleEmailLinkClick } from '@/lib/email'

/**
 * Contact section featuring Kokonut UI TopoBackground, a unified primary CTA
 * row, and a dedicated Direct Email panel for both email addresses.
 */
export function ContactSection() {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const handleCopyEmail = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedEmail(address)
      window.setTimeout(() => setCopiedEmail(null), 2200)
    } catch {
      window.location.href = `mailto:${address}`
    }
  }

  const profileLinks = siteProfile.socials.filter(
    (social) => social.platform !== 'email'
  )

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="overflow-x-clip border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="ContactSection"
        toggleOffsetClassName="top-6 right-5 sm:right-8"
      >
        <TopoBackground
          className="min-h-[460px] bg-transparent py-16 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] md:py-24"
          interval={0.14}
          speed={0.45}
          labels={false}
        >
          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div id="contact-heading">
              <CodeRevealItem
                code={sectionHeaderCode(
                  '06',
                  'CONTACT',
                  'Let’s Start a Conversation'
                )}
              >
                <SectionHeader
                  index="06"
                  eyebrow="CONTACT"
                  title="Let’s Start a Conversation"
                  description="Reach out for collaboration, engineering roles, or technical discussions."
                />
              </CodeRevealItem>
            </div>

            <div className="theme-card grid gap-8 rounded-2xl border border-[var(--line-border)] bg-[var(--bg-surface)]/95 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-7">
                <CodeRevealItem code={contactSnippets.intro}>
                  <div className="space-y-4">
                    <p className="inline-flex items-center gap-2 font-mono text-xs text-[var(--accent)]">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{siteProfile.location}</span>
                    </p>

                    <h3 className="font-display text-2xl font-semibold text-[var(--fg-primary)]">
                      {siteProfile.availability}
                    </h3>

                    <p className="max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
                      Feel free to reach out directly via email, connect on
                      LinkedIn, or browse my repositories on GitHub.
                    </p>
                  </div>
                </CodeRevealItem>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <CodeRevealItem code={contactSnippets.emailBtn} inline>
                    <a
                      href={buildMailtoHref(siteProfile.email)}
                      onClick={(e) =>
                        handleEmailLinkClick(e, siteProfile.email)
                      }
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
                    >
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      <span>Email Me</span>
                    </a>
                  </CodeRevealItem>

                  <CodeRevealItem code={contactSnippets.cvCta} inline>
                    <a
                      href={siteProfile.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[var(--line-border)] bg-[var(--bg-base)]/80 px-4 py-2.5 text-xs font-medium text-[var(--fg-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <FileText
                        className="h-3.5 w-3.5 text-[var(--accent)]"
                        aria-hidden="true"
                      />
                      <span>View CV</span>
                    </a>
                  </CodeRevealItem>

                  {profileLinks.map((social) => (
                    <CodeRevealItem
                      key={social.label}
                      code={contactSnippets.socialChip(social.label)}
                      inline
                    >
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--line-border)] bg-[var(--bg-base)]/80 px-3.5 py-2.5 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
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

              <div className="lg:col-span-5">
                <CodeRevealItem code={contactSnippets.directEmail}>
                  <div className="rounded-xl border border-[var(--line-border)] bg-[var(--bg-base)]/60 p-4 sm:p-5">
                    <p className="font-mono text-[11px] tracking-wider text-[var(--accent)] uppercase">
                      Direct Email
                    </p>

                    <ul
                      className="mt-3 space-y-2.5"
                      aria-label="Direct email addresses"
                    >
                      {siteProfile.emails.map((address, index) => {
                        const isCopied = copiedEmail === address
                        return (
                          <li
                            key={address}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line-subtle)] bg-[var(--bg-surface)]/85 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <span className="block font-mono text-[10px] tracking-wider text-[var(--fg-subtle)] uppercase">
                                {index === 0 ? 'Primary' : 'Alternate'}
                              </span>
                              <a
                                href={buildMailtoHref(address)}
                                onClick={(e) =>
                                  handleEmailLinkClick(e, address)
                                }
                                className="block truncate font-mono text-xs text-[var(--fg-primary)] transition-colors hover:text-[var(--accent)]"
                              >
                                {address}
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyEmail(address)}
                              aria-label={`Copy ${address}`}
                              className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded border border-[var(--line-border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-[11px] text-[var(--fg-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--fg-primary)]"
                            >
                              {isCopied ? (
                                <>
                                  <Check
                                    className="h-3 w-3 text-[var(--accent)]"
                                    aria-hidden="true"
                                  />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </CodeRevealItem>

                <span className="sr-only" aria-live="polite">
                  {copiedEmail
                    ? `${copiedEmail} copied to clipboard.`
                    : ''}
                </span>
              </div>
            </div>
          </div>
        </TopoBackground>
      </RevealSection>
    </section>
  )
}
