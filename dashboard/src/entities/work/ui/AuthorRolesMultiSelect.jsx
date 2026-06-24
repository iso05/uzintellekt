import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Checkbox,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useDictionaries } from '../model/use-dictionaries'

/**
 * Multi-select for author roles. Value is array of string ids.
 * Pulls roles from useDictionaries() — no need to pass them in.
 */
export default function AuthorRolesMultiSelect({
  value = [],
  onChange,
  disabled = false,
  hasError = false,
  onClose,
}) {
  const { authorRoles } = useDictionaries()

  const selectedIds = useMemo(() => value.map(String), [value])

  const summary = useMemo(() => {
    if (!selectedIds.length) return '— Rolni tanlang —'
    return selectedIds
      .map((id) => {
        const r = authorRoles.find((x) => String(x.id) === id)
        return r?.localizedName?.uz || r?.localizedName?.ru || r?.name || ''
      })
      .filter(Boolean)
      .join(', ')
  }, [selectedIds, authorRoles])

  const toggle = (roleId) => {
    const id = String(roleId)
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    onChange(next)
  }

  return (
    <Popover onOpenChange={(open) => !open && onClose?.()}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-between bg-card px-3 font-normal',
            hasError && 'border-destructive bg-destructive/5'
          )}
        >
          <span
            className={cn(
              'truncate text-left',
              !selectedIds.length && 'text-muted-foreground'
            )}
          >
            {summary}
          </span>
          <ChevronDown className="shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1.5">
        <div className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
          {authorRoles.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Rollar mavjud emas
            </div>
          ) : (
            authorRoles.map((ar) => {
              const id = String(ar.id)
              const checked = selectedIds.includes(id)
              const label =
                ar.localizedName?.uz || ar.localizedName?.ru || ar.name || ''
              return (
                <label
                  key={id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors hover:bg-muted',
                    checked && 'bg-secondary font-semibold text-primary'
                  )}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(id)} />
                  <span>{label}</span>
                </label>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
