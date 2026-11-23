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
    <div className="mb-8 max-w-2xl sm:mb-12">
      <p className="font-mono text-xs tracking-widest text-[var(--accent)] uppercase">
        {index} // {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl leading-[1.15] font-bold tracking-tight text-[var(--fg-primary)] sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2.5 text-sm leading-relaxed text-[var(--fg-muted)] sm:mt-3 sm:text-base">
          {description}
        </p>
      )}
    </div>
  )
}
