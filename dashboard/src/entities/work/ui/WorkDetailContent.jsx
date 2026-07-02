import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDateTime } from '@shared/lib/format'
import StatusBadge from './StatusBadge'
import { getWorkStatus } from '../model/status'
import { getHolderRoleIds } from '../model/validation'
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
  const { t } = useTranslation()
  if (!holders?.length) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-[13px] text-muted-foreground">
        {t('detail.not_specified')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[13px]">
        <thead className="border-b border-border bg-muted/60">
          <tr>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_no')}</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_passport')}</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_first_name')}</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_last_name')}</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_share')}</th>
            <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('detail.col_role')}</th>
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
                {resolveAuthorRoleNames(authorRoles, getHolderRoleIds(rh))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Read-only detail grid for a work. Used by the work detail page. */
export default function WorkDetailContent({ work }) {
  const { workTypes, authorRoles } = useDictionaries()
  const { t } = useTranslation()
  if (!work) return null

  const status = getWorkStatus(work)
  const typeName = resolveWorkTypeName(workTypes, work.workTypeId)

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <DetailItem label={t('detail.name')}>{work.name || '—'}</DetailItem>
      <DetailItem label={t('detail.type')}>{typeName}</DetailItem>
      <DetailItem label={t('detail.status')}>
        <StatusBadge status={status} />
      </DetailItem>
      <DetailItem label={t('detail.created')}>{formatDateTime(work.createdAt)}</DetailItem>
      <DetailItem label={t('detail.updated')}>{formatDateTime(work.updatedAt)}</DetailItem>

      {status === 'REGISTERED' && work.registrationDate && (
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-[13.5px] font-semibold text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t('detail.registered_on', { date: formatDate(work.registrationDate) })}
          </div>
        </div>
      )}

      {status === 'REJECTED' && work.rejectionReason && (
        <div className="col-span-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] font-semibold text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('detail.reject_reason', { reason: work.rejectionReason })}</span>
          </div>
        </div>
      )}

      <DetailItem label={t('detail.description')} full>
        <div className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-[13.5px] font-normal text-foreground">
          {work.description || '—'}
        </div>
      </DetailItem>

      <DetailItem label={t('detail.holders')} full>
        <div className="mt-2">
          <RightHoldersTable holders={work.rightHolders} authorRoles={authorRoles} />
        </div>
      </DetailItem>
    </div>
  )
}
