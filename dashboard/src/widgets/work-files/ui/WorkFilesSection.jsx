import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  File,
  FileWarning,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import {
  listWorkFiles,
  getStorageQuota,
  getDownloadUrl,
  deleteWorkFile,
  visibleWorkFiles,
  hasUploadedFile,
  formatBytes,
  WORK_FILE_STATUS,
} from '@/entities/work-file'
import { useUploadQueue, UPLOAD_STATE } from '@/features/work-file-upload'
import { apiErrorMessage } from '@shared/lib/api-error'
import {
  Button,
  Skeleton,
  EmptyState,
  toast,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import QuotaBar from './QuotaBar'
import UploadDropzone from './UploadDropzone'

const STATE_LABEL = {
  [UPLOAD_STATE.QUEUED]: 'queued',
  [UPLOAD_STATE.INIT]: 'uploading',
  [UPLOAD_STATE.PUT]: 'uploading',
  [UPLOAD_STATE.CONFIRM]: 'uploading',
  [UPLOAD_STATE.DONE]: 'done',
  [UPLOAD_STATE.ERROR]: 'failed',
}

function QueueItemRow({ item, onRetry, onRemove, t, units }) {
  const isError = item.state === UPLOAD_STATE.ERROR
  const isRunning =
    item.state === UPLOAD_STATE.INIT ||
    item.state === UPLOAD_STATE.PUT ||
    item.state === UPLOAD_STATE.CONFIRM

  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-2">
        {isRunning ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        ) : (
          <File className={cn('h-4 w-4 shrink-0', isError ? 'text-destructive' : 'text-muted-foreground')} />
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{item.name}</span>
        <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
          {formatBytes(item.size, { units })}
        </span>
        {isError && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onRetry(item.localId)}
            aria-label={t('work_files.retry')}
          >
            <RefreshCw />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.localId)}
          aria-label={t('work_files.remove')}
        >
          <X />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', isError ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${isError ? 100 : item.progress}%` }}
          />
        </div>
        <span className={cn('w-16 shrink-0 text-right text-[11px]', isError ? 'text-destructive' : 'text-muted-foreground')}>
          {isError ? t('work_files.failed') : t(`work_files.${STATE_LABEL[item.state] || 'queued'}`)}
        </span>
      </div>
      {isError && (item.errorCode || item.error) && (
        <p className="text-[11px] text-destructive">
          {apiErrorMessage(
            { apiError: { errorCode: item.errorCode }, message: item.error, status: item.errorStatus },
            t,
            'work_files.upload_error'
          )}
        </p>
      )}
    </li>
  )
}

/**
 * Files section for a work. Editable (dropzone + queue + delete) when !readOnly;
 * read-only (list + download) otherwise. init/list require an existing workId.
 */
