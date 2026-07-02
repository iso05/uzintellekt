import { useTranslation } from 'react-i18next'
import { ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent, Button, Checkbox } from '@shared/ui'

// Multi-select of author roles backed by a checkbox list in a popover.
export default function RolesMultiSelect({ options, value, onChange, disabled, invalid }) {
  const { t } = useTranslation()

  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={invalid ? 'w-full justify-between border-destructive font-normal' : 'w-full justify-between font-normal'}
        >
          <span className="truncate">
            {value.length
              ? t('work.form.roles_selected', { count: value.length })
              : t('work.form.select_roles')}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-64 w-64 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {options.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox checked={value.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
