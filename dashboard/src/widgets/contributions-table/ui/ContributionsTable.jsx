import { useState, useEffect } from 'react'
import { FileText, Users, Check, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  EmptyState,
  Pagination,
  Button,
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
  toast,
} from '@shared/ui'
import { resolveLocalizedName } from '@shared/lib/localized-name'
import {
  StatusBadge,
  getWorkStatus,
  acceptConsent,
  rejectConsent,
  getConsentRejectReasons,
} from '@/entities/work'

const PAGE_SIZE = 10

export default function ContributionsTable({ contributions = [], loading, onView, onRefresh }) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  // Consent states
  const [actingWorkId, setActingWorkId] = useState(null)
  const [rejectingWork, setRejectingWork] = useState(null)
  const [reasons, setReasons] = useState([])
  const [selectedReasonId, setSelectedReasonId] = useState('')
  const [submittingReject, setSubmittingReject] = useState(false)

  useEffect(() => {
    getConsentRejectReasons()
      .then((data) => setReasons(Array.isArray(data) ? data : []))
      .catch(() => setReasons([]))
  }, [])

  const handleAccept = async (e, work) => {
    e.stopPropagation()
    setActingWorkId(work.id)
    try {
      await acceptConsent(work.id)
      toast.success(t('consent.accept_success', { defaultValue: 'Rozilik muvaffaqiyatli berildi' }))
      onRefresh?.()
    } catch (err) {
      toast.error(err?.message || t('consent.accept_error', { defaultValue: 'Xatolik yuz berdi' }))
    } finally {
      setActingWorkId(null)
    }
  }

  const handleOpenReject = (e, work) => {
    e.stopPropagation()
    setRejectingWork(work)
    setSelectedReasonId('')
  }

  const handleConfirmReject = async () => {
    if (!selectedReasonId || !rejectingWork) return
    setSubmittingReject(true)
    try {
      await rejectConsent(rejectingWork.id, Number(selectedReasonId))
      toast.success(t('consent.reject_success', { defaultValue: 'Rozilik rad etildi' }))
      setRejectingWork(null)
      onRefresh?.()
    } catch (err) {
      toast.error(err?.message || t('consent.reject_error', { defaultValue: 'Xatolik yuz berdi' }))
    } finally {
      setSubmittingReject(false)
    }
  }

  const total = contributions.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const rows = contributions.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {loading ? (
        <ListSkeleton rows={3} />
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('contrib.empty_title')}
          description={t('contrib.empty_desc')}
        />
      ) : (
        <>
          <div className="overflow-x-auto w-full no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('contrib.col_name')}</TableHead>
                  <TableHead>{t('contrib.col_desc')}</TableHead>
                  <TableHead>{t('contrib.col_status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions', { defaultValue: 'Amallar' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((w) => {
                  const status = getWorkStatus(w)
                  const isDraft = status === 'DRAFT' || status === 'DRAFT_LIMIT_REACHED'
                  const isAwaiting = !isDraft && (w.awaitingMyConsent || w.consentState === 'PENDING')
                  const isActing = actingWorkId === w.id
                  return (
                    <TableRow
                      key={w.id}
                      className="group cursor-pointer hover:bg-muted/40"
                      onClick={() => onView(w)}
                    >
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span className="truncate font-semibold text-foreground" title={w.name}>
                            {w.name || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] text-muted-foreground">
                        <span className="line-clamp-1" title={w.description}>
                          {w.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getWorkStatus(w)} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {isAwaiting ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={isActing}
                              onClick={(e) => handleAccept(e, w)}
                              className="h-8 gap-1.5 px-2.5 text-[12px]"
                            >
                              {isActing ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              {t('consent.accept', { defaultValue: 'Roziman' })}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isActing}
                              onClick={(e) => handleOpenReject(e, w)}
                              className="h-8 gap-1.5 px-2.5 text-[12px]"
                            >
                              <X className="h-3.5 w-3.5" />
                              {t('consent.reject', { defaultValue: 'Rad etaman' })}
                            </Button>
                          </div>
                        ) : w.consentState === 'ACCEPTED' ? (
                          <span className="text-[12px] font-semibold text-success">
                            {t('consent.accepted_badge', { defaultValue: 'Rozilik berilgan' })}
                          </span>
                        ) : w.consentState === 'DECLINED' ? (
                          <span className="text-[12px] font-semibold text-destructive">
                            {t('consent.declined_badge', { defaultValue: 'Rad etilgan' })}
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            itemLabel={t('contrib.item_label')}
          />
        </>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={Boolean(rejectingWork)} onOpenChange={(open) => !open && setRejectingWork(null)}>
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
            <Button variant="outline" onClick={() => setRejectingWork(null)} disabled={submittingReject}>
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
    </section>
  )
}
