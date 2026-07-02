import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@shared/ui'

export default function PdfPreviewModal({ url, title = "Shartnomani ko'rish", open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">PDF hujjat ko&apos;rinishi</DialogDescription>

        <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-5 py-3.5 pr-14">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileText className="h-[18px] w-[18px]" />
          </span>
          <span className="text-[14px] font-bold text-foreground">{title}</span>
        </div>

        {url && (
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
            title={title}
            className="w-full flex-1 border-0 bg-[#525659]"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
