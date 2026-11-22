import { THEME_OPTIONS, useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  className?: string
  compact?: boolean
}

/**
 * Accessible three-theme selector displaying paired color swatches and an
 * unmistakable active indicator.
 */
export function ThemeSwitcher({
  className,
  compact = false,
}: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const activeOption =
    THEME_OPTIONS.find((item) => item.id === theme) ?? THEME_OPTIONS[0]

  return (
    <div
      role="radiogroup"
      aria-label="Select color theme"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--line-border)] bg-[var(--bg-surface-translucent)] p-1 backdrop-blur-md',
        className
      )}
    >
      {THEME_OPTIONS.map((option) => {
        const isActive = option.id === theme
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label} theme — ${option.description}`}
            title={`${option.label}: ${option.description}`}
            onClick={() => setTheme(option.id)}
            className={cn(
              'relative inline-flex items-center justify-center rounded-full p-1 transition-all duration-150',
              isActive
                ? 'bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]'
                : 'opacity-75 hover:opacity-100'
            )}
          >
            <span
              aria-hidden="true"
              className="flex h-4 w-4 overflow-hidden rounded-full border border-[var(--line-border)]"
            >
              <span
                className="h-full w-1/2"
                style={{ backgroundColor: option.swatchBg }}
              />
              <span
                className="h-full w-1/2"
                style={{ backgroundColor: option.swatchAccent }}
              />
            </span>
          </button>
        )
      })}

      {!compact && (
        <span className="hidden pr-2 pl-1 font-mono text-[11px] text-[var(--fg-muted)] lg:inline">
          {activeOption.label}
        </span>
      )}
    </div>
  )
}
