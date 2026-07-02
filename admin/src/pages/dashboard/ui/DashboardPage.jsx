import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Users, ShieldCheck, HardDrive, BarChart3, PieChart, Trophy, TrendingUp } from 'lucide-react'
import { PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from '@shared/ui'
import { formatBytes, formatNumber } from '@shared/lib/format'
import { localizedName } from '@/entities/dictionary'
import { ROUTES } from '@/config/routes'
import { DEFAULT_PERIOD, granularityForRange } from '../model/periods'
import { useDashboardSummary, useWorksSeries } from '../model/use-dashboard'
import { toChartSeries, distributionData } from '../model/transform'
import { MetricCard, MiniStat, ChartCard, TopList, PeriodSelector, DeltaBadge } from './parts'
import { SeriesLineChart, DistributionBarChart, StatusPieChart, CHART } from './charts'

const STATUS_ORDER = ['DRAFT', 'UNDER_REVIEW', 'REJECTED', 'REGISTERED']
const STATUS_COLOR = {
  DRAFT: CHART.muted,
  UNDER_REVIEW: CHART.warning,
  REJECTED: CHART.destructive,
  REGISTERED: CHART.success,
}
const GRANULARITIES = ['DAY', 'WEEK', 'MONTH']

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [metric, setMetric] = useState('CREATED')
  // null = auto (derived from the range); a manual pick overrides it until the
  // range changes, when we fall back to auto again.
  const [granularityOverride, setGranularityOverride] = useState(null)

  const granularity = granularityOverride ?? granularityForRange(period.from, period.to)

  const summary = useDashboardSummary(period)
  const seriesState = useWorksSeries(period, granularity, metric)
  const d = summary.data || {}

  function changePeriod(next) {
    setPeriod(next)
    setGranularityOverride(null) // re-auto the bucket size for the new range
  }

  const statusLabels = useMemo(
    () => Object.fromEntries(STATUS_ORDER.map((s) => [s, t(`dashboard.work_status.${s}`)])),
    [t]
  )

  const typeMap = useMemo(() => {
    const map = {}
    for (const wt of d.workTypes || []) map[wt.id] = localizedName(wt, i18n.language)
    return map
  }, [d.workTypes, i18n.language])

  const seriesData = useMemo(() => toChartSeries(seriesState.series), [seriesState.series])

  const worksByStatus = useMemo(
    () =>
      distributionData(d.works?.byStatus, { labels: statusLabels, order: STATUS_ORDER }).map((r) => ({
        ...r,
        color: STATUS_COLOR[r.key],
      })),
    [d.works, statusLabels]
  )

  const worksByType = useMemo(() => {
    const rows = (d.works?.byType || [])
      .map((wt) => ({ key: wt.workTypeId, name: typeMap[wt.workTypeId] || `#${wt.workTypeId}`, value: wt.total }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
    return rows
  }, [d.works, typeMap])

  const mod = d.moderation
  const avgHours = mod?.period?.avgHoursToDecision

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('page.dashboard.title')}
        subtitle={t('page.dashboard.subtitle')}
        actions={<PeriodSelector value={period} onChange={changePeriod} />}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          tone="primary"
          label={t('dashboard.cards.works')}
          loading={summary.loading}
          value={formatNumber(d.works?.total || 0)}
          footer={
            <>
              <MiniStat color={STATUS_COLOR.UNDER_REVIEW} label={statusLabels.UNDER_REVIEW} value={d.works?.byStatus?.UNDER_REVIEW ?? 0} />
              <DeltaBadge pct={d.deltas?.worksCreated} label={t('dashboard.cards.vs_prev')} />
            </>
          }
        />
        <MetricCard
          icon={Users}
          tone="success"
          label={t('dashboard.cards.users')}
          loading={summary.loading}
          value={formatNumber(d.users?.total || 0)}
          footer={
            <>
              <MiniStat color={CHART.primary} label={t('dashboard.cards.registered_period')} value={d.users?.period?.registered ?? 0} />
              <DeltaBadge pct={d.deltas?.usersRegistered} label={t('dashboard.cards.vs_prev')} />
            </>
          }
        />
        <MetricCard
          icon={ShieldCheck}
          tone="warning"
          label={t('dashboard.cards.queue')}
          loading={summary.loading}
          value={formatNumber(mod?.queueDepth || 0)}
          footer={
            <>
              <MiniStat color={CHART.success} label={t('dashboard.metric.approved')} value={mod?.period?.approved ?? 0} />
              <MiniStat color={CHART.destructive} label={t('dashboard.metric.rejected')} value={mod?.period?.rejected ?? 0} />
              {avgHours != null && (
                <MiniStat
                  color={CHART.muted}
                  label={t('dashboard.cards.avg_hours')}
                  value={Number(avgHours).toFixed(1)}
                />
              )}
            </>
          }
        />
        <MetricCard
          icon={HardDrive}
          tone="primary"
          label={t('dashboard.cards.storage')}
          loading={summary.loading}
          value={formatBytes(d.storage?.totalBytes || 0)}
          footer={
            <>
              <MiniStat color={CHART.warning} label={t('dashboard.cards.near_cap')} value={d.storage?.usersNearCap ?? 0} />
              <MiniStat color={CHART.muted} label={t('dashboard.cards.per_user_cap')} value={formatBytes(d.storage?.perUserCapBytes || 0)} />
            </>
          }
        />
      </div>

      {/* Works over time */}
      <ChartCard
        title={t('dashboard.charts.works_over_time')}
        loading={seriesState.loading}
        isEmpty={!seriesData.length}
        emptyIcon={TrendingUp}
        emptyText={t('common.no_data')}
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={metric} onValueChange={setMetric}>
              <TabsList className="h-8 border-b-0">
                <TabsTrigger value="CREATED" className="text-xs">{t('dashboard.metric.created')}</TabsTrigger>
                <TabsTrigger value="REGISTERED" className="text-xs">{t('dashboard.metric.registered')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={granularity} onValueChange={setGranularityOverride}>
              <SelectTrigger className="h-8 w-auto min-w-[124px] gap-1.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {GRANULARITIES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {t(`dashboard.granularity.${g}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <SeriesLineChart data={seriesData} />
      </ChartCard>

      {/* Distributions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t('dashboard.charts.works_by_type')}
          loading={summary.loading}
          isEmpty={!worksByType.length}
          emptyIcon={BarChart3}
          emptyText={t('common.no_data')}
        >
          <DistributionBarChart data={worksByType} />
        </ChartCard>

        <ChartCard
          title={t('dashboard.charts.works_by_status')}
          loading={summary.loading}
          isEmpty={!worksByStatus.some((r) => r.value > 0)}
          emptyIcon={PieChart}
          emptyText={t('common.no_data')}
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="w-full max-w-[260px]">
              <StatusPieChart data={worksByStatus} />
            </div>
            <ul className="flex flex-col gap-1">
              {worksByStatus.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.MODERATION}?state=${r.key}`)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors hover:bg-muted"
                    title={t('dashboard.drill_status')}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-foreground">{r.name}</span>
                    <span className="ml-auto font-semibold text-muted-foreground">{r.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t('dashboard.charts.top_contributors')}
          loading={summary.loading}
          isEmpty={!d.topContributors?.length}
          emptyIcon={Trophy}
          emptyText={t('common.no_data')}
        >
          <TopList
            items={d.topContributors}
            valueFormatter={(it) => t('dashboard.cards.works_count', { count: it.count })}
            emptyText={t('common.no_data')}
            onItemClick={(it) => navigate(ROUTES.USER_DETAIL(it.userId))}
          />
        </ChartCard>

        <ChartCard
          title={t('dashboard.charts.top_storage')}
          loading={summary.loading}
          isEmpty={!d.topStorage?.length}
          emptyIcon={HardDrive}
          emptyText={t('common.no_data')}
        >
          <TopList
            items={d.topStorage}
            valueFormatter={(it) => formatBytes(it.bytes)}
            emptyText={t('common.no_data')}
            onItemClick={(it) => navigate(ROUTES.USER_DETAIL(it.userId))}
          />
        </ChartCard>
      </div>
    </div>
  )
}
