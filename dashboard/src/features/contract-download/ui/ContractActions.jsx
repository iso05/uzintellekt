import { Eye, Download, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui'

export default function ContractActions({ contract, busy, onView, onDownload }) {
  const isBusy = busy === contract.id
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => onView(contract)}
      >
        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
        Ko'rish
      </Button>
      <Button
        variant="success"
        size="sm"
        disabled={isBusy}
        onClick={() => onDownload(contract)}
      >
        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Yuklab olish
      </Button>
    </div>
  )
}
