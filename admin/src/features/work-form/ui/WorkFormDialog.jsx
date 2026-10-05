import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2, FileText, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  FieldError,
  toast,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { maskDigitsOnly } from '@shared/lib/input-masks'
import { createWorkForUser, updateWork, initAdminUpload, confirmAdminUpload, putToStorage } from '@/entities/work'
import { getUserById, getUsersGrid } from '@/entities/user'
import { useWorkTypeOptions } from '@/entities/dictionary'
import { maskShare } from '@shared/lib/input-masks'

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']

function isAllowedFile(file) {
  if (!file?.name) return false
  const ext = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext)
}

const emptyHolder = () => ({
  type: 'PHYSICAL',
  ownerType: 'AUTHOR',
  lastName: '',
  firstName: '',
  passportNo: '',
  sharePercentage: '',
  authorRoleIds: ['1'],
})

function holdersFromWork(work) {
  const rhs = work?.rightHolders || []
  if (!rhs.length) return [emptyHolder()]
  return rhs.map((rh) => ({
    type: rh.type || (rh.inn ? 'LEGAL' : 'PHYSICAL'),
    lastName: rh.lastName || '',
    firstName: rh.firstName || '',
    passportNo: rh.passportNo || rh.pinfl || rh.inn || '',
    sharePercentage: rh.sharePercentage != null ? String(rh.sharePercentage) : '',
    ownerType: rh.rightHolderType || rh.ownerType || 'AUTHOR',
    authorRoleIds: rh.authorRoleIds || rh.authorRoles || [],
    authorRoles: rh.authorRoles || rh.authorRoleIds || [],
  }))
}

/**
 * Create (mode='create', needs userId) or edit (mode='edit', needs work) a work
 * with a dynamic list of right holders. Returns the saved work via onDone.
 */
