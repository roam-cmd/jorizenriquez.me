interface SectionHeaderProps {
  index: string
  eyebrow: string
  title: string
  description?: string
}

/**
 * Consistent editorial header used at the top of each portfolio section.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-10 max-w-2xl sm:mb-12">
      <p className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
        {index} // {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--fg-primary)] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-[var(--fg-muted)]">
          {description}
        </p>
      )}
    </div>
  )
}
