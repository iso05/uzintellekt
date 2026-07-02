import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronRight, AlertTriangle, Download, Loader2 } from 'lucide-react'
import {
  PageHeader,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Pagination,
  ListSkeleton,
  EmptyState,
  DataGridToolbar,
  SortableTableHead,
  toast,
} from '@shared/ui'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { formatDate } from '@shared/lib/format'
import { toCsv, downloadCsv } from '@shared/lib/csv'
import { WorkStatusBadge, WORK_STATUS_ORDER, getWorksGrid } from '@/entities/work'
import { useWorkTypeMap } from '@/entities/dictionary'
import { ROUTES } from '@/config/routes'
import { useWorksQueue, buildWorkFilters, PAGE_SIZE } from '../model/use-works'

const ALL = 'ALL'
const EXPORT_CAP = 5000

function authorName(work) {
  const rh = work?.rightHolders?.[0]
  if (!rh) return '—'
  return [rh.lastName, rh.firstName].filter(Boolean).join(' ') || '—'
}

export default function ModerationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Drill-down from the dashboard: /moderation?state=REGISTERED preselects the filter.
  const paramState = searchParams.get('state')
  const initialStatus = WORK_STATUS_ORDER.includes(paramState) ? paramState : 'UNDER_REVIEW'
  const [status, setStatus] = useState(initialStatus)
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState(null)
  const search = useDebouncedValue(searchInput, 350)
  const [exporting, setExporting] = useState(false)
  const typeMap = useWorkTypeMap()
  const activeStatus = status === ALL ? null : status
  const q = useWorksQueue({ status: activeStatus, search, sort })

  async function onExport() {
    setExporting(true)
    try {
      const data = await getWorksGrid({
        page: 1,
        size: Math.min(q.totalItems || PAGE_SIZE, EXPORT_CAP),
        filters: buildWorkFilters({ status: activeStatus, search }),
        sort: sort || undefined,
      })
      const columns = [
        { header: t('moderation.columns.name'), value: (w) => w.name || '' },
        { header: t('moderation.columns.type'), value: (w) => typeMap[w.workTypeId] || `#${w.workTypeId}` },
        { header: t('moderation.columns.author'), value: authorName },
        { header: t('moderation.columns.status'), value: (w) => t(`dashboard.work_status.${w.state}`, { defaultValue: w.state }) },
        { header: t('moderation.columns.created'), value: (w) => w.createdAt || '' },
      ]
      downloadCsv(`works-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data?.items ?? [], columns))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.moderation.title')}
        subtitle={t('page.moderation.subtitle')}
        actions={
          <Button variant="outline" onClick={onExport} disabled={exporting || q.loading}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('common.export')}
          </Button>
        }
      />

      <DataGridToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        placeholder={t('moderation.search_ph')}
      >
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {WORK_STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`dashboard.work_status.${s}`)}
              </SelectItem>
            ))}
            <SelectItem value={ALL}>{t('moderation.filter_all')}</SelectItem>
          </SelectContent>
        </Select>
      </DataGridToolbar>

      <Card className="overflow-hidden">
        {q.loading ? (
          <ListSkeleton rows={6} />
        ) : q.error ? (
          <EmptyState icon={AlertTriangle} title={t('common.error')} description={q.error} />
        ) : !q.items.length ? (
          <EmptyState icon={FileText} title={t('moderation.empty')} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="name" sort={sort} onSortChange={setSort}>
                    {t('moderation.columns.name')}
                  </SortableTableHead>
                  <TableHead>{t('moderation.columns.type')}</TableHead>
                  <TableHead>{t('moderation.columns.author')}</TableHead>
                  <TableHead>{t('moderation.columns.status')}</TableHead>
                  <SortableTableHead field="createdAt" sort={sort} onSortChange={setSort}>
                    {t('moderation.columns.created')}
                  </SortableTableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.items.map((w) => (
                  <TableRow
                    key={w.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.WORK_DETAIL(w.id))}
                  >
                    <TableCell className="max-w-[280px] truncate font-medium text-foreground">
                      {w.name || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {typeMap[w.workTypeId] || `#${w.workTypeId}`}
                    </TableCell>
                    <TableCell className="text-foreground">{authorName(w)}</TableCell>
                    <TableCell>
                      <WorkStatusBadge status={w.state} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(w.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={q.page - 1}
              pageSize={q.pageSize}
              total={q.totalItems}
              onPageChange={(p) => q.setPage(p + 1)}
              itemLabel={t('moderation.items')}
            />
          </>
        )}
      </Card>
    </div>
  )
}
