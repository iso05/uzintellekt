import { cn } from '@/shared/lib/utils'

const TONES = {
  primary: {
    bg: 'bg-primary-soft/60',
    border: 'border-primary/20',
    icon: 'text-primary',
    value: 'text-primary',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    icon: 'text-success',
    value: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/25',
    icon: 'text-warning',
    value: 'text-warning',
  },
  destructive: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
    value: 'text-destructive',
  },
}

const MUTED = {
  bg: 'bg-muted/40',
  border: 'border-border',
  icon: 'text-muted-foreground',
  value: 'text-foreground/60',
}

export default function StatCard({ icon: Icon, label, value, tone = 'primary', hint, onClick }) {
  const isZeroNeutral = (tone === 'destructive' || tone === 'warning') && (value === 0 || value === '0')
  const t = isZeroNeutral ? MUTED : (TONES[tone] ?? TONES.primary)
  const isInteractive = typeof onClick === 'function'
  const Component = isInteractive ? 'button' : 'div'

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-4 overflow-hidden rounded-xl border p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-md',
        t.bg,
        t.border,
        isInteractive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
      )}
    >
      <Icon className={cn('h-6 w-6', t.icon)} />
      <div className="flex flex-col gap-1">
        <span className={cn('text-3xl font-bold leading-none tracking-tight tabular-nums', t.value)}>
          {value}
        </span>
        <span className="text-[13px] font-semibold text-foreground/70">{label}</span>
        {hint && <span className="mt-1 text-[12px] text-muted-foreground">{hint}</span>}
      </div>
    </Component>
  )
}
