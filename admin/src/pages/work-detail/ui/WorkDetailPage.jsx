import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, X, Download, FileText, Users, AlertTriangle, Pencil } from 'lucide-react'
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  EmptyState,
  toast,
} from '@shared/ui'
import { formatDate, formatDateTime, formatBytes } from '@shared/lib/format'
import {
  WorkStatusBadge,
  WorkFileStatusBadge,
  isDecidable,
  isEditable,
  getAdminFileDownloadUrl,
} from '@/entities/work'
import { useWorkTypeMap, useAuthorRoleMap } from '@/entities/dictionary'
import { DecideWorkDialog } from '@/features/decide-work'
import { WorkFormDialog } from '@/features/work-form'
import { SubmitWorkButton } from '@/features/work-submit'
import { ROUTES } from '@/config/routes'
import { useWorkDetail } from '../model/use-work-detail'

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <span className="w-48 shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 text-[14px] text-foreground">{children}</span>
    </div>
  )
}

function SectionCard({ icon: Icon, title, count, children }) {
  return (
    <Card>
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

export default function WorkDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, error, work, files, reload } = useWorkDetail(id)
  const typeMap = useWorkTypeMap()
  const roleMap = useAuthorRoleMap()
  const [decide, setDecide] = useState({ open: false, decision: null })
  const [editOpen, setEditOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink t={t} />
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title={t(error === 'not_found' ? 'work.not_found' : 'common.error')}
            description={error && error !== 'not_found' ? error : undefined}
          />
        </Card>
      </div>
    )
  }

  const decidable = isDecidable(work.state)
  const editable = isEditable(work.state)

  async function download(file) {
    try {
      const { downloadUrl } = await getAdminFileDownloadUrl(work.id, file.fileId)
      if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener')
      else toast.error(t('common.error'))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    }
  }

  function openDecide(decision) {
    setDecide({ open: true, decision })
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink t={t} />

      <PageHeader
        title={work.name || '—'}
        subtitle={typeMap[work.workTypeId] || `#${work.workTypeId}`}
        leading={null}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {editable && (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  {t('user.edit')}
                </Button>
                <SubmitWorkButton work={work} onDone={reload} />
              </>
            )}
            {decidable && (
              <>
                <Button variant="success" onClick={() => openDecide('APPROVE')}>
                  <Check className="h-4 w-4" />
                  {t('decide.approve')}
                </Button>
                <Button variant="destructive" onClick={() => openDecide('REJECT')}>
                  <X className="h-4 w-4" />
                  {t('decide.reject')}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Details */}
      <SectionCard icon={FileText} title={t('work.details')}>
        <div className="flex flex-col divide-y divide-border">
          <Row label={t('work.status')}>
            <WorkStatusBadge status={work.state} />
          </Row>
          <Row label={t('work.type')}>{typeMap[work.workTypeId] || `#${work.workTypeId}`}</Row>
          <Row label={t('work.description')}>
            {work.description || <span className="text-muted-foreground">{t('work.no_description')}</span>}
          </Row>
          <Row label={t('work.created')}>{formatDateTime(work.createdAt)}</Row>
          <Row label={t('work.updated')}>{work.updatedAt ? formatDateTime(work.updatedAt) : '—'}</Row>
          <Row label={t('work.registration_date')}>
            {work.registrationDate ? formatDate(work.registrationDate) : '—'}
          </Row>
          {work.state === 'REJECTED' && work.rejectionReason && (
            <Row label={t('work.rejection_reason')}>
              <span className="text-destructive">{work.rejectionReason}</span>
            </Row>
          )}
        </div>
      </SectionCard>

      {/* Right holders */}
      <SectionCard icon={Users} title={t('work.rightholders')} count={work.rightHolders?.length || 0}>
        {work.rightHolders?.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {work.rightHolders.map((rh) => (
              <li key={rh.id} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[14px] font-medium text-foreground">
                      {[rh.lastName, rh.firstName].filter(Boolean).join(' ') || '—'}
                    </span>
                    {rh.passportNo && (
                      <span className="text-[12px] font-normal text-muted-foreground">{rh.passportNo}</span>
                    )}
                  </div>
                  {(rh.authorRoleIds || []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {rh.authorRoleIds.map((rid) => (
                        <Badge key={rid} variant="muted" className="font-medium">
                          {roleMap[rid] || `#${rid}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <span className="shrink-0 pt-0.5 text-[13px] font-semibold text-primary">
                  {rh.sharePercentage != null ? `${rh.sharePercentage}%` : '—'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">{t('work.no_rightholders')}</p>
        )}
      </SectionCard>

      {/* Files */}
      <SectionCard icon={FileText} title={t('work.files')} count={files.length}>
        {files.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {files.map((f) => (
              <li key={f.fileId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-foreground">{f.filename}</span>
                  <span className="text-[12px] text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                </span>
                <WorkFileStatusBadge state={f.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download(f)}
                  disabled={f.status !== 'UPLOADED'}
                >
                  <Download className="h-4 w-4" />
                  {t('work.download')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">{t('work.no_files')}</p>
        )}
      </SectionCard>

      <DecideWorkDialog
        work={work}
        decision={decide.decision}
        open={decide.open}
        onOpenChange={(open) => setDecide((s) => ({ ...s, open }))}
        onDecided={() => {
          reload()
          navigate(ROUTES.MODERATION)
        }}
      />

      <WorkFormDialog
        mode="edit"
        work={work}
        open={editOpen}
        onOpenChange={setEditOpen}
        onDone={reload}
      />
    </div>
  )
}

function BackLink({ t }) {
  return (
    <Link
      to={ROUTES.MODERATION}
      className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('work.back_to_queue')}
    </Link>
  )
}
