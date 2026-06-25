import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save, Send, AlertCircle, Loader2 } from 'lucide-react'
import { Button, toast, PageHeader } from '@/shared/ui'
import { ListSkeleton } from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'
import { useAuth } from '@/features/auth'
import {
  getWork,
  isEditableState,
  useWorkForm,
  fromBackend,
  WORK_STATUS_CONFIG,
} from '@/entities/work'
import { BasicInfoSection } from '@/widgets/work-form-basic-info'
import { RightHoldersSection } from '@/widgets/work-form-right-holders'
import { AuthorSelfCheckbox } from '@/features/work-fill-author'
import { useSaveWork } from '@/features/work-save'

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

export default function WorkFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()

  const isEdit = Boolean(id)

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
  const [loading, setLoading] = useState(false)

  const isReadOnly = isEdit && !isEditableState(workState)

  useEffect(() => {
    if (!isEdit) return
    let alive = true
    setLoading(true)
    getWork(id)
      .then((data) => {
        if (!alive) return
        setWorkState(data?.state || data?.status || 'DRAFT')
        setRejectionReason(data?.rejectionReason || '')
        setForm(fromBackend(data))
      })
      .catch((e) => toast.error(e?.message || t('form.load_error')))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id, isEdit, setForm])

  const { saving, save, saveAndSubmit } = useSaveWork({
    workId: id,
    isEdit,
    setFieldErrors,
    setShareTotalError,
  })

  const goBack = () => navigate(ROUTES.WORKS)

  const handleSave = async (e) => {
    e?.preventDefault?.()
    const saved = await save({ form })
    if (saved) setTimeout(goBack, 800)
  }

  const handleSaveAndSubmit = async () => {
    const ok = await saveAndSubmit({ form })
    if (ok) setTimeout(goBack, 800)
  }

  if (isEdit && loading) {
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
      defaultValue: WORK_STATUS_CONFIG[workState]?.label || workState,
    })
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t('form.readonly_title')}
          subtitle={t('form.readonly_sub')}
        />
        <Banner tone="destructive" title={t('form.readonly_banner_title')}>
          {t('form.readonly_banner', { state: stateLabel })}
        </Banner>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title={isEdit ? t('form.title_edit') : t('form.title_new')}
        subtitle={t('form.subtitle')}
      />

      {workState === 'REJECTED' && rejectionReason && (
        <Banner tone="destructive" title={t('form.reject_title')}>
          {rejectionReason}
        </Banner>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <BasicInfoSection
          form={form}
          fieldErrors={fieldErrors}
          onFieldChange={setField}
          onFieldBlur={handleFieldBlur}
          disabled={saving}
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
          disabled={saving}
          headerExtra={
            <AuthorSelfCheckbox
              user={user}
              holders={form.rightHolders}
              disabled={saving}
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

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-soft-md backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <Button variant="outline" type="button" onClick={goBack} disabled={saving} className="gap-2">
            {t('form.cancel')}
          </Button>

          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? t('form.save') : t('form.create')}
          </Button>

          {isEdit && workState === 'DRAFT' && (
            <Button
              variant="success"
              type="button"
              onClick={handleSaveAndSubmit}
              disabled={saving}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('form.submit')}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
