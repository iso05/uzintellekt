import { useState } from 'react'
import { FileText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  EmptyState,
  Pagination,
} from '@shared/ui'
import { StatusBadge, getWorkStatus } from '@/entities/work'

const PAGE_SIZE = 10

// The /my-contributions endpoint returns the full array (no server paging), so
// we page it on the client to keep the DOM bounded when a user participates in
// many works. Pagination is 0-based and hides itself for a single page.
export default function ContributionsTable({ contributions, loading, onView }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  const total = contributions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const rows = contributions.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {loading ? (
        <ListSkeleton rows={3} />
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('contrib.empty_title')}
          description={t('contrib.empty_desc')}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('contrib.col_name')}</TableHead>
                <TableHead>{t('contrib.col_desc')}</TableHead>
                <TableHead>{t('contrib.col_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => (
              <TableRow
                key={w.id}
                className="group cursor-pointer"
                onClick={() => onView(w)}
              >
                <TableCell className="max-w-[280px]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="truncate font-semibold text-foreground" title={w.name}>
                      {w.name || '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[320px] text-muted-foreground">
                  <span className="line-clamp-1" title={w.description}>
                    {w.description || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={getWorkStatus(w)} />
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            itemLabel={t('contrib.item_label')}
          />
        </>
      )}
    </section>
  )
}
