import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pencil, User as UserIcon, AlertTriangle, FileSignature, Upload, FileText, Plus, ChevronRight, Download, Copy, Check } from 'lucide-react'
import { PageHeader, Card, CardContent, Button, Badge, Skeleton, EmptyState, Pagination, toast } from '@shared/ui'
import { formatDate, formatDateTime } from '@shared/lib/format'
import {
  UserStateBadge,
  UserRoleBadge,
  getFullName,
} from '@/entities/user'
import { WorkStatusBadge } from '@/entities/work'
import { ContractStateBadge, ContractTypeBadge, getContractDownloadUrl } from '@/entities/contract'
import { useWorkTypeMap } from '@/entities/dictionary'
import { EditUserDialog } from '@/features/user-edit'
import { UserStateActions } from '@/features/user-state'
import { UploadLegacyContractDialog } from '@/features/contract-actions'
import { WorkFormDialog } from '@/features/work-form'
import { ROUTES } from '@/config/routes'
import { useUserDetail } from '../model/use-user-detail'
import { useUserWorks, useUserContracts } from '../model/use-user-related'

function Row({ label, children }) {
  if (children == null || children === '' ) return null
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <span className="w-44 shrink-0 text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 text-[14px] text-foreground">{children}</span>
    </div>
  )
}

// A value with a click-to-copy button (checkmark feedback for ~1.5s). `mono`
// renders identifiers (PINFL, passport) in a monospace face for readability.
function CopyValue({ value, mono }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  if (value == null || value === '') return null
  const text = String(value)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className={mono ? 'font-mono tracking-tight' : undefined}>{text}</span>
      <button
        type="button"
        onClick={copy}
        title={t('common.copy')}
        aria-label={t('common.copy')}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  )
}

function Count({ value }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
      {value}
    </span>
  )
}

function BackLink({ t }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('user.back_to_list')}
    </button>
  )
}

