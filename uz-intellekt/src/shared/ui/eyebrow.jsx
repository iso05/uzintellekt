import { cn } from '@/shared/lib/utils'

/**
 * Section eyebrow — a small uppercase label with a coral accent dot,
 * used above in-page section headings (H2). One unified style site-wide.
 */
export function Eyebrow({ children, align = 'left', className }) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary',
        align === 'center' && 'justify-center',
        className
      )}
    >
      <span className="h-1 w-1 rounded-full bg-accent" />
      {children}
    </p>
  )
}

/**
 * Hero chip — a soft pill with an optional leading icon, used once at the
 * top of a page above the hero heading (H1). One unified style site-wide.
 */
export function HeroChip({ icon: Icon, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  )
}
