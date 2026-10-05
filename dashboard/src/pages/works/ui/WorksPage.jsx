import { useState, useEffect, useCallback, useRef } from 'react'
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
} from '@shared/ui'
import { useLocalStorageState } from '@shared/hooks/use-local-storage-state'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { getWorks, getMyContributions, usePendingConsentCount, markConsentIdsAsSeen } from '@/entities/work'
import { WorksToolbar } from '@/widgets/works-toolbar'
import { WorksTable } from '@/widgets/works-table'
import { ContributionsTable } from '@/widgets/contributions-table'

const SEARCH_MIN_CHARS = 2
const DEFAULT_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300
const OWN_WORK_IDS_PAGE_SIZE = 50
const EMPTY_WORK_IDS = new Set()

function getGridItems(response) {
  return response?.items ?? response?.content ?? response?.data?.items ?? response?.data?.content ?? (Array.isArray(response) ? response : [])
}

function getGridTotal(response, fallback = 0) {
  return response?.totalItems ?? response?.totalElements ?? response?.data?.totalItems ?? response?.data?.totalElements ?? fallback
}

export default function WorksPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  let user = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    user = useAuth()?.user
  } catch {
    // Fallback when rendered outside AuthProvider (e.g. unit tests)
  }
  const [searchParams, setSearchParams] = useSearchParams()

  const [works, setWorks] = useState([])
  const [total, setTotal] = useState(0)
  const [ownWorkIds, setOwnWorkIds] = useState(null)

  const { pendingCount } = usePendingConsentCount({ ownWorkIds: ownWorkIds || EMPTY_WORK_IDS, userId: user?.id })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useLocalStorageState('my_works_page_size', DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  // Debounced mirror of `search` — the input updates instantly, but the fetch
  // only fires once typing settles, instead of one request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [stateFilter, setStateFilter] = useState(() => searchParams.get('state') || '')
  const [loading, setLoading] = useState(true)
  // Monotonic request id — a slow earlier response must not overwrite a newer one.
  const reqIdRef = useRef(0)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])

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

  const loadWorks = useCallback(async () => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    try {
      const filters = []
      if (stateFilter) {
        filters.push({ field: 'state', operator: 'eq', value: stateFilter })
      }
      const q = debouncedSearch.trim()
      if (q.length >= SEARCH_MIN_CHARS) {
        filters.push({ field: 'name', operator: 'lk', value: q })
      }
      const res = await getWorks({
        page,
        size: pageSize,
        filters,
        sort: { selector: 'createdAt', desc: true },
      })
      if (reqId !== reqIdRef.current) return []
      const list = getGridItems(res)
      const tot = getGridTotal(res, list.length)
      setWorks(list)
      setTotal(tot)
      return list
    } catch (e) {
      if (reqId !== reqIdRef.current) return []
      toast.error(e?.message || t('works.load_error'))
      return []
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, stateFilter, t])

  // Contributions include works owned by the current user. Load every own-work
  // ID without the visible tab's filters so ownership classification stays
  // correct while the user filters or searches their own list.
  const loadOwnWorkIds = useCallback(async () => {
    const firstPage = await getWorks({
      page: 1,
      size: OWN_WORK_IDS_PAGE_SIZE,
      filters: [],
      sort: { selector: 'createdAt', desc: true },
    })
    const firstItems = getGridItems(firstPage)
    const totalItems = getGridTotal(firstPage, firstItems.length)
    const pageCount = Math.ceil(totalItems / OWN_WORK_IDS_PAGE_SIZE)
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        getWorks({
          page: index + 2,
          size: OWN_WORK_IDS_PAGE_SIZE,
          filters: [],
          sort: { selector: 'createdAt', desc: true },
        })
      )
    )
    const allWorks = [firstItems, ...remainingPages.map(getGridItems)].flat()
    return new Set(allWorks.map((work) => String(work.id || work.workId).toLowerCase()))
  }, [])

  const loadContributions = useCallback(async (knownOwnIds) => {
    setContribLoading(true)
    try {
      const data = await getMyContributions()
      const list = data ?? []

      // Exclude works created by current user — own works belong in "Mening asarlarim",
      // whereas "Qatnashgan asarlarim" is for works created by someone else.
      // Also exclude DRAFT works — draft works are private to the primary author until submitted.
      const filtered = list.filter((item) => {
        const id = String(item.id || item.workId).toLowerCase()
        if (knownOwnIds.has(id)) return false
        if (user?.id && item.createdBy && String(item.createdBy) === String(user.id)) return false

        const st = String(item.state || item.status || item.workState || '').toUpperCase()
        if (st === 'DRAFT' || st === 'DRAFT_LIMIT_REACHED') return false

        return true
      })
      setContributions(filtered)
    } catch (e) {
      console.error('Contributions load error:', e)
      toast.error(e?.message || t('contrib.load_error'))
    } finally {
      setContribLoading(false)
    }
  }, [user?.id, t])

  useEffect(() => {
    loadWorks()
  }, [loadWorks])

  useEffect(() => {
    let alive = true
    loadOwnWorkIds()
      .then((ids) => {
        if (alive) setOwnWorkIds(ids)
      })
      .catch((e) => {
        if (alive) {
          setOwnWorkIds(EMPTY_WORK_IDS)
          toast.error(e?.message || t('works.load_error'))
        }
      })
    return () => { alive = false }
  }, [loadOwnWorkIds, t])

  useEffect(() => {
    if (!ownWorkIds) return
    loadContributions(ownWorkIds)
  }, [ownWorkIds, loadContributions])

  const activeTab = searchParams.get('tab') || 'my-works'

  useEffect(() => {
    if (activeTab === 'contributions' && contributions.length > 0) {
      const ids = contributions
        .filter((item) => {
          return (
            item.awaitingMyConsent === true ||
            item.consentState === 'PENDING' ||
            (item.state === 'PENDING_CONSENT' && item.consentState !== 'ACCEPTED' && item.consentState !== 'DECLINED')
          )
        })
        .map((item) => String(item.id || item.workId).toLowerCase())

      if (ids.length > 0) {
        markConsentIdsAsSeen(ids)
      }
    }
  }, [activeTab, contributions])

  const openDetail = useCallback(
    (work) => navigate(ROUTES.WORK_DETAIL(work.id)),
    [navigate]
  )

  const handleChanged = useCallback(() => {
    loadWorks()
    loadOwnWorkIds()
      .then(setOwnWorkIds)
      .catch((e) => toast.error(e?.message || t('works.load_error')))
  }, [loadWorks, loadOwnWorkIds, t])

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

      <Tabs value={searchParams.get('tab') || 'my-works'} onValueChange={(val) => applyFilterToUrl({ tab: val })}>
        <TabsList>
          <TabsTrigger value="my-works" className="group">
            {t('works.tab_mine')}
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground group-data-[state=active]:bg-primary-soft group-data-[state=active]:text-primary">
              {total}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contributions" className="group">
            {t('works.tab_contrib')}
            {pendingCount > 0 ? (
              <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground animate-pulse shadow-soft" title={t('contrib.pending_badge', { count: pendingCount })}>
                {pendingCount}
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground group-data-[state=active]:bg-primary-soft group-data-[state=active]:text-primary">
                {contributions.length}
              </span>
            )}
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
            onRefresh={loadWorks}
            loading={loading}
          />
          <WorksTable
            works={works}
            loading={loading}
            hasFilters={!!(search || stateFilter)}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(v) => {
              setPageSize(v)
              setPage(1)
            }}
            onView={openDetail}
            onChanged={handleChanged}
          />
        </TabsContent>

        <TabsContent value="contributions">
          <ContributionsTable
            contributions={contributions}
            loading={contribLoading}
            onView={openDetail}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
