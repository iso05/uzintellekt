import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Paperclip, AlertCircle, FileText, Users, CheckCircle2, XCircle } from 'lucide-react'
import { Button, PageHeader, Card, CardContent, Badge, ListSkeleton, toast } from '@shared/ui'
import { formatDate, formatDateTime } from '@shared/lib/format'
import { resolveLocalizedName } from '@shared/lib/localized-name'
import { ROUTES } from '@/config/routes'
import {
  getWork,
  getWorkStatus,
  isEditableState,
  useDictionaries,
  resolveWorkTypeName,
  getHolderRoleIds,
  StatusBadge,
} from '@/entities/work'
import { WorkFilesSection } from '@/widgets/work-files'

function SectionCard({ icon: Icon, title, count, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        {Icon && <Icon className="h-[18px] w-[18px] text-muted-foreground" />}
        <h3 className="m-0 text-[15px] font-semibold text-foreground">{title}</h3>
        {count != null && (
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <CardContent className="p-5 pt-4">{children}</CardContent>
    </Card>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <span className="w-48 shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 text-[14px] text-foreground">{children}</span>
    </div>
  )
}

function holderName(rh) {
  return [rh.lastName, rh.firstName].filter(Boolean).join(' ') || '—'
}

function holderRoles(authorRoles, rh) {
  return getHolderRoleIds(rh).map((id) => {
    const r = authorRoles.find((x) => String(x.id) === String(id))
    return { id, name: r ? resolveLocalizedName(r.localizedName, r.name) : `#${id}` }
  })
}

export default function WorkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { workTypes, authorRoles } = useDictionaries()

  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    getWork(id)
      .then((data) => alive && setWork(data))
      .catch((e) => {
        if (!alive) return
        setError(true)
        toast.error(e?.message || t('common.detail_error'))
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const status = work ? getWorkStatus(work) : null
  const editable = status ? isEditableState(status) : false
  const holders = work?.rightHolders || []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={work?.name || t('detail.title')}
        subtitle={work ? resolveWorkTypeName(workTypes, work.workTypeId) : t('detail.subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.WORKS)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back')}
            </Button>
            {editable && (
              <Button onClick={() => navigate(ROUTES.WORK_EDIT(id))} className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('detail.edit')}
              </Button>
            )}
          </div>
        }
      />

      {loading ? (
        <Card className="p-6">
          <ListSkeleton rows={6} className="space-y-4 p-0" />
        </Card>
      ) : error || !work ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-[13.5px] text-destructive">{t('common.detail_error')}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.WORKS)}>
            {t('detail.back')}
          </Button>
        </div>
      ) : (
        <>
          {/* Details */}
          <SectionCard icon={FileText} title={t('detail.title')}>
            <div className="flex flex-col divide-y divide-border">
              <Row label={t('detail.status')}>
                <StatusBadge status={status} />
              </Row>
              <Row label={t('detail.type')}>{resolveWorkTypeName(workTypes, work.workTypeId)}</Row>
              <Row label={t('detail.description')}>
                {work.description || <span className="text-muted-foreground">—</span>}
              </Row>
              <Row label={t('detail.created')}>{formatDateTime(work.createdAt)}</Row>
              <Row label={t('detail.updated')}>{work.updatedAt ? formatDateTime(work.updatedAt) : '—'}</Row>
            </div>

            {status === 'REGISTERED' && work.registrationDate && (
              <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-[13.5px] font-semibold text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t('detail.registered_on', { date: formatDate(work.registrationDate) })}
              </div>
            )}
            {status === 'REJECTED' && work.rejectionReason && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] font-semibold text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{t('detail.reject_reason', { reason: work.rejectionReason })}</span>
              </div>
            )}
          </SectionCard>

          {/* Right holders */}
          <SectionCard icon={Users} title={t('detail.holders')} count={holders.length}>
            {holders.length ? (
              <ul className="flex flex-col divide-y divide-border">
                {holders.map((rh, idx) => (
                  <li
                    key={rh.id ?? idx}
                    className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-[14px] font-medium text-foreground">{holderName(rh)}</span>
                        {(rh.passportNo || rh.passportSeria) && (
                          <span className="text-[12px] font-normal text-muted-foreground">
                            {rh.passportNo || rh.passportSeria}
                          </span>
                        )}
                      </div>
                      {holderRoles(authorRoles, rh).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {holderRoles(authorRoles, rh).map((role) => (
                            <Badge key={role.id} variant="muted" className="font-medium">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 pt-0.5 text-[13px] font-semibold text-primary">
                      {rh.sharePercentage ?? rh.share ?? 0}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">{t('detail.not_specified')}</p>
            )}
          </SectionCard>

          {/* Files */}
          <SectionCard icon={Paperclip} title={t('work_files.title')}>
            <WorkFilesSection workId={id} readOnly />
          </SectionCard>
        </>
      )}
    </div>
  )
}
