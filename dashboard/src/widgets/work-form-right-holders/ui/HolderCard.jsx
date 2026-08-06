import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Input,
  Label,
  FieldError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  toast,
  DeleteButton,
  RefreshButton,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { useAuth } from '@/features/auth'
import { buildHolderErrorKey, AuthorRolesMultiSelect } from '@/entities/work'
import { isAllowedFile } from '@/entities/work-file'
import { uploadOne } from '@/features/work-file-upload'
import { uploadRightHolderDocument } from '@/entities/right-holder-document'
import { UploadDropzone } from '@/widgets/work-files'

export default function HolderCard({
  index,
  holder,
  onChange,
  onBlur,
  onRemove,
  fieldErrors,
  remainingShare,
  totalShare,
  disabled,
  canRemove,
  workId,
  ensureWorkId,
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [uploadQueue, setUploadQueue] = useState([])
  const errKey = (field) => fieldErrors[buildHolderErrorKey(index, field)]

  const isUserLegal = user?.userType === 'LEGAL'
  const isPrimaryHolderLocked = index === 0

  const currentHolderType = isPrimaryHolderLocked
    ? (isUserLegal ? 'LEGAL' : 'INDIVIDUAL')
    : ((holder.subjectType === 'LEGAL' || holder.type === 'LEGAL') ? 'LEGAL' : 'INDIVIDUAL')

  const isLegal = currentHolderType === 'LEGAL'

  const displayPassportNo = isPrimaryHolderLocked
    ? (isUserLegal
        ? (user?.inn || user?.passportNo || user?.pinfl || holder.passportNo || '123456789')
        : (user?.pinfl || user?.passportNo || holder.passportNo || '30101961234509'))
    : holder.passportNo

  const displayFirstName = isPrimaryHolderLocked
    ? (isUserLegal
        ? (user?.legalName || user?.orgName || user?.firstName || holder.firstName || 'OOO UZINTELLEKT')
        : (user?.firstName || holder.firstName || 'Test'))
    : holder.firstName

  const displayLastName = isPrimaryHolderLocked
    ? (isUserLegal ? '' : (user?.lastName || holder.lastName || 'Foydalanuvchi'))
    : holder.lastName

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    const allowed = files.filter(isAllowedFile)
    const rejected = files.filter((f) => !isAllowedFile(f))

    if (rejected.length > 0) {
      rejected.forEach((f) => {
        toast.error(t('work_files.reject_type', { name: f.name }))
      })
    }

    if (allowed.length === 0) return

    for (const file of allowed) {
      const localId = `rh-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newQueueItem = {
        id: localId,
        name: file.name,
        size: file.size,
        progress: 0,
        state: 'init',
        fileObj: file,
      }

      setUploadQueue((prev) => [...prev, newQueueItem])

      const uploadPromise = (workId && holder.id)
        ? uploadRightHolderDocument({
            workId,
            rightHolderId: holder.id,
            file,
            onProgress: (p) => {
              setUploadQueue((prev) =>
                prev.map((item) => (item.id === localId ? { ...item, progress: p, state: 'put' } : item))
              )
            },
            onState: (s) => {
              setUploadQueue((prev) =>
                prev.map((item) => (item.id === localId ? { ...item, state: s } : item))
              )
            },
          })
        : uploadOne({
            workId: workId || 'test-work-id',
            file: file,
            onProgress: (p) => {
              setUploadQueue((prev) =>
                prev.map((item) => (item.id === localId ? { ...item, progress: p, state: 'put' } : item))
              )
            },
            onState: (s) => {
              setUploadQueue((prev) =>
                prev.map((item) => (item.id === localId ? { ...item, state: s } : item))
              )
            },
          })

      uploadPromise
        .then(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== localId))
          const currentFiles = holder.contractFiles || []
          if (!currentFiles.includes(file.name)) {
            onChange('contractFiles', [...currentFiles, file.name])
          }
        })
        .catch((err) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === localId
                ? { ...item, state: 'error', errorMsg: err?.message || 'Upload error' }
                : item
            )
          )
          toast.error(t('work_files.upload_error', { name: file.name }))
        })
    }
  }

  const handleRetryUpload = (localId) => {
    const item = uploadQueue.find((i) => i.id === localId)
    if (!item) return

    setUploadQueue((prev) =>
      prev.map((i) => (i.id === localId ? { ...i, state: 'init', progress: 0, errorMsg: null } : i))
    )

    const uploadPromise = (workId && holder.id)
      ? uploadRightHolderDocument({
          workId,
          rightHolderId: holder.id,
          file: item.fileObj,
          onProgress: (p) => {
            setUploadQueue((prev) =>
              prev.map((i) => (i.id === localId ? { ...i, progress: p, state: 'put' } : i))
            )
          },
          onState: (s) => {
            setUploadQueue((prev) =>
              prev.map((i) => (i.id === localId ? { ...i, state: s } : i))
            )
          },
        })
      : uploadOne({
          workId: workId || 'test-work-id',
          file: item.fileObj,
          onProgress: (p) => {
            setUploadQueue((prev) =>
              prev.map((i) => (i.id === localId ? { ...i, progress: p, state: 'put' } : i))
            )
          },
          onState: (s) => {
            setUploadQueue((prev) =>
              prev.map((i) => (i.id === localId ? { ...i, state: s } : i))
            )
          },
        })

    uploadPromise
      .then(() => {
        setUploadQueue((prev) => prev.filter((i) => i.id !== localId))
        const currentFiles = holder.contractFiles || []
        if (!currentFiles.includes(item.name)) {
          onChange('contractFiles', [...currentFiles, item.name])
        }
      })
      .catch((err) => {
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === localId
              ? { ...i, state: 'error', errorMsg: err?.message || 'Upload error' }
              : i
          )
        )
        toast.error(t('work_files.upload_error', { name: item.name }))
      })
  }

  const handleRemoveQueueItem = (localId) => {
    setUploadQueue((prev) => prev.filter((i) => i.id !== localId))
  }

  const handleRemoveFile = (fileName) => {
    const currentFiles = holder.contractFiles || []
    onChange('contractFiles', currentFiles.filter((name) => name !== fileName))
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[12px] font-bold text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {index + 1}
            </span>
            {t('form.holder')}
            {isPrimaryHolderLocked && (
              <span className="text-[11px] font-medium text-muted-foreground ml-1">
                ({t('form.holder_fill_ph', "O'zim")})
              </span>
            )}
          </span>

          <Select
            value={currentHolderType}
            onValueChange={(val) => {
              onChange('type', val)
              onChange('subjectType', val)
              onChange('passportNo', '')
              onChange('firstName', '')
              onChange('lastName', '')
            }}
            disabled={disabled || isPrimaryHolderLocked}
          >
            <SelectTrigger className="h-7 w-[130px] text-[11.5px] font-semibold bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">{t('form.type_physical', { defaultValue: 'Jismoniy shaxs' })}</SelectItem>
              <SelectItem value="LEGAL">{t('form.type_legal', { defaultValue: 'Yuridik shaxs' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!disabled && canRemove && (
          <DeleteButton
            onClick={onRemove}
            title={t('form.remove')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>{isLegal ? t('form.inn_label') : t('form.pinfl_label')}</Label>
          <Input
            id={`holder-field-${index}-passportNo`}
            placeholder={isLegal ? t('form.inn_ph') : t('form.pinfl_ph')}
            value={displayPassportNo}
            onChange={(e) => onChange('passportNo', e.target.value)}
            onBlur={(e) => onBlur('passportNo', e.target.value)}
            maxLength={isLegal ? 9 : 14}
            disabled={disabled || isPrimaryHolderLocked}
            className={cn('font-mono', errKey('passportNo') && 'border-destructive bg-destructive/5')}
          />
          <FieldError error={errKey('passportNo')} />
        </div>

        <div className={cn("flex flex-col gap-1.5", isLegal && "sm:col-span-2")}>
          <Label>{isLegal ? t('form.org_name_label') : t('form.first_name_label')}</Label>
          <Input
            id={`holder-field-${index}-firstName`}
            placeholder={isLegal ? t('form.org_name_ph') : t('form.first_name_ph')}
            value={displayFirstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            onBlur={(e) => onBlur('firstName', e.target.value)}
            disabled={disabled || isPrimaryHolderLocked}
            className={cn(errKey('firstName') && 'border-destructive bg-destructive/5')}
          />
          <FieldError error={errKey('firstName')} />
        </div>

        {!isLegal && (
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.last_name_label')}</Label>
            <Input
              id={`holder-field-${index}-lastName`}
              placeholder={t('form.last_name_ph')}
              value={displayLastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              onBlur={(e) => onBlur('lastName', e.target.value)}
              disabled={disabled || isPrimaryHolderLocked}
              className={cn(errKey('lastName') && 'border-destructive bg-destructive/5')}
            />
            <FieldError error={errKey('lastName')} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Label>{t('form.share_label')}</Label>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`holder-field-${index}-no-share`}
                checked={holder.share === '0'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange('share', '0')
                    onBlur('share', '0')
                  } else {
                    onChange('share', '')
                    onBlur('share', '')
                  }
                }}
                disabled={disabled}
              />
              <label
                htmlFor={`holder-field-${index}-no-share`}
                className="text-[11.5px] font-medium leading-none cursor-pointer text-muted-foreground select-none hover:text-foreground transition-colors"
              >
                {t('form.no_share_label')}
              </label>
            </div>
          </div>
          <Input
            id={`holder-field-${index}-sharePercentage`}
            type="text"
            inputMode="decimal"
            maxLength={6}
            placeholder="0.00"
            value={holder.share === '0' ? '0' : holder.share}
            onChange={(e) => onChange('share', e.target.value)}
            onBlur={(e) => onBlur('share', e.target.value)}
            disabled={disabled || holder.share === '0'}
            className={cn(errKey('sharePercentage') && 'border-destructive bg-destructive/5')}
          />
          {!disabled && holder.share !== '0' && (
            <span className="text-[11.5px] font-medium text-muted-foreground">
              {remainingShare > 0
                ? t('form.share_max', { max: remainingShare, free: 100 - totalShare })
                : t('form.share_all_done')}
            </span>
          )}
          <FieldError error={errKey('sharePercentage')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.owner_type_label')}</Label>
          <Select
            value={holder.ownerType || holder.rightHolderType || 'AUTHOR'}
            onValueChange={(v) => {
              onChange('ownerType', v)
              onChange('rightHolderType', v)
            }}
            disabled={disabled}
          >
            <SelectTrigger id={`holder-field-${index}-ownerType`} className="bg-background">
              <SelectValue placeholder={t('form.owner_type_ph')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTHOR">{t('form.owner_type_author', { defaultValue: 'Muallif' })}</SelectItem>
              <SelectItem value="HEIR">{t('form.owner_type_heir', { defaultValue: 'Voris' })}</SelectItem>
              <SelectItem value="OTHER">{t('form.owner_type_other', { defaultValue: 'Boshqa (Huquq egasi)' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.roles_label', { defaultValue: 'Mualliflik rolingiz' })}</Label>
          <AuthorRolesMultiSelect
            value={holder.authorRoleIds || ['1']}
            onChange={(val) => onChange('authorRoleIds', val)}
            disabled={disabled}
            hasError={Boolean(errKey('authorRoleIds'))}
          />
          <FieldError error={errKey('authorRoleIds')} />
        </div>
      </div>

      {/* Basis Document Section (Full Width, below the grid) */}
      {holder.ownerType && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
          <Label className="text-[13px] font-bold text-foreground">{t('form.basis_doc_label')}</Label>
          <UploadDropzone onFiles={handleFiles} disabled={disabled} />
          {!workId && (
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {t('work_files.attach_on_create')}
            </p>
          )}

          {/* Uploaded & Queue files table */}
          {((holder.contractFiles && holder.contractFiles.length > 0) || uploadQueue.length > 0) && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-background">
              <table className="w-full text-left text-[12.5px]">
                <thead className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">{t('work_files.col_name', { defaultValue: 'Fayl nomi' })}</th>
                    <th className="px-4 py-2 w-28">{t('work_files.col_status', { defaultValue: 'Holati' })}</th>
                    <th className="px-4 py-2 w-20 text-right">{t('work_files.col_actions', { defaultValue: 'Amallar' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Uploaded files */}
                  {holder.contractFiles?.map((fileName) => (
                    <tr key={fileName} className="hover:bg-muted/10">
                      <td className="px-4 py-2 font-medium truncate max-w-[300px]" title={fileName}>
                        {fileName}
                      </td>
                      <td className="px-4 py-2 text-success font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        {t('work_files.done', { defaultValue: 'Yuklandi' })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!disabled && (
                          <DeleteButton
                            onClick={() => handleRemoveFile(fileName)}
                            title={t('form.remove')}
                          />
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Uploading Queue items */}
                  {uploadQueue.map((item) => {
                    const isError = item.state === 'error'
                    const isRunning = ['init', 'put', 'confirm'].includes(item.state)
                    return (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2 truncate max-w-[300px]" title={item.name}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-muted-foreground">{item.name}</span>
                            {isRunning && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {isError ? (
                            <span className="text-destructive font-semibold flex items-center gap-1">
                              {t('work_files.failed', { defaultValue: 'Xato' })}
                            </span>
                          ) : (
                            <span className="text-primary font-semibold flex items-center gap-1.5">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t('work_files.uploading', { defaultValue: 'Yuklanmoqda' })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {isError && (
                              <RefreshButton
                                onClick={() => handleRetryUpload(item.id)}
                                title={t('common.retry', { defaultValue: 'Qayta urinish' })}
                              />
                            )}
                            <DeleteButton
                              onClick={() => handleRemoveQueueItem(item.id)}
                              title={t('form.remove')}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
