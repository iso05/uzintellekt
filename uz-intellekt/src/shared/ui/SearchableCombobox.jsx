import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Label } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

export default function SearchableCombobox({
  label,
  placeholder,
  value,
  onChange,
  options = [],
  disabled = false,
  isLoading = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const normalize = (opt) => {
    if (!opt) return null
    return {
      value: opt.value ?? opt.id ?? '',
      label: opt.label ?? opt.name ?? '',
    }
  }

  const normalizedOptions = options.map(normalize).filter((opt) => opt && opt.label)

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  const selectedLabel =
    normalizedOptions.find((opt) => String(opt.value) === String(value))?.label || ''

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    setIsOpen(true)
  }

  const handleSelect = (opt) => {
    onChange(opt.value)
    setSearchTerm('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) handleSelect(filteredOptions[highlightedIndex])
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const updatePosition = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect()
        setDropdownPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width })
      }
    }

    if (isOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <Label className="mb-1.5 block">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedLabel || placeholder}
          value={isOpen ? searchTerm : selectedLabel}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground transition-colors',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="max-h-60 overflow-y-auto rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-soft-md"
        >
          {filteredOptions.map((opt, index) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                highlightedIndex === index
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="rounded-md border border-border bg-popover p-3 text-center text-sm text-muted-foreground shadow-soft-md"
        >
          Natija topilmadi: &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}
