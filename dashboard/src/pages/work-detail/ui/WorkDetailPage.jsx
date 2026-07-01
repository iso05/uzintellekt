import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, Paperclip, AlertCircle } from 'lucide-react'
import { Button, PageHeader, ListSkeleton, toast } from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'
import { getWork, WorkDetailContent, getWorkStatus, isEditableState } from '@/entities/work'
import { WorkFilesSection } from '@/widgets/work-files'

export default function WorkDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={work?.name || t('detail.title')}
        subtitle={t('detail.subtitle')}
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
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          <ListSkeleton rows={6} className="space-y-4 p-0" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-[13.5px] text-destructive">{t('common.detail_error')}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.WORKS)}>
            {t('detail.back')}
          </Button>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-6">
            <WorkDetailContent work={work} />
          </section>

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
            <div className="p-5 md:p-6">
              <WorkFilesSection workId={id} readOnly />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
