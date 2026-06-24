import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, toast, PageHeader } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { getContractsGrid } from '@/entities/contract'
import { ContractsTable } from '@/widgets/contracts-table'
import { PdfPreviewModal } from '@/widgets/pdf-preview-modal'
import { useContractDownload } from '@/features/contract-download'

const PAGE_SIZE = 10

export default function ContractsPage() {
  const [contracts, setContracts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const { busyId, previewUrl, openPreview, triggerDownload, closePreview } =
    useContractDownload()

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const data = await getContractsGrid({ page: p, size: PAGE_SIZE })
      setContracts(data?.content ?? data?.items ?? [])
      setTotal(data?.totalElements ?? data?.totalItems ?? 0)
    } catch (e) {
      toast.error(e.message || 'Shartnomalar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page)
  }, [page, load])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shartnomalarim"
        subtitle="Imzolangan a'zolik va litsenziya shartnomalaringiz"
        actions={
          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => load(page)}
            title="Yangilash"
            aria-label="Yangilash"
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
