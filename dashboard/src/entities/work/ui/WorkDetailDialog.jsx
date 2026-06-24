import { CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui'
import { formatDateTime } from '@/shared/lib/format'
import StatusBadge from './StatusBadge'
import { getWorkStatus } from '../model/status'
import {
  useDictionaries,
  resolveWorkTypeName,
  resolveAuthorRoleNames,
} from '../model/use-dictionaries'

function DetailItem({ label, children, full }) {
  return (
    <div className={full ? 'col-span-2 flex flex-col gap-1' : 'flex flex-col gap-1'}>
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="text-[14px] font-semibold text-foreground">{children}</span>
    </div>
  )
}

function RightHoldersTable({ holders, authorRoles }) {
  if (!holders?.length) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-[13px] text-muted-foreground">
        Ko&apos;rsatilmagan.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[13px]">
        <thead className="border-b border-border bg-muted/60">
          <tr>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">№</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pasport</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ism</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Familiya</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ulush</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Muallif roli</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {holders.map((rh, idx) => (
            <tr key={rh.id ?? idx}>
              <td className="px-3 py-2.5 font-medium text-muted-foreground">{idx + 1}</td>
              <td className="px-3 py-2.5 font-mono text-foreground">{rh.passportNo || rh.passportSeria || '—'}</td>
              <td className="px-3 py-2.5 text-foreground">{rh.firstName || '—'}</td>
              <td className="px-3 py-2.5 text-foreground">{rh.lastName || '—'}</td>
              <td className="px-3 py-2.5 font-bold tabular-nums text-foreground">{rh.sharePercentage ?? rh.share ?? 0}%</td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {resolveAuthorRoleNames(authorRoles, rh.authorRoleIds || [])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WorkDetailDialog({ work, open, onOpenChange, footer }) {
  const { workTypes, authorRoles } = useDictionaries()
  if (!work) return null

  const status = getWorkStatus(work)
  const typeName = resolveWorkTypeName(workTypes, work.workTypeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle>Asar tafsilotlari</DialogTitle>
          <DialogDescription className="sr-only">
            {work.name || 'Asar tafsilotlari'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[480px] overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <DetailItem label="Nomi">{work.name || '—'}</DetailItem>
            <DetailItem label="Asar turi">{typeName}</DetailItem>
            <DetailItem label="Holati">
              <StatusBadge status={status} />
            </DetailItem>
            <DetailItem label="Yaratilgan sana">{formatDateTime(work.createdAt)}</DetailItem>
            <DetailItem label="O'zgartirilgan sana">{formatDateTime(work.updatedAt)}</DetailItem>

            {status === 'REGISTERED' && work.registrationDate && (
              <div className="col-span-2">
                <div className="flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-[13.5px] font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Ro&apos;yxatga olindi: {work.registrationDate}
                </div>
              </div>
            )}

            {status === 'REJECTED' && work.rejectionReason && (
              <div className="col-span-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] font-semibold text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Rad etilish sababi: {work.rejectionReason}</span>
                </div>
              </div>
            )}

            <DetailItem label="Tavsifi" full>
              <div className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-[13.5px] font-normal text-foreground">
                {work.description || '—'}
              </div>
            </DetailItem>

            <DetailItem label="Haq egalari" full>
              <div className="mt-2">
                <RightHoldersTable holders={work.rightHolders} authorRoles={authorRoles} />
              </div>
            </DetailItem>
          </div>
        </div>

        {footer && (
          <div className="flex items-center justify-start gap-3 border-t border-border bg-muted/30 p-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
