import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import {
  Card,
  CardContent,
  Button,
  Calendar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Skeleton,
  EmptyState,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { formatDate } from '@shared/lib/format'
import { PERIOD_PRESETS, CUSTOM_KEY, makePreset, makeCustom } from '../model/periods'

// Period-over-period change indicator (green up / red down).
export function DeltaBadge({ pct, label }) {
  if (pct == null) return null
  const up = pct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-medium', up ? 'text-success' : 'text-destructive')}>
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {pct}%
      {label && <span className="font-normal text-muted-foreground">{label}</span>}
    </span>
  )
}

const TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

// Period control: preset buttons (7/30/90 days) plus a custom date-range picked
// on a calendar. `value` is a period object { key, from, to }; `onChange` gets a
// new period object.
export function PeriodSelector({ value, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState(undefined)

  const label =
    value.key === CUSTOM_KEY
      ? `${formatDate(value.from)} – ${formatDate(value.to)}`
      : t(`dashboard.period.${value.key}`)

  function pickPreset(key) {
    onChange(makePreset(key))
    setOpen(false)
  }

  function applyCustom() {
    if (!range?.from || !range?.to) return
    onChange(makeCustom(range.from, range.to))
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        // Seed the calendar with the active custom range when reopening.
        if (o) setRange(value.key === CUSTOM_KEY ? { from: value.from, to: value.to } : undefined)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[150px] justify-start gap-2 font-normal">
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-wrap gap-1.5 border-b border-border p-2">
          {PERIOD_PRESETS.map((p) => (
            <Button
              key={p.key}
              variant={value.key === p.key ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => pickPreset(p.key)}
            >
              {t(`dashboard.period.${p.key}`)}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
          defaultMonth={value.from}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <span className="pl-1 text-[12px] text-muted-foreground">
            {range?.from ? formatDate(range.from) : '—'} – {range?.to ? formatDate(range.to) : '—'}
          </span>
          <Button size="sm" className="h-7 text-xs" disabled={!range?.from || !range?.to} onClick={applyCustom}>
            {t('dashboard.period.apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MetricCard({ icon: Icon, tone = 'primary', label, value, loading, footer }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', TONES[tone])}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="m-0 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        )}
        {footer && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">{footer}</div>}
      </CardContent>
    </Card>
  )
}

// A tiny "colored dot + label + count" stat used in metric-card footers.
export function MiniStat({ color, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </span>
  )
}

export function ChartCard({ title, actions, loading, isEmpty, emptyIcon, emptyText, children, className }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <h3 className="m-0 text-[15px] font-semibold text-foreground">{title}</h3>
        {actions}
      </div>
      <div className="flex-1 p-5">
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : isEmpty ? (
          <EmptyState icon={emptyIcon} title={emptyText} size="sm" />
        ) : (
          children
        )}
      </div>
    </Card>
  )
}

export function TopList({ items, valueFormatter, emptyText, onItemClick }) {
  if (!items?.length) {
    return <p className="py-6 text-center text-[13px] text-muted-foreground">{emptyText}</p>
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((it, i) => {
        const clickable = onItemClick && it.userId
        return (
          <li
            key={it.userId || i}
            onClick={clickable ? () => onItemClick(it) : undefined}
            className={cn(
              'flex items-center gap-3 py-2.5 first:pt-0 last:pb-0',
              clickable && '-mx-2 cursor-pointer rounded px-2 hover:bg-muted'
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
              {it.name || '—'}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-primary">{valueFormatter(it)}</span>
          </li>
        )
      })}
    </ul>
  )
}
