import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Paperclip, AlertCircle, FileText, Users, CheckCircle2, XCircle, Check, X, Loader2, FolderOpen, File, Download } from 'lucide-react'
import {
  Button,
  PageHeader,
  Card,
  CardContent,
  Badge,
  ListSkeleton,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@shared/ui'
import { formatDate, formatDateTime, formatBytes } from '@shared/lib/format'
import { openFilePreview } from '@shared/lib/file-preview'
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
  withdrawWork,
  acceptConsent,
  rejectConsent,
  getConsentRejectReasons,
  getConsentView,
  getConsentViewFileDownloadUrl,
  getConsentViewDocumentDownloadUrl,
} from '@/entities/work'
import { WorkFilesSection } from '@/widgets/work-files'
import { getRightHolderDocuments, getRightHolderDocumentDownloadUrl } from '@/entities/right-holder-document'
import { useAuth } from '@/features/auth'

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

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <span className="w-48 shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 text-[14px] text-foreground">{children}</span>
    </div>
  )
}

function holderName(rh) {
  return [rh.lastName, rh.firstName, rh.legalName].filter(Boolean).join(' ') || '—'
}

function holderRoles(authorRoles, rh) {
  return getHolderRoleIds(rh).map((id) => {
    const r = authorRoles.find((x) => String(x.id) === String(id))
    return { id, name: r ? resolveLocalizedName(r.localizedName, r.name) : `#${id}` }
  })
}

/**
 * Reads all right-holders, fetches their uploaded documents and shows them
 * grouped by holder in a read-only list with owner-only downloads.
 */
function HolderDocsSection({ workId, holders }) {
  const { t } = useTranslation()
  const [docs, setDocs] = useState(null) // null = loading, {} = loaded (keyed by holderId)
  const [loadErr, setLoadErr] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    if (!workId || !holders?.length) {
      setDocs({})
      return
    }
    setDocs(null)
    setLoadErr(false)
    Promise.all(
      holders.map(async (rh) => {
        const holderId = rh.id || rh.rightHolderId
        if (!holderId) return { holderId: null, files: [] }
        try {
          const list = await getRightHolderDocuments(workId, holderId)
          return { holderId, files: Array.isArray(list) ? list : [] }
        } catch {
          return { holderId, files: [] }
        }
      })
    )
      .then((results) => {
        const map = {}
        results.forEach(({ holderId, files }) => {
          map[holderId] = files
        })
        setDocs(map)
      })
      .catch(() => setLoadErr(true))
  }, [workId, holders])

  // Compute total file count across all holders
  const allFiles = docs
    ? Object.values(docs).flat()
    : []

  // Only show section if at least one holder has files (or still loading)
  const hasAnyFile = allFiles.length > 0
  if (docs !== null && !hasAnyFile && !loadErr) return null

  const download = async (rightHolderId, document) => {
    const documentId = document.documentId || document.id
    if (!documentId) return
    setDownloadingId(documentId)
    try {
      const { downloadUrl } = await getRightHolderDocumentDownloadUrl(workId, rightHolderId, documentId)
      if (downloadUrl) openFilePreview(downloadUrl, document.filename || document.name || document.originalName)
      else toast.error(t('holder_docs.download_error'))
    } catch (error) {
      toast.error(error?.message || t('holder_docs.download_error'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <SectionCard icon={FolderOpen} title={t('holder_docs.title')} count={hasAnyFile ? allFiles.length : undefined}>
      {loadErr ? (
        <p className="text-[13px] text-destructive">{t('holder_docs.load_error')}</p>
      ) : docs === null ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('common.detail_error', { defaultValue: 'Yuklanmoqda...' })}</span>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {holders.flatMap((rh) => {
            const holderId = rh.id || rh.rightHolderId
            const files = docs[holderId] || []
            return files.map((doc) => {
              const filename = doc.filename || doc.name || doc.documentId || '—'
              const sizeBytes = doc.sizeBytes ?? doc.size ?? null
              return (
                <li key={doc.documentId || doc.fileId || filename} className="flex items-center gap-3 px-3 py-2.5">
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13.5px] text-foreground">{filename}</span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {t('holder_docs.holder_label')}: {[rh.lastName, rh.firstName, rh.legalName].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>
                  {sizeBytes != null && (
                    <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                      {formatBytes(sizeBytes)}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => download(holderId, doc)}
                    disabled={downloadingId === (doc.documentId || doc.id)}
                    aria-label={t('holder_docs.download')}
                  >
                    {downloadingId === (doc.documentId || doc.id)
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Download className="h-4 w-4" />}
                  </Button>
                </li>
              )
            })
          })}
        </ul>
      )}
    </SectionCard>
  )
}

