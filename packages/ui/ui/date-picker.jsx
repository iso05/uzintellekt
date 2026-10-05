import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Calendar } from './calendar'
import { Button } from './button'
import { Input } from './input'
import { cn } from '../lib/utils'

/**
 * DatePicker component formatting strictly as dd.MM.yyyy
 * with user-friendly input clearing and year/month dropdown selectors.
 */
export function DatePicker({
  value = '',
  onChange,
  disabled = false,
  hasError = false,
  placeholder = 'dd.MM.yyyy',
  id,
  className,
  defaultMonth,
}) {
  const [open, setOpen] = useState(false)

  // Parse string "dd.MM.yyyy" to Date object
  const selectedDate = useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date && isValid(value)) return value
    const str = String(value).trim()
    if (!str) return undefined
    const parsed = parse(str, 'dd.MM.yyyy', new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value])

  const handleSelectDate = (date) => {
    if (!date) {
      onChange?.('')
      setOpen(false)
      return
    }
    const formatted = format(date, 'dd.MM.yyyy')
    onChange?.(formatted)
    setOpen(false)
  }

  const handleInputChange = (e) => {
    const rawVal = e.target.value
    if (!rawVal || rawVal.trim() === '') {
      onChange?.('')
      return
    }

    // Keep digits only up to 8
    const digits = rawVal.replace(/\D/g, '').slice(0, 8)
    if (!digits) {
      onChange?.('')
      return
    }

    let formatted = digits.slice(0, 2)
    if (digits.length > 2) {
      formatted += '.' + digits.slice(2, 4)
    }
    if (digits.length > 4) {
      formatted += '.' + digits.slice(4, 8)
    }
    onChange?.(formatted)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange?.('')
  }

  const calendarMonth = selectedDate || defaultMonth || new Date()

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={typeof value === 'string' ? value : value ? format(value, 'dd.MM.yyyy') : ''}
        onChange={handleInputChange}
        maxLength={10}
        disabled={disabled}
        className={cn('pr-16 font-mono', hasError && 'border-destructive bg-destructive/5')}
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        {Boolean(value) && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            title="Tozalash"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={calendarMonth}
              onSelect={handleSelectDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
