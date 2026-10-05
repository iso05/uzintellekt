import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Send, AlertCircle, Loader2, Paperclip } from 'lucide-react'
import {
  Button,
  toast,
  PageHeader,
  ListSkeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@shared/ui'
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
  toPayloadForDraft,
  validateWorkForm,
  getShareTotalError,
  getHeirOtherDocErrors,
  isHolderValidForBackend,
  EMPTY_HOLDER,
} from '@/entities/work'
import { isAllowedFile } from '@/entities/work-file'
import { uploadOne } from '@/features/work-file-upload'
import { uploadRightHolderDocument } from '@/entities/right-holder-document'
import { BasicInfoSection } from '@/widgets/work-form-basic-info'
import { RightHoldersSection } from '@/widgets/work-form-right-holders'
import { WorkFilesSection, UploadDropzone } from '@/widgets/work-files'
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
    const docErrs = getHeirOtherDocErrors(form.rightHolders)
    return Object.keys(errs).length === 0 && !totalErr && Object.keys(docErrs).length === 0
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
        const draftData = { ...saved.data }
        const isUserLegal = user?.subjectType === 'LEGAL'
        if (draftData.rightHolders && draftData.rightHolders[0]) {
          const rh0 = draftData.rightHolders[0]
          rh0.subjectType = isUserLegal ? 'LEGAL' : 'INDIVIDUAL'
          rh0.type = rh0.subjectType
          rh0.pinfl = isUserLegal ? '' : (user?.pinfl || '')
          rh0.passportNo = isUserLegal ? '' : (user?.pinfl || '')
          rh0.inn = isUserLegal ? (user?.inn || '') : ''
          rh0.firstName = isUserLegal ? '' : (user?.firstName || '')
          rh0.lastName = isUserLegal ? '' : (user?.lastName || '')
          rh0.legalName = isUserLegal ? (user?.legalName || '') : ''
        }
        setForm(draftData)
        toast.success(t('form.draft_restored'))
      } else {
        const isUserLegal = user?.subjectType === 'LEGAL'
        setForm({
          name: '',
          description: '',
          workTypeId: '',
          rightHolders: [
            {
              ...EMPTY_HOLDER,
              subjectType: isUserLegal ? 'LEGAL' : 'INDIVIDUAL',
              type: isUserLegal ? 'LEGAL' : 'INDIVIDUAL',
              rightHolderType: 'AUTHOR',
              pinfl: isUserLegal ? '' : (user?.pinfl || ''),
              passportNo: isUserLegal ? '' : (user?.pinfl || ''),
              inn: isUserLegal ? (user?.inn || '') : '',
              firstName: isUserLegal ? '' : (user?.firstName || ''),
              lastName: isUserLegal ? '' : (user?.lastName || ''),
              legalName: isUserLegal ? (user?.legalName || '') : '',
            },
          ],
        })
      }
      setReady(true)
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, user])

  const lastSavedRef = useRef(null)

  // Single-flight create: autosave, file-drop, and submit all funnel through
  // this, so a brand-new work is created on the backend exactly once.
  // Uses toPayloadForDraft to auto-balance the primary holder's share so that
  // work creation never fails due to incomplete share distribution — enabling
  // HEIR/OTHER document uploads before shares are finalized.
  const ensureWorkId = useCallback(
    async (data) => {
      if (workIdRef.current) return workIdRef.current
      if (!createFlightRef.current) {
        createFlightRef.current = createWork(toPayloadForDraft(data))
          .then((saved) => {
            const newId = saved?.id ?? saved?.workId
            if (newId) {
              workIdRef.current = newId
              lastSavedRef.current = saved
              setCreatedId(newId)
              setWorkState(saved?.state || 'DRAFT')

              // Merge backend-assigned rightHolder IDs into UI form state
              if (saved?.rightHolders && saved.rightHolders.length > 0) {
                const backendForm = fromBackend(saved)
                setForm((prev) => ({
                  ...prev,
                  rightHolders: prev.rightHolders.map((rh, idx) => {
                    const savedRh = backendForm.rightHolders?.[idx]
                    const rId = savedRh?.id || savedRh?.rightHolderId || saved?.rightHolders?.[idx]?.id || saved?.rightHolders?.[idx]?.rightHolderId
                    return rId ? { ...rh, id: rId } : rh
                  }),
                }))
              }
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

  const hasWorkFileAttached = hasUploaded || Boolean(pendingFiles && pendingFiles.length > 0)

  const canSubmit =
    (!isExisting || workState === 'DRAFT' || workState === 'REJECTED') &&
    formValid &&
    hasWorkFileAttached &&
    !submitting

  const handleSubmit = async () => {
    if (submitting) return

    // 1. Check form field validation errors
    const errs = {
      ...validateWorkForm(form),
      ...getHeirOtherDocErrors(form.rightHolders),
    }
    const totalErr = getShareTotalError(form.rightHolders)
    const docErrs = getHeirOtherDocErrors(form.rightHolders)

    if (Object.keys(errs).length > 0 || totalErr) {
      setFieldErrors(errs)
      setShareTotalError(totalErr || '')

      if (totalErr) {
        toast.error(t('validation.share_total_simple', { defaultValue: "Ulushlar yig'indisi 100% bo'lishi kerak" }))
      } else if (Object.keys(docErrs).length > 0) {
        toast.error(t('validation.heir_doc_required'))
      } else {
        toast.error(t('form.fill_required_fields', { defaultValue: "Barcha majburiy maydonlarni to'ldiring" }))
      }
      return
    }

    // 2. Check work file attached
    if (!hasWorkFileAttached) {
      toast.error(t('form.submit_need_file', { defaultValue: "Asarni yuborish uchun kamida 1 ta fayl yuklanishi shart" }))
      return
    }

    setSubmitting(true)
    try {
      let targetWorkId = workIdRef.current
      let createdHolderIds = []
      let savedWork = null

      // 1. Create or update work draft on backend
      if (!targetWorkId) {
        console.log('🚀 Creating work on backend:', toPayload(form))
        savedWork = await createWork(toPayload(form))
        targetWorkId = savedWork?.id ?? savedWork?.workId
        workIdRef.current = targetWorkId
        setCreatedId(targetWorkId)
      } else {
        console.log('🚀 Updating work on backend:', toPayload(form))
        savedWork = await updateWork(targetWorkId, toPayload(form))
      }
      createdHolderIds = savedWork?.rightHolders || []

      if (!targetWorkId) {
        throw new Error("Asar yaratishda xatolik yuz berdi")
      }

      // 2. WorkFilesSection owns the main-file upload queue. Re-uploading its
      // initial files here created duplicate attachments on submit.

      // 3. Upload right holder documents (if any holders have pending docs)
      const activeHolders = form.rightHolders.filter(isHolderValidForBackend)
      const freshRightHolders = savedWork?.rightHolders || []

      for (let i = 0; i < activeHolders.length; i++) {
        const holder = activeHolders[i]
        const pendingObjs = holder.pendingFileObjs || []
        const freshHolderObj = freshRightHolders[i]
        const holderId = freshHolderObj?.id || freshHolderObj?.rightHolderId || freshHolderObj?.rightHolder?.id || holder.id

        if (pendingObjs.length > 0 && holderId) {
          console.log(`📄 Uploading ${pendingObjs.length} docs for holder ${i} (${holderId})...`)
          for (const item of pendingObjs) {
            await uploadRightHolderDocument({ workId: targetWorkId, rightHolderId: holderId, file: item.file })
          }
        }
      }

      // 4. Submit work for review
      console.log(`✅ Submitting work ${targetWorkId} for review...`)
      await submitWork(targetWorkId)

      clearDraft(storageKey)
      toast.success(t('form.submitted', { defaultValue: "Asar ko'rib chiqishga yuborildi!" }))
      setTimeout(goBack, 800)
    } catch (e) {
      console.error('❌ handleSubmit Xatosi:', e)
      toast.error(apiErrorMessage(e, t, 'work_actions.submit_err'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !ready) {
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

      {user && user.isMember === false && (
        <Banner tone="warning" title={t('form.no_membership_title', { defaultValue: "A'zolik shartnomasi talab etiladi" })}>
          <div className="flex flex-col gap-2">
            <span>{t('form.no_membership_msg', { defaultValue: "Asarni yuborish uchun avval a'zolik shartnomasini imzolashingiz kerak." })}</span>
            <div>
              <Button size="sm" variant="outline" type="button" onClick={() => navigate(ROUTES.CONTRACTS)}>
                {t('form.go_to_contracts', { defaultValue: "Shartnomaga o'tish" })}
              </Button>
            </div>
          </div>
        </Banner>
      )}

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
          workId={workId}
          ensureWorkId={() => ensureWorkId(form)}
        />

        <FilesCard t={t}>
          <WorkFilesSection
            workId={workId}
            ensureWorkId={() => ensureWorkId(form)}
            readOnly={false}
            initialFiles={pendingFiles}
            onUploadedChange={setHasUploaded}
            disabled={!formValid}
          />
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
            disabled={submitting}
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
