import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Send, AlertCircle, Loader2, Paperclip } from 'lucide-react'
import { Button, toast, PageHeader, ListSkeleton } from '@shared/ui'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/features/auth'
import {
  getWork,
  createWork,
  updateWork,
  submitWork,
  isEditableState,
  useWorkForm,
  fromBackend,
  toPayload,
  validateWorkForm,
  getShareTotalError,
} from '@/entities/work'
import { isAllowedFile } from '@/entities/work-file'
import { BasicInfoSection } from '@/widgets/work-form-basic-info'
import { RightHoldersSection } from '@/widgets/work-form-right-holders'
import { WorkFilesSection, UploadDropzone } from '@/widgets/work-files'
import { AuthorSelfCheckbox } from '@/features/work-fill-author'
import { DeleteWorkButton } from '@/features/work-delete'
import { useAutosave } from '@/features/work-autosave'
import { draftKey, loadDraft, clearDraft } from '@shared/lib/draft-storage'
import { apiErrorMessage } from '@shared/lib/api-error'

function Banner({ tone = 'destructive', title, children }) {
  const styles =
    tone === 'destructive'
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : 'border-warning/30 bg-warning/5 text-warning'
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 ${styles}`}>
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-0.5 text-[13.5px]">
        {title && <strong className="font-bold">{title}</strong>}
        <span className="leading-relaxed">{children}</span>
      </div>
    </div>
  )
}

// Titled card matching the other form sections (BasicInfo / RightHolders).
function FilesCard({ t, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4 md:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Paperclip className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col">
          <h2 className="m-0 text-[15px] font-bold leading-tight text-foreground">
            {t('work_files.title')}
          </h2>
          <p className="m-0 text-[12px] text-muted-foreground">{t('work_files.section_sub')}</p>
        </div>
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  )
}

export default function WorkFormPage() {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()

  // A new work has no id until created (by autosave once valid, or by a file drop).
  // `createdId` then backs the page so files/autosave target it — no bounce to the list.
  const [createdId, setCreatedId] = useState(null)
  const [pendingFiles, setPendingFiles] = useState(null)
  const workId = routeId || createdId
  const isRouteEdit = Boolean(routeId)
  const isExisting = Boolean(workId)

  const {
    form,
    setForm,
    fieldErrors,
    setFieldErrors,
    shareTotalError,
    setShareTotalError,
    shareTotal,
    setField,
    setHolder,
    addHolder,
    removeHolder,
    handleFieldBlur,
    handleHolderBlur,
    getRemainingShareFor,
  } = useWorkForm()

  const [workState, setWorkState] = useState('DRAFT')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(isRouteEdit)
  const [ready, setReady] = useState(false)
  const [hasUploaded, setHasUploaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const draftLimitedRef = useRef(false)
  // Synchronous mirror of the effective work id + a single-flight create latch,
  // so autosave/file-drop/submit can never create the same draft twice across
  // the create-then-setState async gap.
  const workIdRef = useRef(workId)
  const createFlightRef = useRef(null)
  useEffect(() => {
    workIdRef.current = workId
  }, [workId])

  const isReadOnly = isRouteEdit && !isEditableState(workState)
  const storageKey = useMemo(() => draftKey(routeId), [routeId])

  const formValid = useMemo(() => {
    const errs = validateWorkForm(form)
    const totalErr = getShareTotalError(form.rightHolders)
    return Object.keys(errs).length === 0 && !totalErr
  }, [form])

  // Load: server data for an existing work; restore a local draft for a new one.
  useEffect(() => {
    let alive = true
    if (isRouteEdit) {
      setLoading(true)
      getWork(routeId)
        .then((data) => {
          if (!alive) return
          setWorkState(data?.state || data?.status || 'DRAFT')
          setRejectionReason(data?.rejectionReason || '')
          setForm(fromBackend(data))
        })
        .catch((e) => alive && toast.error(e?.message || t('form.load_error')))
        .finally(() => {
          if (!alive) return
          setLoading(false)
          setReady(true)
        })
    } else {
      const saved = loadDraft(storageKey)
      if (saved?.data) {
        setForm(saved.data)
        toast.success(t('form.draft_restored'))
      }
      setReady(true)
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId])

  // Single-flight create: autosave, file-drop, and submit all funnel through
  // this, so a brand-new work is created on the backend exactly once.
  const ensureWorkId = useCallback(
    async (data) => {
      if (workIdRef.current) return workIdRef.current
      if (!createFlightRef.current) {
        createFlightRef.current = createWork(toPayload(data))
          .then((saved) => {
            const newId = saved?.id ?? saved?.workId
            if (newId) {
              workIdRef.current = newId
              setCreatedId(newId)
              setWorkState(saved?.state || 'DRAFT')
            }
            clearDraft(storageKey)
            return newId
          })
          .catch((e) => {
            createFlightRef.current = null // allow a later retry
            throw e
          })
      }
      return createFlightRef.current
    },
    [storageKey]
  )

  // Persist to backend — update (existing) or create-once (new). Backend rejects
  // a 4th draft (1021); surface that once and keep the local copy.
  const persist = useCallback(
    async (data) => {
      if (workIdRef.current) {
        await updateWork(workIdRef.current, toPayload(data))
        clearDraft(storageKey)
        return
      }
      try {
        await ensureWorkId(data)
      } catch (e) {
        if (e?.apiError?.errorCode === 1021 && !draftLimitedRef.current) {
          draftLimitedRef.current = true
          toast.error(apiErrorMessage(e, t))
        }
        throw e
      }
    },
    [ensureWorkId, storageKey, t]
  )

  // Silent auto-save: local backup on every change + backend sync when valid.
  useAutosave({
    data: form,
    storageKey,
    canPersist: formValid,
    persist,
    delay: 2000,
    enabled: ready && !isReadOnly,
  })

  const goBack = () => navigate(ROUTES.WORKS)

  // Dropping a file before the draft exists: validate + create, then attach in place.
  const handlePreCreateDrop = async (files) => {
    const arr = Array.from(files || [])
    arr
      .filter((f) => !isAllowedFile(f))
      .forEach((f) => toast.error(t('work_files.reject_type', { name: f.name })))
    const allowed = arr.filter(isAllowedFile)
    if (!allowed.length) return
    if (!formValid) {
      setFieldErrors(validateWorkForm(form))
      setShareTotalError(getShareTotalError(form.rightHolders) || '')
      toast.error(t('work_files.save_first'))
      return
    }
    try {
      const newId = await ensureWorkId(form)
      if (!newId) return
      setPendingFiles(allowed)
    } catch (e) {
      toast.error(apiErrorMessage(e, t, 'common.save_error'))
    }
  }

  const canSubmit =
    isExisting &&
    (workState === 'DRAFT' || workState === 'REJECTED') &&
    formValid &&
    hasUploaded &&
    !submitting

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await persist(form) // flush latest edits (creates once if needed)
      await submitWork(workIdRef.current)
      clearDraft(storageKey)
      toast.success(t('form.submitted'))
      setTimeout(goBack, 800)
    } catch (e) {
      toast.error(apiErrorMessage(e, t, 'work_actions.submit_err'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isRouteEdit && loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t('form.loading')} subtitle={t('form.loading_sub')} />
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <ListSkeleton rows={8} className="space-y-4 p-0" />
        </div>
      </div>
    )
  }

  if (isReadOnly) {
    const stateLabel = t(`work_status.${workState}`, {
      defaultValue: workState || t('work_status.unknown'),
    })
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t('form.readonly_title')}
          subtitle={t('form.readonly_sub')}
          actions={
            <Button variant="outline" type="button" onClick={goBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back')}
            </Button>
          }
        />
        <Banner tone="destructive" title={t('form.readonly_banner_title')}>
          {t('form.readonly_banner', { state: stateLabel })}
        </Banner>
        <FilesCard t={t}>
          <WorkFilesSection workId={workId} readOnly />
        </FilesCard>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title={isExisting ? t('form.title_edit') : t('form.title_new')}
        subtitle={t('form.subtitle')}
        actions={
          <Button variant="outline" type="button" onClick={goBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('detail.back')}
          </Button>
        }
      />

      {workState === 'REJECTED' && rejectionReason && (
        <Banner tone="destructive" title={t('form.reject_title')}>
          {rejectionReason}
        </Banner>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
        <BasicInfoSection
          form={form}
          fieldErrors={fieldErrors}
          onFieldChange={setField}
          onFieldBlur={handleFieldBlur}
          disabled={submitting}
        />

        <RightHoldersSection
          rightHolders={form.rightHolders}
          fieldErrors={fieldErrors}
          shareTotal={shareTotal}
          shareTotalError={shareTotalError}
          onHolderChange={setHolder}
          onHolderBlur={handleHolderBlur}
          onAddHolder={addHolder}
          onRemoveHolder={removeHolder}
          getRemainingShareFor={getRemainingShareFor}
          disabled={submitting}
          headerExtra={
            <AuthorSelfCheckbox
              user={user}
              holders={form.rightHolders}
              disabled={submitting}
              onApply={(data) => {
                Object.entries(data).forEach(([k, v]) => setHolder(0, k, v))
                handleHolderBlur(0, 'passportNo', data.passportNo)
              }}
              onClear={(data) => {
                Object.entries(data).forEach(([k, v]) => setHolder(0, k, v))
                handleHolderBlur(0, 'passportNo', '')
              }}
            />
          }
        />

        <FilesCard t={t}>
          {isExisting ? (
            <WorkFilesSection
              workId={workId}
              readOnly={false}
              initialFiles={pendingFiles}
              onUploadedChange={setHasUploaded}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <UploadDropzone onFiles={handlePreCreateDrop} disabled={submitting} />
              <p className="text-[12px] text-muted-foreground">{t('work_files.attach_on_create')}</p>
            </div>
          )}
        </FilesCard>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-soft-md backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center gap-3">
            {isExisting && (
              <DeleteWorkButton
                workId={workId}
                onDone={goBack}
                variant="ghost"
                className="text-destructive hover:text-destructive"
              />
            )}
          </div>

          <Button
            type="button"
            variant="success"
            onClick={handleSubmit}
            disabled={!canSubmit}
            title={!hasUploaded ? t('form.submit_need_file') : undefined}
            className="gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('form.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
