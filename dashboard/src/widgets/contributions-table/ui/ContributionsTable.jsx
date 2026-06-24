import { FileText, Users } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  EmptyState,
} from '@/shared/ui'
import { StatusBadge, getWorkStatus } from '@/entities/work'

export default function ContributionsTable({ contributions, loading, onView }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {loading ? (
        <ListSkeleton rows={3} />
      ) : contributions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Qatnashgan asarlar yo'q"
          description="Siz haq egasi sifatida kiritilgan asarlar bu yerda ko'rinadi."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.map((w) => (
              <TableRow
                key={w.id}
                className="group cursor-pointer"
                onClick={() => onView(w)}
              >
                <TableCell className="max-w-[280px]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="truncate font-semibold text-foreground" title={w.name}>
                      {w.name || '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[320px] text-muted-foreground">
                  <span className="line-clamp-1" title={w.description}>
                    {w.description || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={getWorkStatus(w)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
