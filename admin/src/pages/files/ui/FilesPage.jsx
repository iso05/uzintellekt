import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderArchive, Download, Trash2, AlertTriangle, HardDrive, Gauge, Users, Loader2 } from 'lucide-react'
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  toast,
} from '@shared/ui'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useLocalStorageState } from '@shared/hooks/use-local-storage-state'
import { formatBytes, formatDateTime } from '@shared/lib/format'
import { toCsv, downloadCsv } from '@shared/lib/csv'
import {
  WorkFileStatusBadge,
  getAdminFileDownloadUrl,
  deleteWorkFile,
  getAdminFilesGrid,
  WORK_FILE_STATES,
} from '@/entities/work'
import { ROUTES } from '@/config/routes'
import { useFilesQueue, buildFileFilters, PAGE_SIZE } from '../model/use-files'

const EXPORT_CAP = 5000
const ALL = 'ALL'

function QuotaChip({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-bold leading-tight text-foreground">{value}</span>
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </span>
    </Card>
  )
}

export default function FilesPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState(ALL)
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState(null)
  const search = useDebouncedValue(searchInput, 350)
  const [pageSize, setPageSize] = useLocalStorageState('files_page_size', PAGE_SIZE)

  const filterArgs = { status: status === ALL ? null : status, search }
  const q = useFilesQueue({ ...filterArgs, sort, pageSize })
  const [del, setDel] = useState({ open: false, file: null })
  const [exporting, setExporting] = useState(false)

  async function onExport() {
    setExporting(true)
    try {
      const data = await getAdminFilesGrid({
        page: 1,
        size: Math.min(q.totalItems || PAGE_SIZE, EXPORT_CAP),
        filters: buildFileFilters(filterArgs),
        sort: sort || undefined,
      })
      const columns = [
        { header: t('files.columns.file'), value: (f) => f.originalFileName || '' },
        { header: t('files.columns.work'), value: (f) => f.workId || '' },
        { header: t('files.columns.size'), value: (f) => formatBytes(f.sizeBytes) },
        { header: t('files.columns.status'), value: (f) => t(`file_state.${f.state}`, { defaultValue: f.state }) },
        { header: t('files.columns.uploaded'), value: (f) => f.createdAt || '' },
      ]
      downloadCsv(`files-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data?.items ?? [], columns))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setExporting(false)
    }
  }

  async function download(file) {
    try {
      const { downloadUrl } = await getAdminFileDownloadUrl(file.workId, file.id)
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener')
      else toast.error(t('common.error'))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    }
  }

  async function confirmDelete() {
    const file = del.file
    try {
      await deleteWorkFile(file.workId, file.id)
      toast.success(t('files.deleted_toast'))
      q.reload()
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.files.title')}
        subtitle={t('page.files.subtitle')}
        actions={
          <Button variant="outline" onClick={onExport} disabled={exporting || q.loading}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('common.export')}
          </Button>
        }
      />

      {q.quota && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuotaChip icon={HardDrive} label={t('files.total_storage')} value={formatBytes(q.quota.totalBytes)} />
          <QuotaChip icon={Gauge} label={t('files.per_user_cap')} value={formatBytes(q.quota.perUserCapBytes)} />
          <QuotaChip icon={Users} label={t('files.users_near_cap')} value={q.quota.usersNearCap ?? 0} />
        </div>
      )}

      <DataGridToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        placeholder={t('files.search_ph')}
      >
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('files.all_states')}</SelectItem>
            {WORK_FILE_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`file_state.${s}`, { defaultValue: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataGridToolbar>

      <Card className="overflow-hidden">
        {q.loading ? (
          <ListSkeleton rows={6} />
        ) : q.error ? (
          <EmptyState icon={AlertTriangle} title={t('common.error')} description={q.error} />
        ) : !q.items.length ? (
          <EmptyState icon={FolderArchive} title={t('files.empty')} />
        ) : (
          <TooltipProvider delayDuration={300}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="originalFileName" sort={sort} onSortChange={setSort}>
                    {t('files.columns.file')}
                  </SortableTableHead>
                  <TableHead>{t('files.columns.work')}</TableHead>
                  <SortableTableHead field="sizeBytes" sort={sort} onSortChange={setSort}>
                    {t('files.columns.size')}
                  </SortableTableHead>
                  <SortableTableHead field="state" sort={sort} onSortChange={setSort}>
                    {t('files.columns.status')}
                  </SortableTableHead>
                  <SortableTableHead field="createdAt" sort={sort} onSortChange={setSort}>
                    {t('files.columns.uploaded')}
                  </SortableTableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="max-w-[320px] font-medium text-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">{f.originalFileName}</span>
                        </TooltipTrigger>
                        <TooltipContent>{f.originalFileName}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Link to={ROUTES.WORK_DETAIL(f.workId)} className="text-primary hover:underline">
                        {t('files.open_work')}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatBytes(f.sizeBytes)}
                    </TableCell>
                    <TableCell>
                      <WorkFileStatusBadge state={f.state} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {f.createdAt ? formatDateTime(f.createdAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => download(f)}
                          disabled={f.state !== 'UPLOADED'}
                          aria-label={t('work.download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDel({ open: true, file: f })}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t('files.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
              itemLabel={t('files.items')}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={setPageSize}
            />
          </TooltipProvider>
        )}
      </Card>

      <AlertDialog open={del.open} onOpenChange={(open) => setDel((s) => ({ ...s, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('files.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('files.delete_confirm', { name: del.file?.originalFileName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('files.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
