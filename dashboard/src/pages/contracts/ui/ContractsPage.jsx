import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button, toast, PageHeader } from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { getContractsGrid } from '@/entities/contract'
import { ContractsTable } from '@/widgets/contracts-table'
import { PdfPreviewModal } from '@/widgets/pdf-preview-modal'
import { useContractDownload } from '@/features/contract-download'

const PAGE_SIZE = 10

export default function ContractsPage() {
  const { t } = useTranslation()
  const [contracts, setContracts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  // Monotonic request id — a slow earlier response must not overwrite a newer one.
  const reqIdRef = useRef(0)

  const { busyId, previewUrl, openPreview, triggerDownload, closePreview } =
    useContractDownload()

  const load = useCallback(async (p = 0) => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    try {
      const data = await getContractsGrid({ page: p, size: PAGE_SIZE })
      if (reqId !== reqIdRef.current) return // superseded by a newer request
      setContracts(data?.content ?? data?.items ?? [])
      setTotal(data?.totalElements ?? data?.totalItems ?? 0)
    } catch (e) {
      if (reqId !== reqIdRef.current) return
      toast.error(e.message || t('contracts.load_error'))
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page)
  }, [page, load])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('contracts.title')}
        subtitle={t('contracts.subtitle')}
        actions={
          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => load(page)}
            title={t('common.refresh')}
            aria-label={t('common.refresh')}
            className="h-10 w-10"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        }
      />

      <ContractsTable
        contracts={contracts}
        loading={loading}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        busyId={busyId}
        onView={openPreview}
        onDownload={triggerDownload}
      />

      <PdfPreviewModal
        url={previewUrl}
        open={!!previewUrl}
        onOpenChange={(open) => !open && closePreview()}
      />
    </div>
  )
}