export default function WorkFilesSection({
  workId,
  readOnly = false,
  initialFiles = null,
  onUploadedChange,
}) {
  const { t } = useTranslation()
  const units = t('work_files.units').split(',')

  const [files, setFiles] = useState([])
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      setError(false)
      try {
        // Quota only matters where uploads are possible — skip it in read-only.
      const [list, q] = await Promise.all([
        listWorkFiles(workId),
        readOnly ? Promise.resolve(null) : getStorageQuota(),
      ])
        setFiles(visibleWorkFiles(list))
        setQuota(q)
      } catch {
        if (!silent) setError(true)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [workId, readOnly]
  )

  useEffect(() => {
    load()
  }, [load])

  // Tell the parent whether submit is allowed (≥1 UPLOADED file).
  useEffect(() => {
    onUploadedChange?.(hasUploadedFile(files))
  }, [files, onUploadedChange])

  const handleFileDone = useCallback(() => load({ silent: true }), [load])

  const { items, addFiles, retry, remove } = useUploadQueue(workId, {
    remainingBytes: quota?.remainingBytes ?? Infinity,
    onFileDone: handleFileDone,
  })

  const handleFiles = (fileList) => {
    const { rejected } = addFiles(fileList)
    rejected.forEach((r) => toast.error(t(`work_files.reject_${r.reason}`, { name: r.name })))
  }

  // Files handed in from the parent (e.g. dropped on a brand-new work before it
  // had an id) are enqueued once on mount.
  const initialConsumed = useRef(false)
  useEffect(() => {
    if (initialConsumed.current) return
    if (initialFiles && initialFiles.length) {
      initialConsumed.current = true
      handleFiles(initialFiles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles])

  const handleDownload = async (file) => {
    try {
      const { downloadUrl } = await getDownloadUrl(workId, file.fileId)
      window.open(downloadUrl, '_blank', 'noopener')
    } catch (e) {
      toast.error(apiErrorMessage(e, t, 'work_files.download_error'))
    }
  }

  const deleteFileDirect = async (file) => {
    if (!file) return
    try {
      await deleteWorkFile(workId, file.fileId)
      toast.success(t('work_files.deleted'))
      load({ silent: true })
    } catch (e) {
      toast.error(apiErrorMessage(e, t, 'work_files.delete_error'))
    }
  }

  const confirmDelete = () => {
    const file = pendingDelete
    setPendingDelete(null)
    deleteFileDirect(file)
  }

  // EXPIRED files are already gone from storage — removing the stale tombstone
  // needs no confirmation. Real (UPLOADED) files go through the confirm dialog.
  const requestDelete = (file) => {
    if (file.status === WORK_FILE_STATUS.EXPIRED) deleteFileDirect(file)
    else setPendingDelete(file)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  // Read-only view has nothing to do but retry, so a load failure takes the whole
  // section. In edit mode we keep the dropzone usable and show the error inline,
  // so a transient list error never strands the user from uploading.
  if (error && readOnly) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-8 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-[13.5px] text-destructive">{t('work_files.load_error')}</p>
        <Button variant="outline" size="sm" onClick={() => load()}>
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  const activeItems = items.filter((i) => i.state !== UPLOAD_STATE.DONE)
  const isEmpty = files.length === 0 && activeItems.length === 0

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[13px] text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t('work_files.load_error')}
          </span>
          <Button variant="outline" size="sm" onClick={() => load()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!readOnly && quota && <QuotaBar used={quota.usedBytes} limit={quota.limitBytes} />}

      {!readOnly && <UploadDropzone onFiles={handleFiles} />}

      {!readOnly && activeItems.length > 0 && (
        <ul className="space-y-2">
          {activeItems.map((item) => (
            <QueueItemRow
              key={item.localId}
              item={item}
              onRetry={retry}
              onRemove={remove}
              t={t}
              units={units}
            />
          ))}
        </ul>
      )}

      {isEmpty ? (
        <EmptyState
          icon={FolderOpen}
          size="sm"
          title={t('work_files.empty_title')}
          description={readOnly ? t('work_files.empty_desc_readonly') : t('work_files.empty_desc')}
        />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {files.map((file) => {
            const expired = file.status === WORK_FILE_STATUS.EXPIRED
            return (
              <li key={file.fileId} className="flex items-center gap-3 px-3 py-2.5">
                {expired ? (
                  <FileWarning className="h-4 w-4 shrink-0 text-warning" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      'truncate text-[13.5px]',
                      expired ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}
                  >
                    {file.filename}
                  </span>
                  {expired && (
                    <span className="text-[11px] text-warning">{t('work_files.expired')}</span>
                  )}
                </div>
                {!expired && (
                  <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                    {formatBytes(file.sizeBytes, { units })}
                  </span>
                )}
                {!expired && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleDownload(file)}
                    aria-label={t('work_files.download')}
                  >
                    <Download />
                  </Button>
                )}
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => requestDelete(file)}
                    aria-label={t('work_files.delete')}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="min-w-0 overflow-hidden">
            <AlertDialogTitle>{t('work_files.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="min-w-0 space-y-2 text-sm text-muted-foreground">
                <p>{t('work_files.delete_confirm_desc_prefix')}</p>
                <p className="break-all rounded-md border border-border bg-muted/60 px-3 py-2 font-medium text-foreground">
                  {pendingDelete?.filename}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t('work_files.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
