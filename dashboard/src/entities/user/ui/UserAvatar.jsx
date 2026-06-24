import { cn } from '@/shared/lib/utils'
import { getUserInitials } from '../model/selectors'

const SIZES = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-xl',
}

export default function UserAvatar({ user, size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground',
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {getUserInitials(user)}
    </span>
  )
}
