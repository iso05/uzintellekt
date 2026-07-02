import { cn } from '@shared/lib/utils'

export function PageHeader({ title, subtitle, actions, leading, className }) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-4">
        {leading}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="m-0 text-[13.5px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
