import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { TableHead } from './table'

// A clickable table header that drives a { selector, desc } sort object. `field`
// is this column's selector. Clicking an inactive column sorts it descending;
// clicking the active column toggles direction. `sort`/`onSortChange` are the
// shared sort state owned by the page (fed straight into useGridQuery).
export function SortableTableHead({ field, sort, onSortChange, children, className }) {
  const active = sort?.selector === field
  const nextDesc = active ? !sort.desc : true
  const Icon = !active ? ChevronsUpDown : sort.desc ? ChevronDown : ChevronUp

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSortChange({ selector: field, desc: nextDesc })}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-foreground',
          active ? 'text-foreground' : ''
        )}
        aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}
      >
        {children}
        <Icon className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  )
}
