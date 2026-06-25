import { useTranslation } from 'react-i18next'
import { Search, RefreshCw, X } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { WORK_STATUS_CONFIG } from '@/entities/work'

const STATE_KEYS = Object.keys(WORK_STATUS_CONFIG).filter((key) => key !== 'APPROVED')
const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function WorksToolbar({
  search,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  pageSize,
  onPageSizeChange,
  onRefresh,
  loading,
}) {
  const { t } = useTranslation()
  const stateOptions = [
    { value: 'all', label: t('works.all_states') },
    ...STATE_KEYS.map((value) => ({ value, label: t(`work_status.${value}`) })),
  ]
  return (
    <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border bg-card p-3 shadow-soft sm:grid-cols-[1fr_180px_110px_auto] sm:items-center">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('works.search_ph')}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.clear')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Select
        value={stateFilter || 'all'}
        onValueChange={(v) => onStateFilterChange(v === 'all' ? '' : v)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stateOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((s) => (
            <SelectItem key={s} value={String(s)}>
              {t('works.page_size', { n: s })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        disabled={loading}
        onClick={onRefresh}
        title={t('common.refresh')}
        aria-label={t('common.refresh')}
        className="h-10 w-10 shrink-0 justify-self-end"
      >
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
    </div>
  )
}