export default function WorkFormDialog({ mode = 'create', userId, work, open, onOpenChange, onDone }) {
  const { t } = useTranslation()
  const typeOptions = useWorkTypeOptions()

  const [name, setName] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [holders, setHolders] = useState([emptyHolder()])
  const [errors, setErrors] = useState({ holders: [] })
  const [submitting, setSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const [userDetails, setUserDetails] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [activeSearchField, setActiveSearchField] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [apiSearchResults, setApiSearchResults] = useState([])

  useEffect(() => {
    if (!open) return
    setSelectedFiles([])
    setUploadProgress({})
    setActiveSearchField(null)
    setSearchQuery('')
    setApiSearchResults([])

    if (mode === 'edit' && work) {
      setName(work.name || '')
      setWorkTypeId(work.workTypeId != null ? String(work.workTypeId) : '')
      setDescription(work.description || '')
      setHolders(holdersFromWork(work))
    } else {
      setName('')
      setWorkTypeId('')
      setDescription('')
      setHolders([emptyHolder()])
    }
    setErrors({ holders: [] })
    setSubmitting(false)

    // Pre-fetch recent users list for fast autocomplete search
    getUsersGrid({ page: 1, size: 50 })
      .then((res) => {
        setAllUsers(res?.items || [])
      })
      .catch(() => {})
  }, [open, mode, work])

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || q.length < 2) {
      setApiSearchResults([])
      setSearchLoading(false)
      return
    }

    let alive = true
    setSearchLoading(true)
    const isNum = /^\d+$/.test(q)
    const filters = isNum
      ? [{ field: 'pinfl', operator: 'lk', value: q }]
      : [{ field: 'lastName', operator: 'lk', value: q }]

    const timer = setTimeout(() => {
      getUsersGrid({ page: 1, size: 10, filters })
        .then((res) => {
          if (alive) setApiSearchResults(res?.items || [])
        })
        .catch(() => {
          if (alive) setApiSearchResults([])
        })
        .finally(() => {
          if (alive) setSearchLoading(false)
        })
    }, 250)

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [searchQuery])

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    const combinedMap = new Map()
    allUsers.forEach((u) => combinedMap.set(u.id, u))
    apiSearchResults.forEach((u) => combinedMap.set(u.id, u))

    const list = Array.from(combinedMap.values())
    return list
      .filter((u) => {
        const firstName = (u.firstName || '').toLowerCase()
        const lastName = (u.lastName || '').toLowerCase()
        const legalName = (u.legalName || '').toLowerCase()
        const pinfl = (u.pinfl || '').toLowerCase()
        const inn = (u.inn || '').toLowerCase()
        const passportSeria = (u.passportSeria || u.passportNo || '').toLowerCase()

        return (
          firstName.includes(q) ||
          lastName.includes(q) ||
          legalName.includes(q) ||
          pinfl.includes(q) ||
          inn.includes(q) ||
          passportSeria.includes(q)
        )
      })
      .slice(0, 8)
  }, [allUsers, apiSearchResults, searchQuery])

  const selectUserForHolder = (holderIdx, userItem) => {
    const isLegal = (userItem.subjectType || userItem.userType || userItem.type) === 'LEGAL'
    setHolders((hs) =>
      hs.map((h, idx) =>
        idx === holderIdx
          ? {
              ...h,
              type: isLegal ? 'LEGAL' : 'PHYSICAL',
              firstName: isLegal ? (userItem.legalName || userItem.firstName || '') : (userItem.firstName || ''),
              lastName: isLegal ? '' : (userItem.lastName || ''),
              passportNo: isLegal
                ? (userItem.inn || userItem.passportNo || userItem.pinfl || '')
                : (userItem.pinfl || userItem.passportSeria || userItem.passportNo || ''),
            }
          : h
      )
    )
    toast.success("Foydalanuvchi ma'lumotlari to'ldirildi")
  }

  const handleInputChange = (i, fieldName, value) => {
    setHolder(i, fieldName, value)
    if (i > 0) {
      setActiveSearchField({ index: i, fieldName })
      setSearchQuery(value)
    }
  }

  const clearHolder = (i) => {
    setHolders((hs) =>
      hs.map((h, idx) =>
        idx === i
          ? {
              ...h,
              firstName: '',
              lastName: '',
              passportNo: '',
              sharePercentage: '',
            }
          : h
      )
    )
    if (activeSearchField?.index === i) {
      setActiveSearchField(null)
      setSearchQuery('')
    }
    toast.info("Maydonlar tozalandi")
  }

  const renderUserSuggestions = (i, fieldName) => {
    if (
      activeSearchField?.index !== i ||
      activeSearchField?.fieldName !== fieldName ||
      searchQuery.trim().length < 2 ||
      filteredUsers.length === 0
    ) {
      return null
    }

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg text-popover-foreground">
        {filteredUsers.map((u) => {
          const uIsLegal = (u.subjectType || u.userType || u.type) === 'LEGAL'
          const name = uIsLegal
            ? (u.legalName || u.firstName || 'Tashkilot')
            : `${u.lastName || ''} ${u.firstName || ''}`.trim()
          const idNum = uIsLegal
            ? (u.inn || u.passportNo || u.pinfl)
            : (u.pinfl || u.passportSeria || u.passportNo)

          return (
            <button
              key={u.id}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                selectUserForHolder(i, u)
                setActiveSearchField(null)
                setSearchQuery('')
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground truncate">{name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {uIsLegal ? 'Yuridik shaxs' : 'Jismoniy shaxs'} {idNum ? `• ${idNum}` : ''}
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded">
                Tanlash
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    if (open && mode === 'create' && userId) {
      getUserById(userId)
        .then((data) => {
          setUserDetails(data)
          if (data) {
            const isLegal = data.userType === 'LEGAL'
            setHolders((hs) => {
              const copy = [...hs]
              copy[0] = {
                ...copy[0],
                type: isLegal ? 'LEGAL' : 'PHYSICAL',
                firstName: isLegal
                  ? (data.legalName || data.orgName || data.firstName || 'Tashkilot')
                  : (data.firstName || 'Test'),
                lastName: isLegal ? '' : (data.lastName || 'Foydalanuvchi'),
                passportNo: (isLegal
                  ? (data.inn || data.passportNo || data.pinfl)
                  : (data.pinfl || data.passportSeria || data.passportNo)) || '',
              }
              return copy
            })
          }
        })
        .catch((e) => {
          console.error('Failed to load user details:', e)
        })
    } else {
      setUserDetails(null)
    }
  }, [open, mode, userId])

  const shareTotal = useMemo(
    () => holders.reduce((sum, h) => sum + (Number(h.sharePercentage) || 0), 0),
    [holders]
  )

  const setHolder = (i, key, value) =>
    setHolders((hs) => hs.map((h, idx) => (idx === i ? { ...h, [key]: value } : h)))

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = files.filter(isAllowedFile)
    const invalid = files.filter((f) => !isAllowedFile(f))

    if (invalid.length > 0) {
      toast.error(t('work_files.reject_type', { name: invalid.map((f) => f.name).join(', ') }) || "Faqat pdf, doc, docx fayllari qabul qilinadi")
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid])
      setErrors((prev) => ({ ...prev, files: null }))
    }
  }

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const addHolder = () => setHolders((hs) => [...hs, emptyHolder()])
  const removeHolder = (i) => setHolders((hs) => hs.filter((_, idx) => idx !== i))

  function validate() {
    const errs = { holders: holders.map(() => ({})) }
    if (!name.trim()) {
      errs.name = { key: 'validation.field_required', params: { field: { key: 'work.form.name' } } }
    }
    if (!workTypeId) {
      errs.workTypeId = { key: 'validation.field_required', params: { field: { key: 'work.form.type' } } }
    }
    if (mode === 'create' && selectedFiles.length === 0) {
      errs.files = t('work.form.files_required')
    }
    holders.forEach((h, i) => {
      const isLegal = h.type === 'LEGAL'
      if (!isLegal) {
        if (!h.lastName.trim()) {
          errs.holders[i].lastName = { key: 'validation.field_required', params: { field: { key: 'user.form.last_name' } } }
        }
      }

      if (!h.firstName.trim()) {
        errs.holders[i].firstName = { key: 'validation.field_required', params: { field: { key: isLegal ? 'user.form.legal_name' : 'user.form.first_name' } } }
      }

      if (!h.passportNo.trim()) {
        errs.holders[i].passportNo = { key: 'validation.passport_required' }
      } else if (isLegal ? !/^\d{9}$/.test(h.passportNo.trim()) : !/^\d{14}$/.test(h.passportNo.trim())) {
        errs.holders[i].passportNo = { key: isLegal ? 'validation.inn_format' : 'validation.pinfl_format' }
      }

      if (isLegal) {
        const share = Number(h.sharePercentage)
        if (isNaN(share) || share < 0.01 || share > 100) {
          errs.holders[i].sharePercentage = { key: 'validation.share_min_legal', defaultValue: "Yuridik shaxs ulushi kamida 0.01% bo'lishi shart" }
        }
      } else if (h.sharePercentage !== '0') {
        const share = Number(h.sharePercentage)
        if (isNaN(share) || share <= 0 || share > 100) {
          errs.holders[i].sharePercentage = { key: 'validation.share_required' }
        }
      }
      if (Number(h.sharePercentage) === 0 && (isLegal || (h.ownerType || 'AUTHOR') !== 'AUTHOR')) {
        errs.holders[i].sharePercentage = { key: 'validation.share_zero_not_allowed' }
      }
      if (!h.authorRoleIds?.length) {
        errs.holders[i].authorRoleIds = { key: 'validation.role_required' }
      }
    })
    if (Math.round(shareTotal) !== 100) errs.shareTotal = { key: 'work.form.share_error' }
    setErrors(errs)
    const holderOk = errs.holders.every((e) => Object.keys(e).length === 0)
    return !errs.name && !errs.workTypeId && !errs.shareTotal && !errs.files && holderOk
  }

  function buildPayload() {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      workTypeId: Number(workTypeId),
      rightHolders: holders.map((h) => {
        const isLegal = h.type === 'LEGAL'
        const roles = (h.authorRoleIds || h.authorRoles || ['1']).map(Number).filter(Boolean)
        return isLegal
          ? {
              rightHolderType: h.ownerType || 'AUTHOR',
              subjectType: 'LEGAL',
              inn: (h.passportNo || '').trim(),
              legalName: (h.firstName || '').trim(),
              sharePercentage: Number(h.sharePercentage || 0),
              authorRoles: roles,
            }
          : {
              rightHolderType: h.ownerType || 'AUTHOR',
              subjectType: 'INDIVIDUAL',
              pinfl: (h.passportNo || '').trim(),
              firstName: (h.firstName || '').trim().toUpperCase(),
              lastName: (h.lastName || '').trim().toUpperCase(),
              sharePercentage: Number(h.sharePercentage || 0),
              authorRoles: roles,
            }
      }),
    }
  }

  async function onSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = buildPayload()
      const saved =
        mode === 'edit'
          ? await updateWork(work.id, payload)
          : await createWorkForUser(userId, payload)

      const targetWorkId = saved?.id ?? saved?.workId ?? work?.id

      if (selectedFiles.length > 0 && targetWorkId) {
        for (const file of selectedFiles) {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
          const { fileId, uploadUrl, requiredContentType } = await initAdminUpload(targetWorkId, {
            filename: file.name,
            sizeBytes: file.size,
          })

          await putToStorage(uploadUrl, file, requiredContentType, (progress) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
          })

          await confirmAdminUpload(targetWorkId, fileId)
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
        }
      }

      toast.success(t(mode === 'edit' ? 'work.form.updated_toast' : 'work.form.created_toast'))
      onOpenChange(false)
      onDone?.(saved)
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const he = (i, key) => errors.holders[i]?.[key]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t(mode === 'edit' ? 'work.form.edit_title' : 'work.form.create_title')}</DialogTitle>
          <DialogDescription>{t('work.form.desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>
              {t('work.form.name')}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className={errors.name ? 'border-destructive' : ''}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('work.form.type')}
              <span className="text-destructive"> *</span>
            </Label>
            <Select value={workTypeId} onValueChange={setWorkTypeId}>
              <SelectTrigger className={errors.workTypeId ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('work.form.select_type')} />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError error={errors.workTypeId} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('work.form.description')}</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
          </div>

          {/* Right holders */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>
                {t('work.rightholders')}
                <span className="text-destructive"> *</span>
              </Label>
              <span className={cn('text-[12px] font-medium', Math.round(shareTotal) === 100 ? 'text-success' : 'text-warning')}>
                {t('work.form.share_total', { total: shareTotal })}
              </span>
            </div>
            {errors.shareTotal && (
              <span className="text-[12px] font-medium text-destructive">{t('work.form.share_error')}</span>
            )}

            {holders.map((h, i) => {
              const isLocked = mode === 'create' && i === 0
              const isLegal = h.type === 'LEGAL'

              return (
                <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-foreground">
                        {t('work.form.holder', { n: i + 1 })}
                      </span>
                      {isLocked && (
                        <span className="text-[11px] font-medium text-muted-foreground ml-1">
                          ({t('form.holder_fill_ph', "Foydalanuvchi")})
                        </span>
                      )}

                      <Select
                        value={h.type || 'PHYSICAL'}
                        onValueChange={(val) => {
                          setHolder(i, 'type', val)
                          setHolder(i, 'passportNo', '')
                          setHolder(i, 'firstName', '')
                          setHolder(i, 'lastName', '')
                        }}
                        disabled={submitting || isLocked}
                      >
                        <SelectTrigger className="h-7 w-[130px] text-[11.5px] font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHYSICAL">{t('user.form.individual', 'Jismoniy shaxs')}</SelectItem>
                          <SelectItem value="LEGAL">{t('user.form.legal', 'Yuridik shaxs')}</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={h.ownerType || 'AUTHOR'}
                        onValueChange={(value) => setHolder(i, 'ownerType', value)}
                        disabled={submitting}
                      >
                        <SelectTrigger className="h-7 w-[118px] text-[11.5px] font-semibold bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTHOR">Muallif</SelectItem>
                          <SelectItem value="HEIR">Voris</SelectItem>
                          <SelectItem value="OTHER">Boshqa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isLocked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => clearHolder(i)}
                          title="Maydonlarni tozalash"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Tozalash
                        </Button>
                      )}

                      {holders.length > 1 && i > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeHolder(i)}
                          aria-label={t('work.form.remove_holder')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* PassportNo / PINFL / INN */}
                    <div className="relative flex flex-col gap-1">
                      <Label className="text-[12px] font-semibold">
                        {isLegal ? 'STIR (INN)' : 'JShShIR (PINFL)'}
                      </Label>
                      <Input
                        placeholder={isLegal ? '123456789' : '12345678901234'}
                        value={h.passportNo}
                        onFocus={() => {
                          if (i > 0 && h.passportNo) {
                            setActiveSearchField({ index: i, fieldName: 'passportNo' })
                            setSearchQuery(h.passportNo)
                          }
                        }}
                        onChange={(e) => {
                          const val = maskDigitsOnly(e.target.value).slice(0, isLegal ? 9 : 14)
                          handleInputChange(i, 'passportNo', val)
                        }}
                        disabled={submitting || isLocked}
                        maxLength={isLegal ? 9 : 14}
                        className={cn('font-mono', he(i, 'passportNo') && 'border-destructive')}
                      />
                      {renderUserSuggestions(i, 'passportNo')}
                      <FieldError error={he(i, 'passportNo')} />
                    </div>

                    {/* First name / Org name */}
                    <div className={cn("relative flex flex-col gap-1", isLegal && "sm:col-span-2")}>
                      <Label className="text-[12px] font-semibold">
                        {isLegal ? 'Tashkilot nomi' : 'Ism'}
                      </Label>
                      <Input
                        placeholder={isLegal ? 'OOO Uzintellekt' : t('user.form.first_name')}
                        value={h.firstName}
                        onFocus={() => {
                          if (i > 0 && h.firstName) {
                            setActiveSearchField({ index: i, fieldName: 'firstName' })
                            setSearchQuery(h.firstName)
                          }
                        }}
                        onChange={(e) => handleInputChange(i, 'firstName', e.target.value)}
                        disabled={submitting || isLocked}
                        className={he(i, 'firstName') ? 'border-destructive' : ''}
                      />
                      {renderUserSuggestions(i, 'firstName')}
                      <FieldError error={he(i, 'firstName')} />
                    </div>

                    {/* Last name (only for Physical) */}
                    {!isLegal && (
                      <div className="relative flex flex-col gap-1">
                        <Label className="text-[12px] font-semibold">Familiya</Label>
                        <Input
                          placeholder={t('user.form.last_name')}
                          value={h.lastName}
                          onFocus={() => {
                            if (i > 0 && h.lastName) {
                              setActiveSearchField({ index: i, fieldName: 'lastName' })
                              setSearchQuery(h.lastName)
                            }
                          }}
                          onChange={(e) => handleInputChange(i, 'lastName', e.target.value)}
                          disabled={submitting || isLocked}
                          className={he(i, 'lastName') ? 'border-destructive' : ''}
                        />
                        {renderUserSuggestions(i, 'lastName')}
                        <FieldError error={he(i, 'lastName')} />
                      </div>
                    )}

                    {/* Share % + Ulushsiz checkbox */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-[12px] font-semibold">{t('work.form.share', 'Ulush (%)')}</Label>
                        {!isLegal && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Checkbox
                              id={`holder-field-${i}-no-share`}
                              checked={h.sharePercentage === '0'}
                              onCheckedChange={(checked) => {
                                setHolder(i, 'sharePercentage', checked ? '0' : '')
                              }}
                              disabled={submitting}
                            />
                            <label
                              htmlFor={`holder-field-${i}-no-share`}
                              className="text-[11.5px] font-medium leading-none cursor-pointer text-muted-foreground select-none hover:text-foreground transition-colors"
                            >
                              Ulushsiz
                            </label>
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={t('work.form.share')}
                        value={h.sharePercentage === '0' ? '0' : (h.sharePercentage ?? '')}
                        onChange={(e) => {
                          setHolder(i, 'sharePercentage', maskShare(e.target.value))
                        }}
                        disabled={submitting || (!isLegal && h.sharePercentage === '0')}
                        className={he(i, 'sharePercentage') ? 'border-destructive' : ''}
                      />
                      <FieldError error={he(i, 'sharePercentage')} />
                    </div>
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHolder}
              disabled={submitting || shareTotal >= 100}
              className="w-fit"
            >
              <Plus className="h-4 w-4" />
              {t('work.form.add_holder')}
            </Button>
          </div>

          {/* Files Upload Section */}
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Label className="flex items-center gap-1 font-semibold text-foreground">
              {t('work.files')}
              {mode === 'create' && <span className="text-destructive"> *</span>}
            </Label>
            <div className="flex flex-col gap-2">
              <input
                id="admin-work-file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('admin-work-file-input')?.click()}
                disabled={submitting}
                className="w-full border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                {t('work.form.select_files')}
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <ul className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadProgress[file.name] !== undefined && (
                        <span className="text-[11.5px] font-medium text-muted-foreground whitespace-nowrap">
                          {uploadProgress[file.name]}%
                        </span>
                      )}
                      {!submitting && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeSelectedFile(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errors.files && (
              <span className="text-[12px] font-medium text-destructive">{errors.files}</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t(mode === 'edit' ? 'user.form.save' : 'work.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