export default function UserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, error, user, reload } = useUserDetail(id)
  const works = useUserWorks(id)
  const contracts = useUserContracts(id)
  const typeMap = useWorkTypeMap()
  const [editOpen, setEditOpen] = useState(false)
  const [legacyOpen, setLegacyOpen] = useState(false)
  const [workOpen, setWorkOpen] = useState(false)

  async function downloadContract(contract) {
    try {
      const { url } = await getContractDownloadUrl(contract.id)
      if (url) window.open(url, '_blank', 'noopener')
      else toast.error(t('common.error'))
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink t={t} />
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title={t(error === 'not_found' ? 'user.not_found' : 'common.error')}
            description={error && error !== 'not_found' ? error : undefined}
          />
        </Card>
      </div>
    )
  }

  const kind = user.userType || user.type
  const phones = Array.isArray(user.phones) ? user.phones.join(', ') : ''

  return (
    <div className="flex flex-col gap-5">
      <BackLink t={t} />

      <PageHeader
        title={getFullName(user) || '—'}
        subtitle={
          <span className="flex items-center gap-2 pt-1">
            <UserRoleBadge role={user.role} />
            <UserStateBadge state={user.state} />
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              {t('user.edit')}
            </Button>
            <UserStateActions user={user} onChanged={reload} />
          </div>
        }
      />

      <Card>
        <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
          <UserIcon className="h-[18px] w-[18px] text-muted-foreground" />
          <h3 className="m-0 text-[15px] font-semibold text-foreground">{t('user.personal_data')}</h3>
        </div>
        <CardContent className="p-5 pt-4">
          <div className="flex flex-col divide-y divide-border">
            <Row label={t('user.form.type')}>
              {kind ? (
                <Badge variant={kind === 'LEGAL' ? 'info' : 'muted'}>
                  {t(kind === 'LEGAL' ? 'user.form.legal' : 'user.form.individual')}
                </Badge>
              ) : (
                '—'
              )}
            </Row>
            {kind === 'LEGAL' ? (
              <>
                <Row label={t('user.form.legal_name')}>
                  {user.legalName ? <CopyValue value={user.legalName} /> : null}
                </Row>
                <Row label={t('user.form.inn')}>{user.inn ? <CopyValue value={user.inn} mono /> : null}</Row>
              </>
            ) : (
              <>
                <Row label={t('user.columns.name')}>
                  <CopyValue value={[user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')} />
                </Row>
                <Row label={t('user.form.pinfl')}>{user.pinfl ? <CopyValue value={user.pinfl} mono /> : null}</Row>
                <Row label={t('user.form.passport')}>
                  {user.passportSeria ? <CopyValue value={user.passportSeria} mono /> : null}
                </Row>
              </>
            )}
            <Row label={t('user.form.pseudonym')}>{user.pseudonym}</Row>
            <Row label={t('user.form.phones')}>{phones ? <CopyValue value={phones} mono /> : null}</Row>
            <Row label={t('user.form.address')}>{user.address}</Row>
            <Row label={t('user.username')}>{user.username}</Row>
            <Row label={t('user.is_member')}>{t(user.isMember ? 'common.yes' : 'common.no')}</Row>
          </div>
        </CardContent>
      </Card>

      {/* Works */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
          <FileText className="h-[18px] w-[18px] text-muted-foreground" />
          <h3 className="m-0 text-[15px] font-semibold text-foreground">{t('work.section_title')}</h3>
          {!works.loading && <Count value={works.totalItems} />}
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => setWorkOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('work.create_work')}
            </Button>
          </div>
        </div>
        <CardContent className="px-5 py-2">
          {works.loading ? (
            <Skeleton className="my-3 h-16 w-full" />
          ) : works.items.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {works.items.map((w) => (
                <li key={w.id}>
                  <Link
                    to={ROUTES.WORK_DETAIL(w.id)}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-foreground">{w.name || '—'}</span>
                      <span className="text-[12px] text-muted-foreground">
                        {typeMap[w.workTypeId] || `#${w.workTypeId}`} · {formatDate(w.createdAt)}
                      </span>
                    </span>
                    <WorkStatusBadge status={w.state} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-[13px] text-muted-foreground">{t('work.section_hint')}</p>
          )}
        </CardContent>
        {!works.loading && works.totalPages > 1 && (
          <Pagination
            page={works.page - 1}
            pageSize={works.pageSize}
            total={works.totalItems}
            onPageChange={(p) => works.setPage(p + 1)}
            itemLabel={t('moderation.items')}
          />
        )}
      </Card>

      {/* Contracts */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
          <FileSignature className="h-[18px] w-[18px] text-muted-foreground" />
          <h3 className="m-0 text-[15px] font-semibold text-foreground">{t('contract.section_title')}</h3>
          {!contracts.loading && <Count value={contracts.totalItems} />}
          {/* Legacy upload is the only way to add a contract for now, and only when
              the user has none — signing on their behalf isn't available yet. */}
          {!contracts.loading && contracts.totalItems === 0 && (
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={() => setLegacyOpen(true)}>
                <Upload className="h-4 w-4" />
                {t('contract.upload_legacy')}
              </Button>
            </div>
          )}
        </div>
        <CardContent className="px-5 py-2">
          {contracts.loading ? (
            <Skeleton className="my-3 h-16 w-full" />
          ) : contracts.items.length ? (
            <ul className="flex flex-col divide-y divide-border">
              {contracts.items.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-foreground">{c.number || '—'}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {c.signedAt ? formatDateTime(c.signedAt) : c.effectiveFrom ? formatDate(c.effectiveFrom) : '—'}
                    </span>
                  </span>
                  <ContractTypeBadge type={c.type} />
                  <ContractStateBadge state={c.state} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadContract(c)}
                    aria-label={t('work.download')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-[13px] text-muted-foreground">{t('contract.section_hint')}</p>
          )}
        </CardContent>
        {!contracts.loading && contracts.totalPages > 1 && (
          <Pagination
            page={contracts.page - 1}
            pageSize={contracts.pageSize}
            total={contracts.totalItems}
            onPageChange={(p) => contracts.setPage(p + 1)}
            itemLabel={t('contract.items')}
          />
        )}
      </Card>

      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} onUpdated={reload} />
      <UploadLegacyContractDialog
        userId={user.id}
        open={legacyOpen}
        onOpenChange={setLegacyOpen}
        onDone={contracts.reload}
      />
      <WorkFormDialog
        mode="create"
        userId={user.id}
        open={workOpen}
        onOpenChange={setWorkOpen}
        onDone={(saved) => saved?.id && navigate(ROUTES.WORK_DETAIL(saved.id))}
      />
    </div>
  )
}
