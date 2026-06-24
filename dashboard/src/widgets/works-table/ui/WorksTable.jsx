import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Inbox } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  Pagination,
  Button,
  EmptyState,
} from '@/shared/ui'
import {
  StatusBadge,
  WorkTypeBadge,
  getWorkStatus,
  useDictionaries,
} from '@/entities/work'
import { WorkActions } from '@/widgets/work-actions'
import { ROUTES } from '@/shared/config/routes'

function WorksEmptyState({ hasFilters }) {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={Inbox}
      title={hasFilters ? 'Hech narsa topilmadi' : "Hozircha asarlar yo'q"}
      description={
        hasFilters
          ? "Filtrlarni o'zgartirib ko'ring yoki qidiruvni tozalang."
          : "Birinchi asaringizni qo'shib intellektual mulkni ro'yxatdan o'tkazing."
      }
      action={
        !hasFilters && (
          <Button onClick={() => navigate(ROUTES.WORK_NEW)} className="gap-2">
            <Plus className="h-4 w-4" />
            Birinchi asarni qo&apos;shing
          </Button>
        )
      }
    />
  )
}

export default function WorksTable({
  works,
  loading,
  hasFilters,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onChanged,
}) {
  const { workTypes } = useDictionaries()

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5 text-[13px] font-medium text-muted-foreground md:px-6">
        <span>
          Jami <strong className="font-bold text-foreground">{total}</strong> ta asar
        </span>
      </header>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : works.length === 0 ? (
        <WorksEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Tur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Haq egalari</TableHead>
                <TableHead>Ro&apos;yxatga olingan</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {works.map((w) => {
                const status = getWorkStatus(w)
                const isRegistered = status === 'REGISTERED'
                return (
                  <TableRow key={w.id} className="group">
                    <TableCell
                      className="max-w-[240px] cursor-pointer"
                      onClick={() => onView(w)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold text-foreground" title={w.name}>
                            {w.name || '—'}
                          </span>
                          {status === 'REJECTED' && w.rejectionReason && (
                            <span className="mt-0.5 line-clamp-2 text-[11px] font-medium text-destructive">
                              Rad etish sababi: {w.rejectionReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <WorkTypeBadge workTypeId={w.workTypeId} workTypes={workTypes} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.rightHolders?.length ?? 0} kishi
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isRegistered ? w.registrationDate || '—' : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <WorkActions work={w} onView={onView} onChanged={onChanged} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Pagination
            page={page - 1}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => onPageChange(p + 1)}
            itemLabel="ta asar"
          />
        </>
      )}
    </section>
  )
}
