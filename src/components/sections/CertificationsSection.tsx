import {
  Award,
  BookOpen,
  Cpu,
  ExternalLink,
  Network,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import PageFlip, {
  type PageFlipHandle,
} from '@/components/kokonutui/page-flip'
import TopoBackground from '@/components/kokonutui/topo-background'
import {
  CodeRevealItem,
  RevealSection,
} from '@/components/motion/CodeToUIReveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  buildCertificationTabCode,
  certificationsBookCode,
  sectionHeaderCode,
} from '@/data/codeSnippets'
import { certificationGroups } from '@/data/portfolio'
import { cn } from '@/lib/utils'

const GROUP_ICONS: Record<string, typeof Network> = {
  'networking-it': Network,
  'security-ai': ShieldCheck,
  'programming-workshops': Terminal,
  'semiconductor-electronics': Cpu,
}

export interface CertificationsSectionProps {
  embedded?: boolean
}

/**
 * Grouped credentials & verified learning section rendered inside Kokonut UI's
 * interactive PageFlip book: each group opens with a chapter title page,
 * followed by individual certificate pages with clickable award icons.
 */
export function CertificationsSection({
  embedded = false,
}: CertificationsSectionProps) {
  const pageFlipRef = useRef<PageFlipHandle>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)

  const { pages, groupStartPages, pageToGroupIndex } = useMemo(() => {
    const builtPages: ReactNode[] = []
    const startPages: number[] = []
    const groupByPage: number[] = []

    const totalCount =
      certificationGroups.length +
      certificationGroups.reduce((sum, g) => sum + g.certificates.length, 0)

    certificationGroups.forEach((group, groupIdx) => {
      const groupStart = builtPages.length
      startPages.push(groupStart)
      const GroupIcon = GROUP_ICONS[group.id] ?? BookOpen
      const chapterLabel = `${String(groupIdx + 1).padStart(2, '0')} / ${String(certificationGroups.length).padStart(2, '0')}`

      // Group cover / title page
      groupByPage.push(groupIdx)
      builtPages.push(
        <div
          key={`group-${group.id}`}
          className="relative flex size-full flex-col justify-between bg-[var(--bg-elevated)]/65 px-[8cqw] py-[8cqw] text-[var(--fg-primary)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[2.8cqw] tracking-[0.2em] text-[var(--accent)] uppercase">
              Chapter {chapterLabel}
            </span>
            <span className="inline-flex size-[8.5cqw] items-center justify-center rounded-lg border border-[var(--line-border)] bg-[var(--bg-surface)] text-[var(--accent)]">
              <GroupIcon className="size-[4.4cqw]" aria-hidden="true" />
            </span>
          </div>

          <div className="my-auto py-[3cqw]">
            <h3 className="font-display text-[6.8cqw] font-bold leading-[1.08] tracking-tight text-[var(--fg-primary)]">
              {group.title}
            </h3>
            <p className="mt-[2.8cqw] text-[3.2cqw] leading-relaxed text-[var(--fg-muted)]">
              {group.subtitle}
            </p>

            <div className="mt-[4cqw] border-t border-[var(--line-subtle)] pt-[3cqw]">
              <p className="font-mono text-[2.5cqw] tracking-wider text-[var(--accent)] uppercase">
                {group.certificates.length}{' '}
                {group.certificates.length === 1
                  ? 'Certificate'
                  : 'Certificates'}{' '}
                Included
              </p>
              <ul className="mt-[2cqw] space-y-[1.4cqw]">
                {group.certificates.map((cert) => (
                  <li
                    key={cert.id}
                    className="flex items-baseline gap-[1.8cqw] text-[2.9cqw] text-[var(--fg-primary)]"
                  >
                    <span
                      aria-hidden="true"
                      className="size-[1.2cqw] shrink-0 rounded-full bg-[var(--accent)]"
                    />
                    <span className="truncate">{cert.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[2.5cqw] text-[var(--fg-subtle)]">
            <span>
              {groupIdx === 0 ? 'Drag corner or tap to flip →' : group.title}
            </span>
            <span className="tabular-nums">
              {builtPages.length + 1} / {totalCount}
            </span>
          </div>
        </div>
      )

      // Individual certificate pages under this group
      group.certificates.forEach((cert) => {
        const pageNum = builtPages.length + 1
        groupByPage.push(groupIdx)
        builtPages.push(
          <article
            key={cert.id}
            className="flex size-full flex-col px-[8cqw] pt-[7.5cqw] pb-[6cqw] text-[var(--fg-primary)]"
          >
            <div className="flex items-center justify-between gap-[2cqw]">
              <span className="font-mono text-[2.5cqw] tracking-wider text-[var(--accent)] uppercase">
                {group.title}
              </span>
              <span className="font-mono text-[2.5cqw] text-[var(--fg-muted)]">
                {cert.dateOrStatus}
              </span>
            </div>

            <div className="mt-[3.8cqw] flex items-start gap-[3cqw]">
              {cert.verifyUrl ? (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View ${cert.title} certificate`}
                  title={`View ${cert.title} certificate`}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="inline-flex size-[8.5cqw] shrink-0 items-center justify-center rounded-lg border border-[var(--line-border)] bg-[var(--bg-elevated)] text-[var(--accent)] transition-all duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent-tint)] hover:text-[var(--fg-primary)]"
                >
                  <Award className="size-[4.3cqw]" aria-hidden="true" />
                </a>
              ) : (
                <span className="inline-flex size-[8.5cqw] shrink-0 items-center justify-center rounded-lg border border-[var(--line-border)] bg-[var(--bg-elevated)] text-[var(--accent)]">
                  <Award className="size-[4.3cqw]" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <h4 className="font-display text-[4.6cqw] font-semibold leading-snug text-[var(--fg-primary)]">
                  {cert.title}
                </h4>
                <p className="mt-[1.4cqw] text-[3.1cqw] leading-snug text-[var(--fg-muted)]">
                  {cert.issuer}
                </p>
              </div>
            </div>

            <p className="mt-[3cqw] break-all font-mono text-[2.5cqw] text-[var(--fg-subtle)]">
              {cert.credentialId}
            </p>

            <ul className="mt-[3.5cqw] flex flex-wrap gap-[1.5cqw]">
              {cert.topics.map((topic) => (
                <li
                  key={topic}
                  className="rounded border border-[var(--line-border)] bg-[var(--bg-base)] px-[2cqw] py-[0.7cqw] font-mono text-[2.4cqw] text-[var(--fg-primary)]"
                >
                  {topic}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between border-t border-[var(--line-subtle)] pt-[3cqw]">
              {cert.verifyUrl ? (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  onPointerDown={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-[1.4cqw] font-mono text-[2.8cqw] text-[var(--accent)] transition-colors hover:text-[var(--fg-primary)]"
                >
                  <span>View Certificate</span>
                  <ExternalLink
                    className="size-[3cqw]"
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <span />
              )}
              <span className="font-mono text-[2.5cqw] text-[var(--fg-subtle)] tabular-nums">
                {pageNum} / {totalCount}
              </span>
            </div>
          </article>
        )
      })
    })

    return {
      pages: builtPages,
      groupStartPages: startPages,
      pageToGroupIndex: groupByPage,
    }
  }, [])

  const handleSpreadChange = (spread: number, isSingle: boolean) => {
    let pageIdx = 0
    if (isSingle) {
      pageIdx = spread
    } else if (spread > 0) {
      const leftIdx = 2 * spread - 1
      const rightIdx = 2 * spread
      pageIdx = groupStartPages.includes(rightIdx) ? rightIdx : leftIdx
    }
    const mappedGroup = pageToGroupIndex[pageIdx]
    if (mappedGroup !== undefined) {
      setActiveGroupIndex(mappedGroup)
    }
  }

  const content = (
    <div
      className={cn(
        'relative z-10 w-full',
        !embedded && 'mx-auto max-w-6xl px-4 sm:px-6'
      )}
    >
      <div id={embedded ? undefined : 'certifications-heading'}>
        <CodeRevealItem
          code={sectionHeaderCode(
            '05',
            'CERTIFICATIONS',
            'Credentials & Verified Learning'
          )}
        >
          <SectionHeader
            index="05"
            eyebrow="CERTIFICATIONS"
            title="Credentials & Verified Learning"
            description="Organized by discipline into an interactive credential book — jump to a chapter or flip through each certificate."
          />
        </CodeRevealItem>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {certificationGroups.map((group, idx) => {
          const isActive = activeGroupIndex === idx
          return (
            <CodeRevealItem
              key={group.id}
              code={buildCertificationTabCode(group.title)}
              inline
            >
              <button
                type="button"
                onClick={() => {
                  setActiveGroupIndex(idx)
                  pageFlipRef.current?.flipToPage(groupStartPages[idx])
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors',
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]'
                    : 'border-[var(--line-border)] bg-[var(--bg-surface)]/85 text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--fg-primary)]'
                )}
              >
                <span>{group.title}</span>
                <span className="text-[10px] opacity-75">
                  ({group.certificates.length})
                </span>
              </button>
            </CodeRevealItem>
          )
        })}
      </div>

      <CodeRevealItem code={certificationsBookCode}>
        <div className="flex justify-center lg:justify-start">
          <PageFlip
            ref={pageFlipRef}
            pages={pages}
            onSpreadChange={handleSpreadChange}
            className="max-w-3xl"
          />
        </div>
      </CodeRevealItem>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="border-t border-[var(--line-subtle)]"
    >
      <RevealSection
        label="CertificationsSection"
        toggleOffsetClassName="top-6 right-4 sm:right-6"
      >
        <TopoBackground
          className="min-h-0 bg-transparent py-20 text-[var(--accent-soft)] dark:bg-transparent dark:text-[var(--accent-soft)] sm:py-24"
          interval={0.14}
          speed={0.45}
          seed={42}
          labels={false}
        >
          {content}
        </TopoBackground>
      </RevealSection>
    </section>
  )
}
