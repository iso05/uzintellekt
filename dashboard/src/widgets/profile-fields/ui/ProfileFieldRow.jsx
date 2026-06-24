import { Copy, Pencil, Check, X } from 'lucide-react'
import { Badge, Button, toast } from '@/shared/ui'

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Nusxalandi')
  } catch {
    toast.error("Nusxa ko'chirilmadi")
  }
}

function MemberBadge({ value }) {
  return value ? (
    <Badge variant="success" className="gap-1">
      <Check className="h-3 w-3" />
      A&apos;zo
    </Badge>
  ) : (
    <Badge variant="muted" className="gap-1">
      <X className="h-3 w-3" />
      A&apos;zo emas
    </Badge>
  )
}

export default function ProfileFieldRow({
  icon: Icon,
  label,
  value,
  editable = false,
  editing = false,
  onEdit,
  editSlot,
  isMember = false,
  copyable = false,
}) {
  const hasValue = !!value
  const copyValue = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : ''
  return (
    <div className="group flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40 md:px-6">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>

      {editing && editSlot ? (
        <div className="ml-auto w-full sm:w-auto">{editSlot}</div>
      ) : (
        <div className="ml-auto flex items-center gap-1.5">
          {isMember ? (
            <MemberBadge value={value} />
          ) : (
            <span className="break-all text-right text-[14px] font-semibold text-foreground">
              {value || <span className="text-muted-foreground">—</span>}
            </span>
          )}
          {copyable && hasValue && copyValue && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
              onClick={() => copyToClipboard(copyValue)}
              title="Nusxa olish"
              aria-label="Nusxa olish"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          {editable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/70 hover:bg-primary-soft hover:text-primary"
              onClick={onEdit}
              title="Tahrirlash"
              aria-label="Tahrirlash"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
