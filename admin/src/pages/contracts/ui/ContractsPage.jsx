import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileSignature, Download, AlertTriangle, Loader2 } from 'lucide-react'
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
import { formatDate, formatDateTime } from '@shared/lib/format'
import { toCsv, downloadCsv } from '@shared/lib/csv'
import {
  ContractStateBadge,
  ContractTypeBadge,
  getContractDownloadUrl,
  getContractsGrid,
  CONTRACT_TYPES,
  CONTRACT_STATES,
} from '@/entities/contract'
import { ROUTES } from '@/config/routes'
import { useContractsQueue, buildContractFilters, PAGE_SIZE } from '../model/use-contracts'

const EXPORT_CAP = 5000
const ALL = 'ALL'

export default function ContractsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState(ALL)
  const [state, setState] = useState(ALL)
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState(null)
  const search = useDebouncedValue(searchInput, 350)
  const [exporting, setExporting] = useState(false)

  const filterArgs = {
    type: type === ALL ? null : type,
    state: state === ALL ? null : state,
    search,
  }
  const q = useContractsQueue({ ...filterArgs, sort })

  async function download(contract) {
    try {
      const { url } = await getContractDownloadUrl(contract.id)
      if (url) window.open(url, '_blank', 'noopener')
      else toast.error(t('common.error'))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    }
  }

  async function onExport() {
    setExporting(true)
    try {
      const data = await getContractsGrid({
        page: 1,
        size: Math.min(q.totalItems || PAGE_SIZE, EXPORT_CAP),
        filters: buildContractFilters(filterArgs),
        sort: sort || undefined,
      })
      const columns = [
        { header: t('contract.columns.number'), value: (c) => c.number || '' },
        { header: t('contract.columns.type'), value: (c) => t(`contract.type.${c.type}`, { defaultValue: c.type }) },
        { header: t('contract.columns.state'), value: (c) => t(`contract.state.${c.state}`, { defaultValue: c.state }) },
        { header: t('contract.columns.owner'), value: (c) => c.userId || '' },
        { header: t('contract.columns.signed_at'), value: (c) => c.signedAt || c.effectiveFrom || '' },
      ]
      downloadCsv(`contracts-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data?.items ?? [], columns))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.contracts.title')}
        subtitle={t('page.contracts.subtitle')}
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
        placeholder={t('contract.search_ph')}
      >
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('contract.all_types')}</SelectItem>
            {CONTRACT_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {t(`contract.type.${ct}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('contract.all_states')}</SelectItem>
            {CONTRACT_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`contract.state.${s}`)}
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
          <EmptyState icon={FileSignature} title={t('contract.empty')} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="number" sort={sort} onSortChange={setSort}>
                    {t('contract.columns.number')}
                  </SortableTableHead>
                  <SortableTableHead field="type" sort={sort} onSortChange={setSort}>
                    {t('contract.columns.type')}
                  </SortableTableHead>
                  <SortableTableHead field="state" sort={sort} onSortChange={setSort}>
                    {t('contract.columns.state')}
                  </SortableTableHead>
                  <TableHead>{t('contract.columns.owner')}</TableHead>
                  <SortableTableHead field="signedAt" sort={sort} onSortChange={setSort}>
                    {t('contract.columns.signed_at')}
                  </SortableTableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.number || '—'}</TableCell>
                    <TableCell>
                      <ContractTypeBadge type={c.type} />
                    </TableCell>
                    <TableCell>
                      <ContractStateBadge state={c.state} />
                    </TableCell>
                    <TableCell>
                      {c.userId ? (
                        <Link to={ROUTES.USER_DETAIL(c.userId)} className="text-primary hover:underline">
                          {t('contract.open_user')}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {c.signedAt ? formatDateTime(c.signedAt) : c.effectiveFrom ? formatDate(c.effectiveFrom) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => download(c)}
                        aria-label={t('work.download')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
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
              itemLabel={t('contract.items')}
            />
          </>
        )}
      </Card>
    </div>
  )
}
