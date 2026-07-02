import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, ArrowRight, FilePlus2 } from 'lucide-react'
import { Button, ListSkeleton, EmptyState } from '@shared/ui'
import { StatusBadge, getWorkStatus } from '@/entities/work'
import { formatDateTime } from '@shared/lib/format'
import { ROUTES } from '@/config/routes'

export default function RecentWorksTable({ works, loading, onView }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Row click always opens the detail page (which offers Edit for drafts) —
  // same rule as the works list, so the interaction is uniform everywhere.
  const goToWork = (work) => onView?.(work)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileText className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col">
            <h2 className="text-[15px] font-bold leading-tight text-foreground">{t('recent.title')}</h2>
            <p className="text-[12px] text-muted-foreground">{t('recent.subtitle')}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.WORKS)}
          className="gap-1.5 text-primary hover:bg-primary-soft hover:text-primary"
        >
          {t('recent.all')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </header>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : works.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title={t('recent.empty_title')}
          description={t('recent.empty_desc')}
          action={
            <Button onClick={() => navigate(ROUTES.WORK_NEW)} className="gap-2">
              <FilePlus2 className="h-4 w-4" />
              {t('recent.empty_action')}
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {works.map((w) => {
            const status = getWorkStatus(w)
            return (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => goToWork(w)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 md:px-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14px] font-semibold text-foreground" title={w.name}>
                      {w.name || '—'}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {formatDateTime(w.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={status} className="shrink-0" />
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary md:block" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
