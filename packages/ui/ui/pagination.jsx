import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@shared/lib/utils'

function _windowOf(current, total, max = 7) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i)
  const half = Math.floor(max / 2)
  let start = Math.max(0, current - half)
  const end = Math.min(total, start + max)
  start = Math.max(0, end - max)
  return Array.from({ length: end - start }, (_, i) => start + i)
}

/**
 * Generic pagination. `page` and onPageChange are 0-based.
 * For 1-based callers pass page-1 in and add 1 on output.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  itemLabel,
}) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const visible = _windowOf(page, totalPages, 7)
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  const label = itemLabel || t('pagination.items')

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-3.5 md:px-6',
        className
      )}
    >
      <span className="text-[13px] font-medium text-muted-foreground">
        {t('pagination.total')} {total} {label} • {from}–{to}
      </span>

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('pagination.prev')}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {visible.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 text-xs"
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('pagination.next')}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
