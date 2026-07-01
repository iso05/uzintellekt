import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UploadCloud } from 'lucide-react'
import { ACCEPT_ATTR } from '@/entities/work-file'
import { cn } from '@/shared/lib/utils'

/**
 * Drag&drop zone with a keyboard/click fallback (<input type=file>).
 * Calls onFiles(FileList) with whatever the user dropped/picked; the parent
 * validates and toasts rejections.
 */
export default function UploadDropzone({ onFiles, disabled = false }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const pick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files)
  }

  const handleChange = (e) => {
    if (e.target.files?.length) onFiles(e.target.files)
    e.target.value = '' // allow re-selecting the same file
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          pick()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        dragging ? 'border-primary bg-primary-soft/40' : 'border-border hover:border-primary/40 hover:bg-muted/40',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <UploadCloud className="h-7 w-7 text-muted-foreground" />
      <span className="text-[13.5px] font-semibold text-foreground">{t('work_files.drop_hint')}</span>
      <span className="text-[12px] text-muted-foreground">{t('work_files.drop_types')}</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
