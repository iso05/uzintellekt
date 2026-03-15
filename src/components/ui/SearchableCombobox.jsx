import { useState, useRef, useEffect } from 'react'

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

  // ─── { value, label } yoki { id, name } — ikkalasini ham qabul qiladi ──────
  const normalize = (opt) => {
    if (!opt) return null
    return {
      value: opt.value ?? opt.id ?? '',
      label: opt.label ?? opt.name ?? '',
    }
  }

  const normalizedOptions = options
    .map(normalize)
    .filter((opt) => opt && opt.label) // undefined/null tozalash

  // Filter
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes((searchTerm || '').toLowerCase())
  )

  // Tanlangan elementning labeli
  const selectedLabel = normalizedOptions.find((opt) => String(opt.value) === String(value))?.label || ''

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
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
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
        setDropdownPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width })
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
        <label className="block text-white/90 text-xs md:text-sm font-medium mb-2 md:mb-3">
          {label} {required && '*'}
        </label>
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
          className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-white/10 border transition-all duration-200 text-sm md:text-base text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            disabled || isLoading ? 'border-white/20' : 'border-white/30 focus:border-white/50'
          }`}
          style={{
            backgroundImage:
              value && !isOpen
                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`
                : 'none',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: value && !isOpen ? '2.5rem' : '1rem',
          }}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin text-white/50 text-sm">⏳</div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="bg-black/90 backdrop-blur-xl border border-white/30 rounded-lg md:rounded-xl shadow-2xl max-h-48 md:max-h-60 overflow-y-auto"
        >
          {filteredOptions.map((opt, index) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-3 md:px-4 py-2 md:py-3 transition-colors duration-150 border-b border-white/10 last:border-b-0 text-xs md:text-sm ${
                highlightedIndex === index ? 'bg-purple-500/30 text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className="bg-black/90 backdrop-blur-xl border border-white/30 rounded-lg md:rounded-xl shadow-2xl p-3 md:p-4 text-center text-white/70 text-xs md:text-sm"
        >
          Natija topilmadi: "{searchTerm}"
        </div>
      )}
    </div>
  )
}
