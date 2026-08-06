import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, ChevronRight, AlertTriangle, Plus, Download, Loader2 } from 'lucide-react'
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
  Badge,
  toast,
} from '@shared/ui'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useLocalStorageState } from '@shared/hooks/use-local-storage-state'
import { formatDate } from '@shared/lib/format'
import { toCsv, downloadCsv } from '@shared/lib/csv'
import {
  UserStateBadge,
  getFullName,
  getUsersGrid,
  USER_STATES,
  USER_ROLES,
} from '@/entities/user'
import { CreateUserDialog } from '@/features/user-create'
import { ROUTES } from '@/config/routes'
import { useUsersQueue, buildUserFilters, PAGE_SIZE } from '../model/use-users'

const EXPORT_CAP = 5000
const ALL = 'ALL'

export default function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [state, setState] = useState(ALL)
  const [type, setType] = useState(ALL)
  const [role, setRole] = useState('USER')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState(null)
  const search = useDebouncedValue(searchInput, 350)
  const [pageSize, setPageSize] = useLocalStorageState('users_page_size', PAGE_SIZE)
  const [createOpen, setCreateOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const queryArgs = {
    state: state === ALL ? null : state,
    type: type === ALL ? null : type,
    role: role === ALL ? null : role,
    search,
  }
  const q = useUsersQueue({ ...queryArgs, sort, pageSize })

  async function onExport() {
    setExporting(true)
    try {
      const data = await getUsersGrid({
        page: 1,
        size: Math.min(q.totalItems || PAGE_SIZE, EXPORT_CAP),
        filters: buildUserFilters(queryArgs),
        sort: sort || undefined,
      })
      const columns = [
        { header: t('user.columns.name'), value: (u) => getFullName(u) },
        { header: t('user.form.type'), value: (u) => t((u.userType || u.type) === 'LEGAL' ? 'user.form.legal' : 'user.form.individual') },
        { header: t('user.columns.state'), value: (u) => t(`dashboard.user_state.${u.state}`, { defaultValue: u.state }) },
        { header: t('user.columns.phone'), value: (u) => (u.phones || []).join(', ') },
        { header: t('user.form.pinfl'), value: (u) => u.pinfl || '' },
        { header: t('user.form.address'), value: (u) => u.address || '' },
        { header: t('user.columns.created'), value: (u) => u.createdAt || '' },
      ]
      downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(data?.items ?? [], columns))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.users.title')}
        subtitle={t('page.users.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onExport} disabled={exporting || q.loading}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('common.export')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('user.create')}
            </Button>
          </div>
        }
      />

      <DataGridToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        placeholder={t('user.search_ph')}
      >
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('user.all_types')}</SelectItem>
            <SelectItem value="INDIVIDUAL">{t('user.form.individual')}</SelectItem>
            <SelectItem value="LEGAL">{t('user.form.legal')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('user.all_states')}</SelectItem>
            {USER_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`dashboard.user_state.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={ALL}>{t('user.all_roles')}</SelectItem>
            {USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {t(`role.${r.toLowerCase()}`, { defaultValue: r })}
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
          <EmptyState icon={Users} title={t('user.empty')} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="lastName" sort={sort} onSortChange={setSort}>
                    {t('user.columns.name')}
                  </SortableTableHead>
                  <TableHead>{t('user.form.type')}</TableHead>
                  <TableHead>{t('user.columns.state')}</TableHead>
                  <TableHead>{t('user.columns.phone')}</TableHead>
                  <SortableTableHead field="createdAt" sort={sort} onSortChange={setSort}>
                    {t('user.columns.created')}
                  </SortableTableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.items.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.USER_DETAIL(u.id))}
                  >
                    <TableCell className="max-w-[280px] truncate font-medium text-foreground">
                      {getFullName(u) || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={(u.userType || u.type) === 'LEGAL' ? 'info' : 'muted'}>
                        {t((u.userType || u.type) === 'LEGAL' ? 'user.form.legal' : 'user.form.individual')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserStateBadge state={u.state} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {u.phones?.[0] || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
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
              itemLabel={t('user.items')}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </Card>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(u) => {
          q.reload()
          if (u?.id) navigate(ROUTES.USER_DETAIL(u.id))
        }}
      />
    </div>
  )
}