function ConsentFilesSection({ workId, consentView }) {
  const { t } = useTranslation()
  const [downloadingId, setDownloadingId] = useState(null)
  const workFiles = consentView?.files || consentView?.workFiles || consentView?.uploadedFiles || []
  const myDocuments = consentView?.myDocuments || []

  const download = async (item, kind) => {
    const itemId = kind === 'document'
      ? item.documentId || item.id
      : item.fileId || item.id
    if (!itemId) return
    setDownloadingId(`${kind}:${itemId}`)
    try {
      const response = kind === 'document'
        ? await getConsentViewDocumentDownloadUrl(workId, itemId)
        : await getConsentViewFileDownloadUrl(workId, itemId)
      if (response?.downloadUrl) openFilePreview(response.downloadUrl, item.filename || item.name || item.originalName)
      else toast.error(t('holder_docs.download_error'))
    } catch (error) {
      toast.error(error?.message || t('holder_docs.download_error'))
    } finally {
      setDownloadingId(null)
    }
  }

  const renderFiles = (items, kind) => {
    if (!items.length) return <p className="text-[13px] text-muted-foreground">—</p>
    return (
      <ul className="divide-y divide-border rounded-xl border border-border">
        {items.map((item, index) => {
          const itemId = kind === 'document' ? item.documentId || item.id : item.fileId || item.id
          const key = `${kind}:${itemId || index}`
          const filename = item.filename || item.name || item.originalName || '—'
          const isDownloading = downloadingId === key
          return (
            <li key={key} className="flex items-center gap-3 px-3 py-2.5">
              <File className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">{filename}</span>
              {item.sizeBytes != null && <span className="shrink-0 text-[11.5px] text-muted-foreground">{formatBytes(item.sizeBytes)}</span>}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!itemId || isDownloading}
                onClick={() => download(item, kind)}
                aria-label={t('holder_docs.download')}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="grid gap-6">
      <SectionCard icon={Paperclip} title={t('work_files.title')} count={workFiles.length}>
        {renderFiles(workFiles, 'file')}
      </SectionCard>
      <SectionCard icon={FolderOpen} title={t('holder_docs.title')} count={myDocuments.length}>
        {renderFiles(myDocuments, 'document')}
      </SectionCard>
    </div>
  )
}

export default function WorkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { workTypes, authorRoles } = useDictionaries()

  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [consentView, setConsentView] = useState(null)

  const loadData = () => {
    setLoading(true)
    setError(false)
    getWork(id)
      .then((data) => setWork(data))
      .catch((e) => {
        setError(true)
        toast.error(e?.message || t('common.detail_error'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const [actingConsent, setActingConsent] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reasons, setReasons] = useState([])
  const [selectedReasonId, setSelectedReasonId] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  useEffect(() => {
    getConsentRejectReasons()
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => setReasons([]))
  }, [])

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      await withdrawWork(id)
      toast.success(t('work.withdraw_success', { defaultValue: "Asar ko'rib chiqishdan qaytarib olindi va черновик holatiga o'tkazildi" }))
      loadData()
    } catch (err) {
      toast.error(err?.message || t('work.withdraw_error', { defaultValue: 'Xatolik yuz berdi' }))
    } finally {
      setWithdrawing(false)
    }
  }

  const handleAccept = async () => {
    setActingConsent(true)
    try {
      await acceptConsent(work.id || id)
      toast.success(t('consent.accept_success', { defaultValue: 'Rozilik muvaffaqiyatli berildi' }))
      loadData()
    } catch (err) {
      toast.error(err?.message || t('consent.accept_error', { defaultValue: 'Xatolik yuz berdi' }))
    } finally {
      setActingConsent(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!selectedReasonId || !work) return
    setSubmittingReject(true)
    try {
      await rejectConsent(work.id || id, Number(selectedReasonId))
      toast.success(t('consent.reject_success', { defaultValue: 'Rozilik rad etildi' }))
      setRejecting(false)
      loadData()
    } catch (err) {
      toast.error(err?.message || t('consent.reject_error', { defaultValue: 'Xatolik yuz berdi' }))
    } finally {
      setSubmittingReject(false)
    }
  }

  const { user } = useAuth()
  const status = work ? getWorkStatus(work) : null
  const editable = status ? isEditableState(status) : false
  const holders = work?.rightHolders || []
  const isDraft = status === 'DRAFT' || status === 'DRAFT_LIMIT_REACHED'
  const isCreator = !user?.id || !work?.createdBy || String(work.createdBy) === String(user.id)
  const isContributor = !isCreator || Boolean(work?.awaitingMyConsent || work?.consentState)
  const isOtherUserDraft = work && !isCreator && isDraft
  const isAwaitingConsent = !isDraft && (work?.awaitingMyConsent || work?.consentState === 'PENDING')
  const displayHolders = isContributor && consentView?.rightHolders?.length
    ? consentView.rightHolders
    : holders
  // Contributions grid omits some work fields. The dedicated consent view is
  // the authoritative source for a participant's readable work type.
  const visibleWorkType = consentView?.workTypeId ?? work?.workTypeId ?? work?.workType ?? work?.type

  useEffect(() => {
    if (!work || isDraft || !isContributor) {
      setConsentView(null)
      return undefined
    }
    let active = true
    getConsentView(work.id || id)
      .then((data) => {
        if (active) setConsentView(data)
      })
      .catch(() => {
        if (active) setConsentView(null)
      })
    return () => { active = false }
  }, [id, isContributor, isDraft, work])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={work?.name || t('detail.title')}
        subtitle={work ? resolveWorkTypeName(workTypes, visibleWorkType) : t('detail.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.WORKS)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back')}
            </Button>
            {isAwaitingConsent ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="success"
                  disabled={actingConsent}
                  onClick={handleAccept}
                  className="gap-2"
                >
                  {actingConsent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t('consent.accept', { defaultValue: 'Roziman' })}
                </Button>
                <Button
                  variant="destructive"
                  disabled={actingConsent}
                  onClick={() => {
                    setSelectedReasonId('')
                    setRejecting(true)
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t('consent.reject', { defaultValue: 'Rozi emasman' })}
                </Button>
              </div>
            ) : work?.consentState === 'ACCEPTED' ? (
              <Badge variant="success" className="px-3 py-1 text-[13px]">
                {t('consent.accepted_badge', { defaultValue: 'Rozilik berilgan' })}
              </Badge>
            ) : work?.consentState === 'DECLINED' ? (
              <Badge variant="destructive" className="px-3 py-1 text-[13px]">
                {t('consent.declined_badge', { defaultValue: 'Rad etilgan' })}
              </Badge>
            ) : (
              work?.state === 'PENDING_CONSENT' && (
                <Button
                  variant="warning"
                  disabled={withdrawing}
                  onClick={handleWithdraw}
                  className="gap-2"
                >
                  {t('detail.withdraw', { defaultValue: 'Qaytarib olish' })}
                </Button>
              )
            )}
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
      ) : error || !work || isOtherUserDraft ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-[13.5px] text-destructive">
            {isOtherUserDraft ? t('detail.draft_private_error', { defaultValue: 'Qoralama asar hali yuborilmagan' }) : t('common.detail_error')}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.WORKS)}>
            {t('detail.back')}
          </Button>
        </div>
      ) : (
        <>
          {/* Details */}
          <SectionCard icon={FileText} title={t('detail.title')}>
            <div className="flex flex-col divide-y divide-border">
              <Row label={t('detail.name', { defaultValue: "Asar nomi" })}>
                <span className="font-semibold text-foreground">{work.name || '—'}</span>
              </Row>
              <Row label={t('detail.status')}>
                <StatusBadge status={status} />
              </Row>
              <Row label={t('detail.type')}>
                {resolveWorkTypeName(workTypes, visibleWorkType)}
              </Row>
              <Row label={t('detail.description')}>
                <DescriptionCell text={work.description} />
              </Row>
              {work.createdAt ? (
                <Row label={t('detail.created')}>{formatDateTime(work.createdAt)}</Row>
              ) : null}
              {work.updatedAt ? (
                <Row label={t('detail.updated')}>{formatDateTime(work.updatedAt)}</Row>
              ) : null}
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
          <SectionCard icon={Users} title={t('detail.holders')} count={displayHolders.length || undefined}>
            {displayHolders.length ? (
              <ul className="flex flex-col divide-y divide-border">
                {displayHolders.map((rh, idx) => (
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
                      {(rh.contractFiles?.length > 0 || rh.documents?.length > 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">
                            {(rh.contractFiles || (rh.documents || []).map((d) => d.filename || d.name || d)).join(', ')}
                          </span>
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
              <p className="text-[13px] text-muted-foreground">
                {t('consent.holders_notice', { defaultValue: "Huquq egalari ma'lumotlari ariza beruvchi tomonidan to'ldirilgan. Rozilik tasdiqlangach to'liq aks etadi." })}
              </p>
            )}
          </SectionCard>

          {isContributor && consentView ? (
            <ConsentFilesSection workId={work.id || id} consentView={consentView} />
          ) : (
            <>
              <SectionCard icon={Paperclip} title={t('work_files.title')}>
                <WorkFilesSection workId={id} readOnly />
              </SectionCard>
              {holders.length > 0 && <HolderDocsSection workId={id} holders={holders} />}
            </>
          )}
        </>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={rejecting} onOpenChange={(open) => !open && setRejecting(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('consent.reject_dialog_title', { defaultValue: 'Rozilikni rad etish sababi' })}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <p className="text-[13px] text-muted-foreground">
              {t('consent.reject_dialog_desc', { defaultValue: 'Asarga rozilikni rad etish sababini tanlang:' })}
            </p>
            <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('consent.select_reason_ph', { defaultValue: 'Sababni tanlang...' })} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {resolveLocalizedName(r.localizedName, r.name || `Reason #${r.id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejecting(false)} disabled={submittingReject}>
              {t('common.cancel', { defaultValue: 'Bekor qilish' })}
            </Button>
            <Button
              variant="destructive"
              disabled={!selectedReasonId || submittingReject}
              onClick={handleConfirmReject}
              className="gap-2"
            >
              {submittingReject && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('consent.confirm_reject', { defaultValue: 'Rad etishni tasdiqlash' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
