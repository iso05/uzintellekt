import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  toast,
  PageHeader,
} from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'
import {
  getWorks,
  getWork,
  getMyContributions,
  WorkDetailDialog,
} from '@/entities/work'
import { WorksToolbar } from '@/widgets/works-toolbar'
import { WorksTable } from '@/widgets/works-table'
import { ContributionsTable } from '@/widgets/contributions-table'

const SEARCH_MIN_CHARS = 2
const DEFAULT_PAGE_SIZE = 10

export default function WorksPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [works, setWorks] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [stateFilter, setStateFilter] = useState(() => searchParams.get('state') || '')
  const [loading, setLoading] = useState(true)

  // Sync filters when query params change (e.g. user navigates from stat card or header search)
  useEffect(() => {
    const qSearch = searchParams.get('search') || ''
    const qState = searchParams.get('state') || ''
    setSearch(qSearch)
    setStateFilter(qState)
    setPage(1)
  }, [searchParams])

  const applyFilterToUrl = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams)
      Object.entries(next).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const [contributions, setContributions] = useState([])
  const [contribLoading, setContribLoading] = useState(false)

  const [detailWork, setDetailWork] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadWorks = useCallback(async () => {
    setLoading(true)
    try {
      const filters = []
      if (stateFilter) {
        filters.push({ field: 'state', operator: 'eq', value: stateFilter })
      }
      if (search.trim().length >= SEARCH_MIN_CHARS) {
        filters.push({ field: 'name', operator: 'lk', value: search.trim() })
      }
      const res = await getWorks({
        page,
        size: pageSize,
        filters,
        sort: { selector: 'createdAt', desc: true },
      })
      setWorks(res?.items ?? res?.data?.items ?? [])
      setTotal(res?.totalItems ?? res?.data?.totalItems ?? 0)
    } catch (e) {
      toast.error(e?.message || t('works.load_error'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, stateFilter])

  const loadContributions = useCallback(async () => {
    setContribLoading(true)
    try {
      const data = await getMyContributions()
      setContributions(data ?? [])
    } catch (e) {
      console.error('Contributions load error:', e)
    } finally {
      setContribLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorks()
  }, [loadWorks])

  useEffect(() => {
    loadContributions()
  }, [loadContributions])

  const openDetail = useCallback(async (work) => {
    setDetailLoading(true)
    try {
      const full = await getWork(work.id)
      setDetailWork(full)
    } catch (e) {
      toast.error(e?.message || t('common.detail_error'))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleChanged = useCallback(() => {
    loadWorks()
    setDetailWork(null)
  }, [loadWorks])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('works.title')}
        subtitle={t('works.subtitle')}
        actions={
          <Button onClick={() => navigate(ROUTES.WORK_NEW)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            {t('works.new')}
          </Button>
        }
      />

      <Tabs defaultValue="my-works">
        <TabsList>
          <TabsTrigger value="my-works" className="group">
            {t('works.tab_mine')}
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground group-data-[state=active]:bg-primary-soft group-data-[state=active]:text-primary">
              {total}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contributions" className="group">
            {t('works.tab_contrib')}
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground group-data-[state=active]:bg-primary-soft group-data-[state=active]:text-primary">
              {contributions.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-works" className="space-y-4">
          <WorksToolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
              applyFilterToUrl({ search: v })
            }}
            stateFilter={stateFilter}
            onStateFilterChange={(v) => {
              setStateFilter(v)
              setPage(1)
              applyFilterToUrl({ state: v })
            }}
            pageSize={pageSize}
            onPageSizeChange={(v) => {
              setPageSize(v)
              setPage(1)
            }}
            onRefresh={loadWorks}
            loading={loading}
          />
          <WorksTable
            works={works}
            loading={loading || detailLoading}
            hasFilters={!!(search || stateFilter)}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onView={openDetail}
            onChanged={handleChanged}
          />
        </TabsContent>

        <TabsContent value="contributions">
          <ContributionsTable
            contributions={contributions}
            loading={contribLoading || detailLoading}
            onView={openDetail}
          />
        </TabsContent>
      </Tabs>

      <WorkDetailDialog
        work={detailWork}
        open={!!detailWork}
        onOpenChange={(o) => !o && setDetailWork(null)}
      />
    </div>
  )
}
