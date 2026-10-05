import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyToClipboard } from '../lib/copy'
import { cn } from '../lib/utils'

export function CopyButton({
  value,
  className,
  iconClassName,
  duration = 1000,
  title = 'Nusxalash',
  onCopied,
}) {
  const [copied, setCopied] = useState(false)

  if (value == null || value === '') return null

  async function handleCopy(e) {
    e.stopPropagation()
    const ok = await copyToClipboard(value)
    if (ok) {
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), duration)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={title}
      className={cn(
        'shrink-0 text-muted-foreground transition-all hover:text-foreground focus:outline-none rounded p-0.5',
        copied && 'text-emerald-600 dark:text-emerald-400',
        className
      )}
    >
      {copied ? (
        <Check className={cn('h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 transition-all scale-110', iconClassName)} />
      ) : (
        <Copy className={cn('h-3.5 w-3.5', iconClassName)} />
      )}
    </button>
  )
}

export function CopyValue({ value, mono, className }) {
  if (value == null || value === '') return null
  const text = String(value)

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={mono ? 'font-mono tracking-tight' : undefined}>{text}</span>
      <CopyButton value={text} />
    </span>
  )
}
