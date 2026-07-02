import { useTranslation } from 'react-i18next'
import { FileSignature } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  ListSkeleton,
  Pagination,
  EmptyState,
} from '@shared/ui'
import { ContractStatusBadge, getContractStatus } from '@/entities/contract'
import { ContractActions } from '@/features/contract-download'
import { formatDate } from '@shared/lib/format'

function contractTypeLabel(t, c) {
  return t(`contracts.type_${(c.type || 'MEMBERSHIP').toLowerCase()}`, {
    defaultValue: t('contracts.type_membership'),
  })
}

function ContractRowCard({ contract, busyId, onView, onDownload }) {
  const { t } = useTranslation()
  return (
    <article className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileSignature className="h-[18px] w-[18px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[14px] font-semibold text-foreground">
            {contractTypeLabel(t, contract)}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {formatDate(contract.signedAt || contract.createdAt)}
          </span>
        </div>
        <ContractStatusBadge status={getContractStatus(contract)} />
      </div>
      <ContractActions
        contract={contract}
        busy={busyId}
        onView={onView}
        onDownload={onDownload}
      />
    </article>
  )
}

export default function ContractsTable({
  contracts,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  busyId,
  onView,
  onDownload,
}) {
  const { t } = useTranslation()
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {loading ? (
        <ListSkeleton rows={5} />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={t('contracts.empty_title')}
          description={t('contracts.empty_desc')}
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden">
            {contracts.map((c) => (
              <ContractRowCard
                key={c.id}
                contract={c}
                busyId={busyId}
                onView={onView}
                onDownload={onDownload}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('contracts.col_type')}</TableHead>
                  <TableHead>{t('contracts.col_status')}</TableHead>
                  <TableHead>{t('contracts.col_date')}</TableHead>
                  <TableHead>{t('contracts.col_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                          <FileSignature className="h-[18px] w-[18px]" />
                        </span>
                        <span className="text-[14px] font-semibold text-foreground">
                          {contractTypeLabel(t, c)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={getContractStatus(c)} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(c.signedAt || c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <ContractActions
                        contract={c}
                        busy={busyId}
                        onView={onView}
                        onDownload={onDownload}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            itemLabel={t('contracts.item_label')}
          />
        </>
      )}
    </section>
  )
}
