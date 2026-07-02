import { Search } from 'lucide-react'
import { cn } from '../lib/utils'
import { Input } from './input'

// Controlled search + filter row shared by admin list pages. The parent owns the
// raw search string (and debounces it before feeding the grid query); this
// component is purely presentational. Extra filter controls go in `children`,
// rendered to the right of the search box.
export function DataGridToolbar({ search, onSearchChange, placeholder, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {children}
    </div>
  )
}
