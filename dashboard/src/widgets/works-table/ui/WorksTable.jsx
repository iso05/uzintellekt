import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Plus, Inbox } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  Pagination,
  Button,
  EmptyState,
} from '@shared/ui'
import {
  StatusBadge,
  WorkTypeBadge,
  getWorkStatus,
  useDictionaries,
} from '@/entities/work'
import { WorkActions } from '@/widgets/work-actions'
import { ROUTES } from '@/config/routes'
import { formatDate } from '@shared/lib/format'

function WorksEmptyState({ hasFilters }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={Inbox}
      title={hasFilters ? t('works.empty_found_title') : t('works.empty_title')}
      description={hasFilters ? t('works.empty_found_desc') : t('works.empty_desc')}
      action={
        !hasFilters && (
          <Button onClick={() => navigate(ROUTES.WORK_NEW)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('works.empty_action')}
          </Button>
        )
      }
    />
  )
}

export default function WorksTable({
  works,
  loading,
  hasFilters,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onView,
  onChanged,
}) {
  const { workTypes } = useDictionaries()
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5 text-[13px] font-medium text-muted-foreground md:px-6">
        <span>{t('works.total', { n: total })}</span>
      </header>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : works.length === 0 ? (
        <WorksEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <div className="overflow-x-auto w-full no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('works.col_name')}</TableHead>
                  <TableHead>{t('works.col_type')}</TableHead>
                  <TableHead>{t('works.col_status')}</TableHead>
                  <TableHead>{t('works.col_holders')}</TableHead>
                  <TableHead>{t('works.col_registered')}</TableHead>
                  <TableHead>{t('works.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((w) => {
                  const status = getWorkStatus(w)
                  const isRegistered = status === 'REGISTERED'
                  return (
                    <TableRow
                      key={w.id}
                      className="group cursor-pointer"
                      onClick={() => onView(w)}
                    >
                      <TableCell className="max-w-[240px]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-foreground" title={w.name}>
                              {w.name || '—'}
                            </span>
                            {status === 'REJECTED' && w.rejectionReason && (
                              <span className="mt-0.5 line-clamp-2 text-[11px] font-medium text-destructive">
                                {t('works.reject_reason')} {w.rejectionReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <WorkTypeBadge workTypeId={w.workTypeId} workTypes={workTypes} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t('works.holders', { n: w.rightHolders?.length ?? 0 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {isRegistered ? formatDate(w.registrationDate) : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <WorkActions work={w} onView={onView} onChanged={onChanged} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page - 1}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => onPageChange(p + 1)}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={onPageSizeChange}
            itemLabel={t('works.item_label')}
          />
        </>
      )}
    </section>
  )
}
