import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, X, Download, FileText, Users, AlertTriangle, Pencil, Paperclip } from 'lucide-react'
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
import { openFilePreview } from '@shared/lib/file-preview'
import {
  WorkStatusBadge,
  WorkFileStatusBadge,
  isDecidable,
  isEditable,
  getAdminFileDownloadUrl,
  getRightHolderDocuments,
  getAdminRightHolderDocumentDownloadUrl,
} from '@/entities/work'
import { useWorkTypeMap } from '@/entities/dictionary'
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

function DescriptionCell({ text }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  if (!text) return <span className="text-muted-foreground">—</span>

  const isLong = text.length > 200

  if (!isLong) {
    return <div className="whitespace-pre-wrap break-words leading-relaxed">{text}</div>
  }

  const truncated = text.slice(0, 200)

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {expanded ? text : `${truncated}... `}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="ml-1.5 font-semibold text-primary hover:underline cursor-pointer"
      >
        {expanded
          ? t('common.show_less', { defaultValue: 'Qisqartirish' })
          : t('common.read_more', { defaultValue: 'Batafsil...' })}
      </button>
    </div>
  )
}

function AdminRightHolderRow({ workId, rh }) {
  const [docs, setDocs] = useState([])
  const rhType = (rh?.rightHolderType || rh?.ownerType || rh?.type || 'AUTHOR').toUpperCase()
  const isSupportingRequired = rhType === 'HEIR' || rhType === 'OTHER'
  const targetRhId = rh?.id || rh?.rightHolderId || rh?.rightHolder?.id

  useEffect(() => {
    if (!workId || !targetRhId) return
    getRightHolderDocuments(workId, targetRhId)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.items || res?.documents || res?.content || []
        setDocs(list)
      })
      .catch(() => setDocs([]))
  }, [workId, targetRhId])

  const allDocs = [
    ...(Array.isArray(rh?.documents) ? rh.documents : []),
    ...(Array.isArray(rh?.attachedDocuments) ? rh.attachedDocuments : []),
    ...(Array.isArray(rh?.contractFiles) ? rh.contractFiles : []),
    ...(Array.isArray(rh?.files) ? rh.files : []),
    ...(rh?.contractFile ? [rh.contractFile] : []),
    ...docs,
  ].filter((v, i, self) => i === self.findIndex((t) => {
    const k1 = typeof v === 'string' ? v : (v.id || v.documentId || v.fileId || v.filename || v.name)
    const k2 = typeof t === 'string' ? t : (t.id || t.documentId || t.fileId || t.filename || t.name)
    return k1 === k2
  }))

  const handleDownloadDoc = async (d) => {
    if (typeof d === 'string') return
    const downloadUrl = d.downloadUrl || d.url || d.fileUrl || d.presignedUrl
    if (downloadUrl) {
      openFilePreview(downloadUrl, d.filename || d.name || d.originalName)
      return
    }
    const documentId = d.documentId || d.id
    if (documentId && workId && targetRhId) {
      try {
        const res = await getAdminRightHolderDocumentDownloadUrl(workId, targetRhId, documentId)
        if (res?.downloadUrl) {
          openFilePreview(res.downloadUrl, d.filename || d.name || d.originalName)
          return
        }
      } catch {
        toast.error("Hujjatni yuklab olish havolasini olib bo'lmadi")
      }
    }
  }

  return (
    <li className="rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-sm transition-colors hover:border-primary/25">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-semibold text-foreground">
              {[rh.lastName, rh.firstName, rh.middleName].filter(Boolean).join(' ') || rh.legalName || '—'}
            </span>
            {rh.passportNo && (
              <span className="text-[12px] font-normal text-muted-foreground">{rh.passportNo}</span>
            )}
            {rh.pinfl && (
              <span className="text-[12px] font-normal text-muted-foreground">JSHSHIR: {rh.pinfl}</span>
            )}
            {rhType === 'HEIR' ? (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 font-semibold text-[11px]">
                Voris (Merosxo'r)
              </Badge>
            ) : rhType === 'OTHER' ? (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 font-semibold text-[11px]">
                Boshqa huquq egasi
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 font-semibold text-[11px]">
                Muallif
              </Badge>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-bold tabular-nums text-primary">
          {rh.sharePercentage != null ? `${rh.sharePercentage}%` : '—'}
        </span>
      </div>

      {allDocs.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/45 px-3 py-2.5 text-[12px]">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-medium text-foreground">Hujjatlar:</span>
          {allDocs.map((d, i) => {
            const fileName = d.filename || d.name || d.originalName || (typeof d === 'string' ? d : `Hujjat-${i + 1}`)
            return (
              <button
                key={d.id || d.documentId || i}
                type="button"
                onClick={() => handleDownloadDoc(d)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11.5px] shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary cursor-pointer"
                title="Yangi tabda ochish uchun bosing"
              >
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>{fileName}</span>
                {d.sizeBytes ? <span className="text-muted-foreground font-sans">({formatBytes(d.sizeBytes)})</span> : null}
              </button>
            )
          })}
        </div>
      ) : isSupportingRequired ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-1.5 text-[12px] text-warning font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Tasdiqlovchi hujjatlar biriktirilmagan</span>
        </div>
      ) : null}
    </li>
  )
}

export default function WorkDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, error, work, files, reload } = useWorkDetail(id)
  const typeMap = useWorkTypeMap()
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
          <Row label={t('work.name', { defaultValue: 'Asar nomi' })}>
            <span className="font-semibold text-foreground">{work.name || '—'}</span>
          </Row>
          <Row label={t('work.status')}>
            <WorkStatusBadge status={work.state} />
          </Row>
          <Row label={t('work.type')}>{typeMap[work.workTypeId] || `#${work.workTypeId}`}</Row>
          <Row label={t('work.description')}>
            <DescriptionCell text={work.description} />
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
          <ul className="space-y-3">
            {work.rightHolders.map((rh, idx) => (
              <AdminRightHolderRow key={rh.id || idx} workId={work.id || id} rh={rh} />
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
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('work.back_to_queue')}
    </button>
  )
}
