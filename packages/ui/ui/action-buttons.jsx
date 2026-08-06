import { Trash2, RefreshCw, Pencil } from 'lucide-react'
import { Button } from './button'
import { cn } from '@shared/lib/utils'

export function DeleteButton({ onClick, disabled, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      type="button"
      {...props}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

export function RefreshButton({ onClick, disabled, loading, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 text-primary hover:bg-primary-soft hover:text-primary',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
    </Button>
  )
}

export function EditButton({ onClick, disabled, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 text-muted-foreground hover:bg-primary-soft hover:text-primary',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      type="button"
      {...props}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  )
}
