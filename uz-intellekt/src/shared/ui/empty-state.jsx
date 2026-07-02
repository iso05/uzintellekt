import { cn } from '@/shared/lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }) {
  const iconSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'
  const iconBox = size === 'sm' ? 'h-12 w-12' : 'h-14 w-14'
  const padY = size === 'sm' ? 'py-10' : 'py-14'

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 text-center', padY, className)}>
      {Icon && (
        <span className={cn('flex items-center justify-center rounded-full bg-muted text-muted-foreground', iconBox)}>
          <Icon className={iconSize} />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        {description && (
          <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
