import { Skeleton } from './skeleton'
import { cn } from '@shared/lib/utils'

/**
 * Unified loading patterns used across the dashboard. Pages should pick the
 * variant that matches their layout instead of building one-off skeletons.
 */

/** Row of skeleton lines — for lists/tables that don't yet know item shape. */
export function ListSkeleton({ rows = 5, className }) {
  return (
    <div className={cn('space-y-2 p-6', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/** Grid of equal-sized cards — for stats, dashboards. */
export function CardsGridSkeleton({ count = 4, height = 76, minWidth = 200, className }) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} style={{ height }} />
      ))}
    </div>
  )
}

/** Compact text-block skeleton (title + a few lines). */
export function TextBlockSkeleton({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

/** Full-page initial loader (e.g., page first-mount). */
export function PageLoading({ className }) {
  return (
    <div className={cn('flex flex-col gap-5 p-1', className)}>
      <Skeleton className="h-24 w-full" />
      <CardsGridSkeleton count={4} />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
