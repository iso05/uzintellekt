// src/pages/Works/WorksList.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../services/api'
import {
  adminGetWorks,
  adminDecideWork,
  adminCancelWork,
  adminSubmitWork,
  adminUpdateWork,
} from '../../services/adminWorksApi'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  RiFileTextLine,
  RiSearchLine,
  RiRefreshLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiUserLine,
  RiAddLine,
  RiDeleteBinLine,
  RiAlertLine,
  RiSendPlane2Line,
} from 'react-icons/ri'
import FieldError from '../../components/FieldError'
import { maskName, maskPassport, maskShare } from '../../utils/inputMasks'
import {
  validatePassport,
  validateName,
  validateShare,
} from '../../utils/validators'

const STATE_CONFIG = {
  DRAFT: {
    label: 'Qoralama',
    bg: '#EEF1F6',
    color: '#5A6478',
    border: '#C5CDD8',
  },
  PENDING: {
    label: "Ko'rib chiqilmoqda",
    bg: '#FEF5E7',
    color: '#C8922A',
    border: '#F0C060',
  },
  REGISTERED: {
    label: 'Tasdiqlangan',
    bg: '#E8F5EE',
    color: '#2E7D32',
    border: '#7DCB9E',
  },
  APPROVED: {
    label: 'Tasdiqlangan',
    bg: '#E8F5EE',
    color: '#2E7D32',
    border: '#7DCB9E',
  },
  REJECTED: {
    label: 'Rad etilgan',
    bg: '#FDEEEE',
    color: '#C0392B',
    border: '#F5AAAA',
  },
  CANCELLED: {
    label: 'Bekor qilingan',
    bg: '#F0F0F0',
    color: '#9AA5B8',
    border: '#D0D7E2',
  },
}

function StatusBadge({ status }) {
  const cfg = STATE_CONFIG[status] || {
    label: status || 'Noma’lum',
    bg: '#f8fafc',
    color: '#94a3b8',
    border: '#e2e8f0',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  )
}

const EMPTY_HOLDER = {
  passportNo: '',
  firstName: '',
  lastName: '',
  sharePercentage: '',
  authorRoles: [],
}

const formatDateTime = (dateStr) => {
  return dateStr || '—'
}

const M = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  box: {
    width: '100%',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'fadeUp 0.25s ease both',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    transition: 'background-color 0.2s',
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '13.5px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
    display: 'block',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  saveBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    color: '#fff',
    background: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
}

export default function WorksList() {
  const { theme } = useTheme()
  const { user: _user } = useAuth()
  const isDark = theme === 'dark'
  const tableRef = useRef(null)

  const [works, setWorks] = useState([])
  const [workTypes, setWorkTypes] = useState([])
  const [authorRoles, setAuthorRoles] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1) // 1-based page index as per Swagger spec
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Toasts
  const [toasts, setToasts] = useState([])

  // Modal / Action States
  const [actionLoading, setActionLoading] = useState(false)
  const [detailWork, setDetailWork] = useState(null)

  // Reject Modal
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState(null)

  // Confirm Dialog Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false,
    onConfirm: null,
    error: null,
  })

  // Edit Modal State
  const [editingWork, setEditingWork] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    workTypeId: '',
    rightHolders: [],
  })
  const [editError, setEditError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [openRolesDropdownIdx, setOpenRolesDropdownIdx] = useState(null)

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    if (type === 'success') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleApiError = useCallback(
    (err, fallbackMsg = 'Xatolik yuz berdi.') => {
      console.error(err)
      if (err.response) {
        const status = err.response.status
        const data = err.response.data

        if (status === 400) {
          const msg = data?.errorMessage || fallbackMsg
          addToast('error', msg)
          return msg
        } else if (status === 422) {
          const msg = Array.isArray(data?.errors)
            ? data.errors
                .map((e) => e.message || e.defaultMessage || JSON.stringify(e))
                .join(', ')
            : data?.errorMessage || 'Kiritilgan ma’lumotlar xato.'
          addToast('error', msg)
          return msg
        } else {
          const msg =
            data?.errorMessage || data?.message || `Server xatosi: ${status}`
          addToast('error', msg)
          return msg
        }
      } else if (err.request) {
        const msg = "Server bilan aloqa yo'q. Qaytadan urinib ko'ring."
        addToast('error', msg)
        return msg
      } else {
        const msg = err.message || fallbackMsg
        addToast('error', msg)
        return msg
      }
    },
    [addToast]
  )

  // Fetch dictionaries
  useEffect(() => {
    Promise.all([
      api.get('/api/v1/dictionaries/work-types').catch(() => ({ data: [] })),
      api.get('/api/v1/dictionaries/author-roles').catch(() => ({ data: [] })),
    ])
      .then(([wtRes, arRes]) => {
        setWorkTypes(wtRes.data?.content ?? wtRes.data ?? [])
        setAuthorRoles(arRes.data?.content ?? arRes.data ?? [])
      })
      .catch(() => {
        addToast('error', 'Lug’atlarni yuklashda xatolik yuz berdi.')
      })
  }, [addToast])

  // Load grid data
  const load = useCallback(
    async (currentPage, size, stateFilter, searchQuery, startDate, endDate) => {
      setLoading(true)
      try {
        const filters = []
        if (stateFilter) {
          filters.push({ field: 'state', operator: 'eq', value: stateFilter })
        }
        if (searchQuery && searchQuery.trim()) {
          filters.push({
            field: 'name',
            operator: 'lk',
            value: searchQuery.trim(),
          })
        }
        if (startDate && endDate) {
          filters.push({
            field: 'registrationDate',
            operator: 'bt',
            value: `${startDate}:${endDate}`,
          })
        } else if (startDate) {
          filters.push({
            field: 'registrationDate',
            operator: 'ge',
            value: startDate,
          })
        } else if (endDate) {
          filters.push({
            field: 'registrationDate',
            operator: 'le',
            value: endDate,
          })
        }

        const data = await adminGetWorks({
          page: currentPage,
          size: size,
          filters,
          sort: { selector: 'createdAt', desc: true },
        })

        setWorks(data?.items ?? data?.content ?? [])
        setTotal(data?.totalItems ?? data?.totalElements ?? 0)
        setTotalPages(
          data?.totalPages ?? Math.ceil((data?.totalItems ?? 0) / size) ?? 0
        )
      } catch (e) {
        handleApiError(e, 'Asarlarni yuklashda xatolik yuz berdi.')
      } finally {
        setLoading(false)
      }
    },
    [handleApiError]
  )

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedSearch, filterState, filterStartDate, filterEndDate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(
      page,
      pageSize,
      filterState,
      debouncedSearch,
      filterStartDate,
      filterEndDate
    )
  }, [
    page,
    pageSize,
    filterState,
    debouncedSearch,
    filterStartDate,
    filterEndDate,
    load,
  ])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleApplyFilters = () => {
    setPage(1)
    load(1, pageSize, filterState, search, filterStartDate, filterEndDate)
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilterState('')
    setFilterStartDate('')
    setFilterEndDate('')
    setPage(1)
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  const handleFilterStateChange = (e) => {
    setFilterState(e.target.value)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  const filteredWorks = works

  // Approve work trigger
  const handleApproveTrigger = (w) => {
    setConfirmModal({
      isOpen: true,
      title: 'Asarni tasdiqlash',
      message: 'Asarni tasdiqlashni xohlaysizmi?',
      confirmText: 'Tasdiqlash',
      isDestructive: false,
      onConfirm: async () => {
        setActionLoading(true)
        setConfirmModal((prev) => ({ ...prev, error: null }))
        try {
          await adminDecideWork(w.id, 'APPROVE')
          addToast('success', 'Asar muvaffaqiyatli tasdiqlandi ✓')
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          load(
            page,
            pageSize,
            filterState,
            debouncedSearch,
            filterStartDate,
            filterEndDate
          )
        } catch (e) {
          const msg = handleApiError(
            e,
            'Asarni tasdiqlashda xatolik yuz berdi.'
          )
          setConfirmModal((prev) => ({ ...prev, error: msg }))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  // Reject modal open
  const handleRejectTrigger = (w) => {
    setRejectingId(w.id)
    setRejectReason('')
    setRejectError(null)
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) return

    setActionLoading(true)
    setRejectError(null)
    try {
      await adminDecideWork(rejectingId, 'REJECT', rejectReason.trim())
      addToast('success', 'Asar rad etildi')
      setRejectingId(null)
      setRejectReason('')
      load(
        page,
        pageSize,
        filterState,
        debouncedSearch,
        filterStartDate,
        filterEndDate
      )
    } catch (err) {
      const msg = handleApiError(err, 'Asarni rad etishda xatolik yuz berdi.')
      setRejectError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // Cancel work trigger
  const handleCancelTrigger = (w) => {
    setConfirmModal({
      isOpen: true,
      title: 'Asarni bekor qilish',
      message: (
        <div>
          Diqqat! Bu asarni bekor qilmoqchimisiz?
          <br />
          Bekor qilingan asar qayta tiklanmaydi.
        </div>
      ),
      confirmText: 'Ha, bekor qilish',
      isDestructive: true,
      onConfirm: async () => {
        setActionLoading(true)
        setConfirmModal((prev) => ({ ...prev, error: null }))
        try {
          await adminCancelWork(w.id)
          addToast('success', 'Asar bekor qilindi')
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          load(
            page,
            pageSize,
            filterState,
            debouncedSearch,
            filterStartDate,
            filterEndDate
          )
        } catch (e) {
          const msg = handleApiError(
            e,
            'Asarni bekor qilishda xatolik yuz berdi.'
          )
          setConfirmModal((prev) => ({ ...prev, error: msg }))
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  // Submit work trigger
  const handleSubmitTrigger = async (w) => {
    if (!confirm("Asarni ko'rib chiqishga yuborasizmi?")) return
    setActionLoading(true)
    try {
      await adminSubmitWork(w.id)
      addToast('success', "Asar ko'rib chiqishga yuborildi")
      load(
        page,
        pageSize,
        filterState,
        debouncedSearch,
        filterStartDate,
        filterEndDate
      )
    } catch (e) {
      handleApiError(e, 'Asarni yuborishda xatolik yuz berdi.')
    } finally {
      setActionLoading(false)
    }
  }

  // Edit modal open & save
  const handleOpenEdit = (w) => {
    setEditingWork(w)
    setEditError(null)
    setFieldErrors({})
    setEditForm({
      name: w.name || '',
      description: w.description || '',
      workTypeId: w.workTypeId || w.workType?.id || '',
      rightHolders:
        w.rightHolders && w.rightHolders.length > 0
          ? w.rightHolders.map((rh) => ({
              passportNo: rh.passportNo || rh.passportSeria || '',
              firstName: rh.firstName || '',
              lastName: rh.lastName || '',
              sharePercentage: String(rh.sharePercentage || rh.share || ''),
              authorRoles: rh.authorRoleIds ? rh.authorRoleIds.map(String) : [],
            }))
          : [{ ...EMPTY_HOLDER }],
    })
  }

  const handleAddHolder = () => {
    setEditForm((f) => ({
      ...f,
      rightHolders: [...f.rightHolders, { ...EMPTY_HOLDER }],
    }))
  }

  const handleRemoveHolder = (idx) => {
    if (editForm.rightHolders.length <= 1) {
      alert("Kamida bitta haq egasi bo'lishi shart.")
      return
    }
    setEditForm((f) => {
      const rh = [...f.rightHolders]
      rh.splice(idx, 1)
      return { ...f, rightHolders: rh }
    })
    setFieldErrors((prev) => {
      const copy = { ...prev }
      Object.keys(copy).forEach((k) => {
        if (k.startsWith(`rightHolders[${idx}]`)) {
          delete copy[k]
        }
      })
      return copy
    })
  }

  const handleFieldBlur = (idx, key, val) => {
    let err = null
    if (key === 'passportNo') {
      err = validatePassport(val)
    } else if (key === 'firstName') {
      err = validateName(val, 'Ism')
    } else if (key === 'lastName') {
      err = validateName(val, 'Familiya')
    } else if (key === 'sharePercentage') {
      err = validateShare(val)
    }

    const fieldKey = `rightHolders[${idx}].${key}`
    setFieldErrors((prev) => {
      const copy = { ...prev }
      if (err) {
        copy[fieldKey] = err
      } else {
        delete copy[fieldKey]
      }
      return copy
    })
  }

  const handleHolderFieldChange = (idx, key, val) => {
    setEditForm((f) => {
      const rh = [...f.rightHolders]
      let finalVal = val
      if (key === 'passportNo') {
        finalVal = maskPassport(val)
      } else if (key === 'firstName' || key === 'lastName') {
        finalVal = maskName(val)
      } else if (key === 'sharePercentage') {
        finalVal = maskShare(val)
        const sumOther = rh.reduce((sum, item, i) => {
          if (i === idx) return sum
          return sum + (Number(item.sharePercentage) || 0)
        }, 0)
        const maxAllowed = Math.max(0, 100 - sumOther)
        const numVal = Number(finalVal)
        if (!isNaN(numVal) && numVal > maxAllowed) {
          finalVal = String(Number(maxAllowed.toFixed(4)))
        }
      }
      rh[idx] = { ...rh[idx], [key]: finalVal }
      return { ...f, rightHolders: rh }
    })

    const fieldKey = `rightHolders[${idx}].${key === 'sharePercentage' ? 'sharePercentage' : key === 'authorRoles' ? 'authorRoles' : key}`
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy[fieldKey]
      return copy
    })
  }

  const _handleHolderRoleSelect = (idx, e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
    setEditForm((f) => {
      const rh = [...f.rightHolders]
      rh[idx] = { ...rh[idx], authorRoles: selected }
      return { ...f, rightHolders: rh }
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError(null)
    setFieldErrors({})

    const errors = {}

    // Front validation
    if (!editForm.name.trim()) {
      errors['name'] = 'Asar nomi kiritilishi shart'
    }
    if (!editForm.workTypeId) {
      errors['workTypeId'] = 'Asar turini tanlang'
    }

    const totalShare = editForm.rightHolders.reduce(
      (sum, rh) => sum + (Number(rh.sharePercentage) || 0),
      0
    )
    let totalShareErr = null
    if (Math.abs(totalShare - 100) > 0.0001) {
      totalShareErr = `Jami ulush 100% bo'lishi shart. Hozirgi: ${totalShare}%`
      setEditError(totalShareErr)
    }

    editForm.rightHolders.forEach((rh, idx) => {
      const passportErr = validatePassport(rh.passportNo)
      if (passportErr) errors[`rightHolders[${idx}].passportNo`] = passportErr

      const firstNameErr = validateName(rh.firstName, 'Ism')
      if (firstNameErr) errors[`rightHolders[${idx}].firstName`] = firstNameErr

      const lastNameErr = validateName(rh.lastName, 'Familiya')
      if (lastNameErr) errors[`rightHolders[${idx}].lastName`] = lastNameErr

      const shareErr = validateShare(rh.sharePercentage)
      if (shareErr) errors[`rightHolders[${idx}].sharePercentage`] = shareErr

      if (!rh.authorRoles || rh.authorRoles.length === 0) {
        errors[`rightHolders[${idx}].authorRoles`] =
          'Kamida bitta muallif roli tanlang'
      }
    })

    if (Object.keys(errors).length > 0 || totalShareErr) {
      setFieldErrors(errors)
      let targetId = ''
      const firstKey = Object.keys(errors)[0]
      if (firstKey) {
        if (firstKey.includes('rightHolders')) {
          const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
          if (match) {
            targetId = `edit-holder-field-${match[1]}-${match[2]}`
          }
        } else {
          targetId = `edit-form-field-${firstKey}`
        }
      } else if (totalShareErr) {
        targetId = `edit-share-total-bar`
      }

      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setActionLoading(true)
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        workTypeId: Number(editForm.workTypeId),
        rightHolders: editForm.rightHolders.map((rh) => ({
          passportNo: rh.passportNo.trim(),
          firstName: rh.firstName.trim(),
          lastName: rh.lastName.trim(),
          sharePercentage: Number(rh.sharePercentage),
          authorRoles: rh.authorRoles.map(Number),
        })),
      }

      await adminUpdateWork(editingWork.id, payload)
      addToast('success', 'Asar muvaffaqiyatli tahrirlandi')
      setEditingWork(null)
      load(
        page,
        pageSize,
        filterState,
        debouncedSearch,
        filterStartDate,
        filterEndDate
      )
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        Array.isArray(err.response.data.errors)
      ) {
        const mappedErrors = {}
        err.response.data.errors.forEach((apiErr) => {
          if (apiErr.fieldName) {
            let uzMsg = apiErr.message || apiErr.defaultMessage || 'Xatolik'
            if (uzMsg.toLowerCase().includes('passport')) {
              uzMsg = "Pasport seriya/raqami noto'g'ri (AA1234567 formatida)"
            } else if (
              uzMsg.toLowerCase().includes('firstname') ||
              uzMsg.toLowerCase().includes('first name')
            ) {
              uzMsg = 'Ism kiritilishi shart'
            } else if (
              uzMsg.toLowerCase().includes('lastname') ||
              uzMsg.toLowerCase().includes('last name')
            ) {
              uzMsg = 'Familiya kiritilishi shart'
            } else if (uzMsg.toLowerCase().includes('share')) {
              uzMsg = "Ulush 0.01 dan 100 gacha bo'lishi kerak"
            }
            mappedErrors[apiErr.fieldName] = uzMsg
          }
        })
        setFieldErrors(mappedErrors)

        const firstKey = Object.keys(mappedErrors)[0]
        let targetId = ''
        if (firstKey) {
          if (firstKey.includes('rightHolders')) {
            const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
            if (match) {
              targetId = `edit-holder-field-${match[1]}-${match[2]}`
            }
          } else {
            targetId = `edit-form-field-${firstKey}`
          }
          const el = document.getElementById(targetId)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      } else {
        const msg = handleApiError(
          err,
          'Asarni tahrirlashda xatolik yuz berdi.'
        )
        setEditError(msg)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const getWorkTypeName = (id) => {
    const typeObj = workTypes.find((t) => Number(t.id) === Number(id))
    return (
      typeObj?.localizedName?.uz ||
      typeObj?.localizedName?.ru ||
      typeObj?.localizedName?.en ||
      '—'
    )
  }

  const getAuthorRoleNames = (ids) => {
    if (!ids || ids.length === 0) return '—'
    return ids
      .map((roleId) => {
        const roleObj = authorRoles.find((r) => Number(r.id) === Number(roleId))
        return (
          roleObj?.localizedName?.uz ||
          roleObj?.localizedName?.ru ||
          roleObj?.localizedName?.en ||
          '—'
        )
      })
      .join(', ')
  }

  // Theme-sensitive styles
  const textColor = isDark ? '#f1f2f6' : '#111827'
  const textSecondary = isDark ? '#9094a8' : '#4b5563'
  const border = isDark ? '#2a2d3a' : '#e2e4ec'
  const cardBg = isDark ? '#1a1d27' : '#ffffff'
  const altRowBg = isDark ? '#202432' : '#f8fafc'
  const tableHeaderBg = isDark ? '#13161f' : '#f1f5f9'
  const hoverRowBg = isDark ? '#272b3c' : '#f1f5f9'
  const inputBg = isDark ? '#242838' : '#FAFBFD'

  const S = {
    page: {
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    toolbar: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    searchContainer: {
      display: 'flex',
      flex: 1,
      minWidth: 300,
      maxWidth: 400,
      borderRadius: 8,
      border: `1px solid ${border}`,
      overflow: 'hidden',
    },
    searchWrap: { position: 'relative', flex: 1 },
    searchIcon: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
    },
    searchInput: {
      width: '100%',
      padding: '9px 12px 9px 36px',
      border: 'none',
      fontSize: 13.5,
      outline: 'none',
      background: cardBg,
      color: textColor,
      fontFamily: 'inherit',
    },

    filtersRow: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    filterLabel: {
      fontSize: 9.5,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    },
    filterSelect: {
      padding: '8px 12px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textColor,
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      minWidth: 140,
    },
    applyBtn: {
      padding: '8px 16px',
      borderRadius: 8,
      border: 'none',
      background: 'var(--accent)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    },
    clearBtn: {
      padding: '8px 16px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textSecondary,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    },
    refreshBtn: {
      padding: '8px 12px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textSecondary,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorBox: { padding: '10px 14px', borderRadius: 8 },

    card: {
      background: cardBg,
      borderRadius: 16,
      border: `1px solid ${border}`,
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
      animation: 'fadeUp .3s ease both',
    },
    center: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '70px 20px',
      gap: 4,
    },
    spinner: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: `3px solid ${border}`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite',
    },

    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      borderBottom: `1px solid ${border}`,
      whiteSpace: 'nowrap',
      background: tableHeaderBg,
    },
    td: {
      padding: '13px 14px',
      fontSize: 13.5,
      color: textColor,
      borderBottom: `1px solid ${border}`,
    },

    typeBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      background: isDark ? '#1e293b' : '#e0f2fe',
      color: isDark ? '#38bdf8' : '#0369a1',
    },

    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: `1px solid ${border}`,
      flexWrap: 'wrap',
      gap: 8,
    },
    pageBtn: {
      width: 30,
      height: 30,
      borderRadius: 7,
      border: `1px solid ${border}`,
      background: cardBg,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
    },
    pageBtnActive: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },

    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px 20px',
    },
    detailItem: { display: 'flex', flexDirection: 'column', gap: 4 },
    detailLabel: {
      fontSize: 11,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.4px',
      fontWeight: 600,
    },
    detailVal: { fontSize: 13.5, fontWeight: 600, color: textColor },
    holderBox: {
      padding: '10px 14px',
      border: `1px solid ${border}`,
      borderRadius: '6px',
      background: altRowBg,
    },

    editRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px 16px',
    },
    formField: { display: 'flex', flexDirection: 'column', gap: 6 },
    formLabel: { fontSize: 13, fontWeight: 600, color: textSecondary },
    formInput: {
      padding: '9px 12px',
      fontSize: 13.5,
      borderRadius: 8,
      border: `1px solid ${border}`,
      outline: 'none',
      background: inputBg,
      color: textColor,
      fontFamily: 'inherit',
    },
    formTextarea: {
      padding: '9px 12px',
      fontSize: 13.5,
      borderRadius: 8,
      border: `1px solid ${border}`,
      outline: 'none',
      background: inputBg,
      color: textColor,
      fontFamily: 'inherit',
      resize: 'vertical',
    },
    roleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '8px 12px',
      marginTop: 4,
    },
  }

  return (
    <div style={S.page} ref={tableRef}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .table-row { transition: background-color 0.15s; }
        .table-row:hover { background-color: ${hoverRowBg} !important; }
        
        .gov-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.12s ease-in-out;
        }
        .gov-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .view-btn { background-color: ${isDark ? '#232b3c' : '#e0f2fe'}; color: #0284c7; border: 1px solid ${isDark ? '#334155' : '#bae6fd'}; }
        .view-btn:hover { background-color: #0284c7; color: #fff; }

        .approve-btn { background-color: ${isDark ? '#1b2c24' : '#dcfce7'}; color: #16a34a; border: 1px solid ${isDark ? '#1e3f20' : '#bbf7d0'}; }
        .approve-btn:hover { background-color: #16a34a; color: #fff; }

        .reject-btn { background-color: ${isDark ? '#2c1e21' : '#fee2e2'}; color: #dc2626; border: 1px solid ${isDark ? '#3f1f21' : '#fecaca'}; }
        .reject-btn:hover { background-color: #dc2626; color: #fff; }

        .edit-btn { background-color: ${isDark ? '#2d281a' : '#fef9c3'}; color: #ca8a04; border: 1px solid ${isDark ? '#3f381f' : '#fef08a'}; }
        .edit-btn:hover { background-color: #ca8a04; color: #fff; }

        .submit-btn { background-color: ${isDark ? '#1e2c38' : '#e0f2fe'}; color: #2C4F8A; border: 1px solid ${isDark ? '#2a3b4e' : '#B9C6DC'}; }
        .submit-btn:hover { background-color: #2C4F8A; color: #fff; }

        .cancel-btn { background-color: ${isDark ? '#242730' : '#f3f4f6'}; color: #4b5563; border: 1px solid ${isDark ? '#2a2f3e' : '#e5e7eb'}; }
        .cancel-btn:hover { background-color: #4b5563; color: #fff; }
      `}</style>

      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: t.type === 'success' ? '#2E7D32' : '#C62828',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 500,
              minWidth: 260,
              maxWidth: 360,
              animation: 'fadeUp 0.25s ease both',
            }}
          >
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                padding: 2,
                opacity: 0.8,
              }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Row 1: Search bar only */}
        <div style={{ ...S.searchContainer, margin: 0, maxWidth: 440 }}>
          <div style={S.searchWrap}>
            <RiSearchLine size={15} color="#94a3b8" style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Asar nomini qidirish..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Row 2: Filters (Holati, Ko'rsatish) and Actions */}
        <div style={{ ...S.filtersRow, alignItems: 'flex-end', margin: 0 }}>
          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Holati</label>
            <select
              style={S.filterSelect}
              value={filterState}
              onChange={handleFilterStateChange}
            >
              <option value="">Barchasi</option>
              <option value="DRAFT">Qoralama</option>
              <option value="PENDING">Ko'rib chiqilmoqda</option>
              <option value="REGISTERED">Tasdiqlangan</option>
              <option value="REJECTED">Rad etilgan</option>
              <option value="CANCELLED">Bekor qilingan</option>
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Ko'rsatish</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ ...S.filterSelect, minWidth: 100 }}
            >
              <option value={10}>10 talab</option>
              <option value={20}>20 talab</option>
              <option value={50}>50 talab</option>
            </select>
          </div>

          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 35,
                height: 35,
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={handleApplyFilters}
              title="Qidirish"
            >
              <RiSearchLine size={16} />
            </button>

            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 35,
                height: 35,
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: cardBg,
                color: textSecondary,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={handleClearFilters}
              title="Tozalash"
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table Card */}
      <div style={S.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 20px 0',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: textSecondary,
            }}
          >
            Jami: {total} ta asar
          </span>
          <button
            style={S.refreshBtn}
            onClick={() =>
              load(
                page,
                pageSize,
                filterState,
                debouncedSearch,
                filterStartDate,
                filterEndDate
              )
            }
            title="Yangilash"
          >
            <RiRefreshLine size={16} />
          </button>
        </div>

        {loading ? (
          <div style={S.center}>
            <div style={S.spinner} />
          </div>
        ) : filteredWorks.length === 0 ? (
          <div style={S.center}>
            <RiFileTextLine size={44} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>
              Asarlar topilmadi
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 50 }}>№</th>
                  <th style={S.th}>Nomi</th>
                  <th style={S.th}>Asar turi</th>
                  <th style={S.th}>Holati</th>
                  <th style={S.th}>Haq egalari</th>
                  <th style={S.th}>Yaratilgan sana</th>
                  <th style={{ ...S.th, width: 180 }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorks.map((w, idx) => {
                  const status = w.state || w.status || 'DRAFT'
                  const workType = getWorkTypeName(w.workTypeId)
                  const holdersCount = w.rightHolders?.length || 0

                  return (
                    <tr
                      key={w.id}
                      className="table-row"
                      style={{ background: idx % 2 === 1 ? altRowBg : cardBg }}
                    >
                      <td style={S.td}>{(page - 1) * pageSize + idx + 1}</td>
                      <td
                        style={{
                          ...S.td,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setDetailWork(w)}
                      >
                        {w.name || '—'}
                      </td>
                      <td style={S.td}>
                        <span style={S.typeBadge}>{workType}</span>
                      </td>
                      <td style={S.td}>
                        <StatusBadge status={status} />
                      </td>
                      <td
                        style={{ ...S.td, color: textSecondary, fontSize: 13 }}
                      >
                        {holdersCount} kishi
                      </td>
                      <td
                        style={{ ...S.td, color: textSecondary, fontSize: 13 }}
                      >
                        {formatDateTime(w.createdAt)}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {/* View details */}
                          <button
                            className="gov-btn view-btn"
                            title="Batafsil ko'rish"
                            disabled={actionLoading}
                            onClick={() => setDetailWork(w)}
                          >
                            <RiFileTextLine size={14} />
                          </button>

                          {/* DRAFT Edit */}
                          {status === 'DRAFT' && (
                            <button
                              className="gov-btn edit-btn"
                              title="Tahrirlash"
                              disabled={actionLoading}
                              onClick={() => handleOpenEdit(w)}
                            >
                              <RiEditLine size={14} />
                            </button>
                          )}

                          {/* DRAFT Submit */}
                          {status === 'DRAFT' && (
                            <button
                              className="gov-btn submit-btn"
                              title="Yuborish"
                              disabled={actionLoading}
                              onClick={() => handleSubmitTrigger(w)}
                            >
                              <RiSendPlane2Line size={14} />
                            </button>
                          )}

                          {/* PENDING Approve & Reject */}
                          {status === 'PENDING' && (
                            <>
                              <button
                                className="gov-btn approve-btn"
                                title="Tasdiqlash"
                                disabled={actionLoading}
                                onClick={() => handleApproveTrigger(w)}
                              >
                                <RiCheckLine size={14} />
                              </button>
                              <button
                                className="gov-btn reject-btn"
                                title="Rad etish"
                                disabled={actionLoading}
                                onClick={() => handleRejectTrigger(w)}
                              >
                                <RiCloseLine size={14} />
                              </button>
                            </>
                          )}

                          {/* DRAFT or REJECTED Cancel */}
                          {['DRAFT', 'REJECTED'].includes(status) && (
                            <button
                              className="gov-btn cancel-btn"
                              title="Bekor qilish"
                              disabled={actionLoading}
                              onClick={() => handleCancelTrigger(w)}
                            >
                              <RiCloseLine size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={S.pagination}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {total} ta dan {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{ ...S.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <RiArrowLeftLine size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  style={{
                    ...S.pageBtn,
                    ...(i + 1 === page ? S.pageBtnActive : {}),
                  }}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                style={{ ...S.pageBtn, opacity: page >= totalPages ? 0.4 : 1 }}
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                <RiArrowRightLine size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal Overlay */}
      {rejectingId && (
        <div style={M.overlay}>
          <form
            onSubmit={handleRejectSubmit}
            style={{ ...M.box, background: cardBg }}
          >
            <div style={{ ...M.header, borderColor: border }}>
              <h3 style={{ ...M.title, color: '#C62828' }}>Asarni rad etish</h3>
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null)
                  setRejectReason('')
                  setRejectError(null)
                }}
                style={M.closeBtn}
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={M.body}>
              <div
                style={{
                  ...S.errorBox,
                  background: 'rgba(198,40,40,0.1)',
                  color: '#C62828',
                  border: '1px solid rgba(198,40,40,0.2)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  margin: '0 0 14px 0',
                  borderRadius: 6,
                }}
              >
                <RiAlertLine size={18} style={{ flexShrink: 0 }} />
                <span>
                  Bu amal asarni REJECTED holatiga o'tkazadi. Foydalanuvchi
                  sabab asosida asarni tahrirlashi mumkin.
                </span>
              </div>
              <div style={M.field}>
                <label style={{ ...M.label, color: textSecondary }}>
                  Rad etish sababi <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  style={{
                    ...M.textarea,
                    background: inputBg,
                    color: textColor,
                    borderColor: border,
                  }}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rad etish sababini kiriting..."
                  rows={4}
                />
              </div>
              {rejectError && (
                <div
                  style={{
                    color: '#C62828',
                    fontSize: 13,
                    marginTop: 8,
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {rejectError}
                </div>
              )}
            </div>
            <div
              style={{
                ...M.footer,
                borderTopColor: border,
                background: altRowBg,
              }}
            >
              <button
                type="button"
                style={{
                  ...M.cancelBtn,
                  color: textSecondary,
                  borderColor: border,
                  background: cardBg,
                }}
                onClick={() => {
                  setRejectingId(null)
                  setRejectReason('')
                  setRejectError(null)
                }}
                disabled={actionLoading}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                style={{ ...M.saveBtn, background: '#C62828' }}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Yuborilmoqda...' : 'Rad etish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Dialog Overlay */}
      {confirmModal.isOpen && (
        <div style={M.overlay}>
          <div style={{ ...M.box, background: cardBg, maxWidth: 400 }}>
            <div style={{ ...M.header, borderColor: border }}>
              <h3 style={{ ...M.title, color: 'var(--accent)' }}>
                {confirmModal.title}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
                style={M.closeBtn}
                disabled={actionLoading}
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={M.body}>
              <div
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <RiAlertLine
                  size={32}
                  color={confirmModal.isDestructive ? '#C62828' : '#C49A2A'}
                  style={{ flexShrink: 0 }}
                />
                <div
                  style={{
                    fontSize: 14,
                    color: textColor,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {confirmModal.message}
                </div>
              </div>
              {confirmModal.error && (
                <div
                  style={{
                    color: '#C62828',
                    fontSize: 13,
                    marginTop: 12,
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {confirmModal.error}
                </div>
              )}
            </div>
            <div
              style={{
                ...M.footer,
                borderTopColor: border,
                background: altRowBg,
              }}
            >
              <button
                type="button"
                style={{
                  ...M.cancelBtn,
                  color: textSecondary,
                  borderColor: border,
                  background: cardBg,
                }}
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
                disabled={actionLoading}
              >
                Yo'q
              </button>
              <button
                type="button"
                style={{
                  ...M.saveBtn,
                  background: confirmModal.isDestructive
                    ? 'var(--danger)'
                    : 'var(--accent)',
                  ...confirmModal.confirmBtnStyle,
                }}
                disabled={actionLoading}
                onClick={confirmModal.onConfirm}
              >
                {actionLoading ? 'Kutilmoqda...' : confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal/Drawer Overlay */}
      {detailWork && (
        <div style={M.overlay}>
          <div style={{ ...M.box, background: cardBg, maxWidth: '640px' }}>
            <div style={{ ...M.header, borderColor: border }}>
              <h3 style={{ ...M.title, color: 'var(--accent)' }}>
                Asar tafsilotlari
              </h3>
              <button
                type="button"
                onClick={() => setDetailWork(null)}
                style={M.closeBtn}
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={{ ...M.body, maxHeight: '480px', overflowY: 'auto' }}>
              <div style={S.detailGrid}>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Nomi:</span>
                  <span style={S.detailVal}>{detailWork.name || '—'}</span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Asar turi:</span>
                  <span style={S.detailVal}>
                    {getWorkTypeName(detailWork.workTypeId)}
                  </span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Yaratuvchi ID:</span>
                  <span style={S.detailVal}>{detailWork.createdBy || '—'}</span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Holati:</span>
                  <span style={S.detailVal}>
                    <StatusBadge
                      status={detailWork.state || detailWork.status}
                    />
                  </span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Yaratilgan sana:</span>
                  <span style={S.detailVal}>
                    {formatDateTime(detailWork.createdAt)}
                  </span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>O'zgartirilgan sana:</span>
                  <span style={S.detailVal}>
                    {formatDateTime(detailWork.updatedAt)}
                  </span>
                </div>

                {detailWork.registrationDate && (
                  <div style={S.detailItem}>
                    <span style={S.detailLabel}>
                      Tasdiqlangan sana (Registration Date):
                    </span>
                    <span style={S.detailVal}>
                      {detailWork.registrationDate}
                    </span>
                  </div>
                )}

                <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                  <span style={S.detailLabel}>Tavsifi:</span>
                  <div
                    style={{
                      ...S.detailVal,
                      whiteSpace: 'pre-wrap',
                      background: altRowBg,
                      padding: '12px',
                      border: `1px solid ${border}`,
                      borderRadius: '6px',
                      marginTop: '4px',
                      fontWeight: 'normal',
                    }}
                  >
                    {detailWork.description || '—'}
                  </div>
                </div>

                {(detailWork.state || detailWork.status) === 'REJECTED' &&
                  detailWork.rejectionReason && (
                    <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                      <span style={{ ...S.detailLabel, color: '#dc2626' }}>
                        Rad etilish sababi:
                      </span>
                      <div
                        style={{
                          ...S.detailVal,
                          color: '#dc2626',
                          background: isDark
                            ? 'rgba(220,38,38,0.1)'
                            : '#FFEBEE',
                          padding: '12px',
                          border: '1px solid rgba(220,38,38,0.2)',
                          borderRadius: '6px',
                          marginTop: '4px',
                        }}
                      >
                        {detailWork.rejectionReason}
                      </div>
                    </div>
                  )}

                {/* Right Holders Table */}
                <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                  <span style={S.detailLabel}>Mulk egalari (Haq egalari):</span>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    {!detailWork.rightHolders ||
                    detailWork.rightHolders.length === 0 ? (
                      <span style={{ fontSize: 13, color: textSecondary }}>
                        Ko'rsatilmagan.
                      </span>
                    ) : (
                      detailWork.rightHolders.map((rh, index) => (
                        <div key={index} style={S.holderBox}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              borderBottom: `1px solid ${border}`,
                              paddingBottom: 6,
                              marginBottom: 6,
                            }}
                          >
                            <RiUserLine size={15} color="var(--accent)" />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: textColor,
                              }}
                            >
                              {[rh.lastName, rh.firstName]
                                .filter(Boolean)
                                .join(' ') || 'Foydalanuvchi'}
                            </span>
                            <span
                              style={{
                                marginLeft: 'auto',
                                background: 'var(--accent)',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              Ulush: {rh.sharePercentage || rh.share || 0}%
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 6,
                              fontSize: 12,
                              color: textSecondary,
                            }}
                          >
                            <div>
                              <strong>Pasport:</strong>{' '}
                              {rh.passportNo || rh.passportSeria || '—'}
                            </div>
                            <div>
                              <strong>Roli:</strong>{' '}
                              {getAuthorRoleNames(rh.authorRoleIds || [])}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                ...M.footer,
                borderTopColor: border,
                background: altRowBg,
              }}
            >
              {/* Action buttons inside drawer matching state rules */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  width: '100%',
                  justifyContent: 'flex-start',
                }}
              >
                {detailWork.state === 'PENDING' && (
                  <>
                    <button
                      className="gov-btn approve-btn"
                      style={{
                        width: 'auto',
                        padding: '6px 14px',
                        height: 'auto',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                      disabled={actionLoading}
                      onClick={() => {
                        setDetailWork(null)
                        handleApproveTrigger(detailWork)
                      }}
                    >
                      Tasdiqlash
                    </button>
                    <button
                      className="gov-btn reject-btn"
                      style={{
                        width: 'auto',
                        padding: '6px 14px',
                        height: 'auto',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                      disabled={actionLoading}
                      onClick={() => {
                        setDetailWork(null)
                        handleRejectTrigger(detailWork)
                      }}
                    >
                      Rad etish
                    </button>
                  </>
                )}
                {['DRAFT', 'REJECTED'].includes(detailWork.state) && (
                  <button
                    className="gov-btn cancel-btn"
                    style={{
                      width: 'auto',
                      padding: '6px 14px',
                      height: 'auto',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                    disabled={actionLoading}
                    onClick={() => {
                      setDetailWork(null)
                      handleCancelTrigger(detailWork)
                    }}
                  >
                    Bekor qilish
                  </button>
                )}
                {detailWork.state === 'DRAFT' && (
                  <button
                    className="gov-btn submit-btn"
                    style={{
                      width: 'auto',
                      padding: '6px 14px',
                      height: 'auto',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                    disabled={actionLoading}
                    onClick={() => {
                      setDetailWork(null)
                      handleSubmitTrigger(detailWork)
                    }}
                  >
                    Yuborish
                  </button>
                )}
                <button
                  type="button"
                  style={{
                    ...M.cancelBtn,
                    marginLeft: 'auto',
                    color: textSecondary,
                    borderColor: border,
                    background: cardBg,
                  }}
                  onClick={() => setDetailWork(null)}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {editingWork && (
        <div style={M.overlay}>
          <form
            onSubmit={handleEditSubmit}
            style={{ ...M.box, background: cardBg, maxWidth: '640px' }}
          >
            <div style={{ ...M.header, borderColor: border }}>
              <h3 style={{ ...M.title, color: 'var(--accent)' }}>
                Asarni tahrirlash
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingWork(null)
                  setEditError(null)
                }}
                style={M.closeBtn}
                disabled={actionLoading}
              >
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={{ ...M.body, maxHeight: '460px', overflowY: 'auto' }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={S.formField}>
                  <label style={S.formLabel}>
                    Asar nomi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="edit-form-field-name"
                    style={{
                      ...S.formInput,
                      borderColor: fieldErrors['name'] ? '#dc2626' : border,
                    }}
                    required
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy['name']
                        return copy
                      })
                    }}
                    placeholder="Asar nomi"
                    maxLength={500}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontSize: '11px',
                      color:
                        (editForm.name || '').length > 450
                          ? '#dc2626'
                          : textSecondary,
                      marginTop: '2px',
                    }}
                  >
                    {(editForm.name || '').length}/500
                  </div>
                  <FieldError error={fieldErrors['name']} />
                </div>

                <div style={S.formField}>
                  <label style={S.formLabel}>
                    Asar turi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    id="edit-form-field-workTypeId"
                    style={{
                      ...S.filterSelect,
                      width: '100%',
                      minWidth: 'auto',
                      borderColor: fieldErrors['workTypeId']
                        ? '#dc2626'
                        : border,
                    }}
                    required
                    value={editForm.workTypeId}
                    onChange={(e) => {
                      setEditForm((f) => ({ ...f, workTypeId: e.target.value }))
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy['workTypeId']
                        return copy
                      })
                    }}
                  >
                    <option value="">Tanlang...</option>
                    {workTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.localizedName?.uz || t.localizedName?.ru || t.name}
                      </option>
                    ))}
                  </select>
                  <FieldError error={fieldErrors['workTypeId']} />
                </div>

                <div style={S.formField}>
                  <label style={S.formLabel}>Tavsifi</label>
                  <textarea
                    id="edit-form-field-description"
                    style={S.formTextarea}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Asar haqida batafsil tavsif..."
                    rows={3}
                    maxLength={500}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontSize: '11px',
                      color:
                        (editForm.description || '').length > 450
                          ? '#dc2626'
                          : textSecondary,
                      marginTop: '2px',
                    }}
                  >
                    {(editForm.description || '').length}/500
                  </div>
                </div>

                {/* Right holders edit section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: textColor,
                      }}
                    >
                      Haq egalari va ulushlar
                    </span>
                    <button
                      type="button"
                      onClick={handleAddHolder}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 12px',
                        borderRadius: 8,
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RiAddLine size={14} />
                      <span>Qo'shish</span>
                    </button>
                  </div>

                  {editForm.rightHolders.map((rh, idx) => (
                    <div
                      key={idx}
                      style={{ ...S.holderBox, border: `1px dashed ${border}` }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: `1px solid ${border}`,
                          paddingBottom: 6,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: 'var(--accent)',
                          }}
                        >
                          {idx + 1}-Haq egasi
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHolder(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '3px',
                          }}
                          title="Haq egasini o'chirish"
                        >
                          <RiDeleteBinLine size={14} />
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div style={S.editRow}>
                          <div style={S.formField}>
                            <label style={S.formLabel}>
                              Familiya{' '}
                              <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              id={`edit-holder-field-${idx}-lastName`}
                              style={{
                                ...S.formInput,
                                borderColor: fieldErrors[
                                  `rightHolders[${idx}].lastName`
                                ]
                                  ? '#dc2626'
                                  : border,
                              }}
                              required
                              value={rh.lastName}
                              onChange={(e) =>
                                handleHolderFieldChange(
                                  idx,
                                  'lastName',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur(idx, 'lastName', e.target.value)
                              }
                              placeholder="Familiya"
                            />
                            <FieldError
                              error={
                                fieldErrors[`rightHolders[${idx}].lastName`]
                              }
                            />
                          </div>
                          <div style={S.formField}>
                            <label style={S.formLabel}>
                              Ism <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              id={`edit-holder-field-${idx}-firstName`}
                              style={{
                                ...S.formInput,
                                borderColor: fieldErrors[
                                  `rightHolders[${idx}].firstName`
                                ]
                                  ? '#dc2626'
                                  : border,
                              }}
                              required
                              value={rh.firstName}
                              onChange={(e) =>
                                handleHolderFieldChange(
                                  idx,
                                  'firstName',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur(
                                  idx,
                                  'firstName',
                                  e.target.value
                                )
                              }
                              placeholder="Ism"
                            />
                            <FieldError
                              error={
                                fieldErrors[`rightHolders[${idx}].firstName`]
                              }
                            />
                          </div>
                        </div>

                        <div style={S.editRow}>
                          <div style={S.formField}>
                            <label style={S.formLabel}>
                              Pasport raqami{' '}
                              <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              id={`edit-holder-field-${idx}-passportNo`}
                              style={{
                                ...S.formInput,
                                borderColor: fieldErrors[
                                  `rightHolders[${idx}].passportNo`
                                ]
                                  ? '#dc2626'
                                  : border,
                                fontFamily: 'monospace',
                              }}
                              required
                              value={rh.passportNo}
                              onChange={(e) =>
                                handleHolderFieldChange(
                                  idx,
                                  'passportNo',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur(
                                  idx,
                                  'passportNo',
                                  e.target.value
                                )
                              }
                              placeholder="AA1234567"
                              maxLength={9}
                            />
                            {rh.passportNo && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#6B7A8D',
                                  marginTop: '2px',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {(() => {
                                  const len = rh.passportNo.length
                                  if (len === 0) return ''
                                  const letters = rh.passportNo.slice(0, 2)
                                  const digits = rh.passportNo.slice(2)
                                  const underscores = '_'.repeat(9 - len)
                                  return len <= 2
                                    ? `Seriya: ${letters}${underscores}`
                                    : `${letters}${digits}${underscores}`
                                })()}
                              </div>
                            )}
                            <FieldError
                              error={
                                fieldErrors[`rightHolders[${idx}].passportNo`]
                              }
                            />
                          </div>
                          <div style={S.formField}>
                            <label style={S.formLabel}>
                              Ulush (%){' '}
                              <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              id={`edit-holder-field-${idx}-sharePercentage`}
                              style={{
                                ...S.formInput,
                                borderColor: fieldErrors[
                                  `rightHolders[${idx}].sharePercentage`
                                ]
                                  ? '#dc2626'
                                  : border,
                              }}
                              type="text"
                              inputMode="decimal"
                              required
                              maxLength={6}
                              value={rh.sharePercentage}
                              onChange={(e) =>
                                handleHolderFieldChange(
                                  idx,
                                  'sharePercentage',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleFieldBlur(
                                  idx,
                                  'sharePercentage',
                                  e.target.value
                                )
                              }
                              placeholder="Ulush foizi (0.01 - 100)"
                            />
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                marginTop: '4px',
                                display: 'block',
                                fontStyle: 'italic',
                              }}
                            >
                              {(() => {
                                const sumOther = editForm.rightHolders.reduce(
                                  (sum, item, i) => {
                                    if (i === idx) return sum
                                    return (
                                      sum + (Number(item.sharePercentage) || 0)
                                    )
                                  },
                                  0
                                )
                                const maxAllowed = Math.max(0, 100 - sumOther)
                                const total = editForm.rightHolders.reduce(
                                  (sum, item) =>
                                    sum + (Number(item.sharePercentage) || 0),
                                  0
                                )
                                return maxAllowed > 0
                                  ? `Maksimal kiritish mumkin: ${maxAllowed}% (yana ${100 - total}% bo'sh ulush bor)`
                                  : 'Barcha ulush taqsimlangan (0% qoldi)'
                              })()}
                            </span>
                            <FieldError
                              error={
                                fieldErrors[
                                  `rightHolders[${idx}].sharePercentage`
                                ]
                              }
                            />
                          </div>
                        </div>

                        <div style={{ ...S.formField, position: 'relative' }}>
                          <label style={S.formLabel}>
                            Mualliflik rollari{' '}
                            <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <div
                            id={`edit-holder-field-${idx}-authorRoles`}
                            onClick={() =>
                              setOpenRolesDropdownIdx(
                                openRolesDropdownIdx === idx ? null : idx
                              )
                            }
                            style={{
                              ...S.formInput,
                              borderColor: fieldErrors[
                                `rightHolders[${idx}].authorRoles`
                              ]
                                ? '#dc2626'
                                : border,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              minHeight: '38px',
                              boxSizing: 'border-box',
                              userSelect: 'none',
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '90%',
                              }}
                            >
                              {(rh.authorRoles || []).length > 0
                                ? rh.authorRoles
                                    .map((id) => {
                                      const r = authorRoles.find(
                                        (role) => String(role.id) === String(id)
                                      )
                                      return r
                                        ? r.localizedName?.uz ||
                                            r.localizedName?.ru ||
                                            r.name
                                        : id
                                    })
                                    .join(', ')
                                : 'Rollarini tanlang...'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {openRolesDropdownIdx === idx ? '▲' : '▼'}
                            </span>
                          </div>

                          {openRolesDropdownIdx === idx && (
                            <>
                              <div
                                style={{
                                  position: 'fixed',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  zIndex: 999,
                                  cursor: 'default',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenRolesDropdownIdx(null)
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  marginTop: '4px',
                                  background: cardBg,
                                  border: `1px solid ${border}`,
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  zIndex: 1000,
                                  padding: '6px',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {authorRoles.map((role) => {
                                  const selectedRoles = rh.authorRoles || []
                                  const isChecked = selectedRoles.includes(
                                    String(role.id)
                                  )
                                  return (
                                    <label
                                      key={role.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        color: textColor,
                                        background: isChecked
                                          ? isDark
                                            ? '#1e293b'
                                            : '#f0fdf4'
                                          : 'transparent',
                                        transition: 'background-color 0.15s',
                                        userSelect: 'none',
                                        marginBottom: '2px',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const newRoles = isChecked
                                            ? selectedRoles.filter(
                                                (id) => id !== String(role.id)
                                              )
                                            : [
                                                ...selectedRoles,
                                                String(role.id),
                                              ]
                                          setEditForm((f) => {
                                            const newRh = [...f.rightHolders]
                                            newRh[idx] = {
                                              ...newRh[idx],
                                              authorRoles: newRoles,
                                            }
                                            return { ...f, rightHolders: newRh }
                                          })
                                        }}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <span>
                                        {role.localizedName?.uz ||
                                          role.localizedName?.ru ||
                                          role.name}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            </>
                          )}
                          <FieldError
                            error={
                              fieldErrors[`rightHolders[${idx}].authorRoles`]
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total share summary bar */}
                {(() => {
                  const total = editForm.rightHolders.reduce(
                    (sum, item) => sum + (Number(item.sharePercentage) || 0),
                    0
                  )
                  const isOk = Math.abs(total - 100) < 0.0001
                  return (
                    <div
                      id="edit-share-total-bar"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isOk
                          ? isDark
                            ? 'rgba(46,125,50,0.15)'
                            : '#E8F5EE'
                          : isDark
                            ? 'rgba(198,40,40,0.15)'
                            : '#FDEEEE',
                        border: `1px solid ${isOk ? (isDark ? '#1e3f20' : '#7DCB9E') : isDark ? '#3f1f21' : '#F5AAAA'}`,
                        color: isOk
                          ? isDark
                            ? '#4ade80'
                            : '#2E7D32'
                          : isDark
                            ? '#f87171'
                            : '#C0392B',
                        marginTop: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        <span>{isOk ? '✓' : '✗'}</span>
                        <span>Jami ulush: {total}% / 100%</span>
                      </div>
                    </div>
                  )
                })()}

                {editError && (
                  <div
                    style={{ color: '#C62828', fontSize: 13, fontWeight: 500 }}
                  >
                    ⚠️ {editError}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                ...M.footer,
                borderTopColor: border,
                background: altRowBg,
              }}
            >
              <button
                type="button"
                style={{
                  ...M.cancelBtn,
                  color: textSecondary,
                  borderColor: border,
                  background: cardBg,
                }}
                onClick={() => {
                  setEditingWork(null)
                  setEditError(null)
                }}
                disabled={actionLoading}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                style={{ ...M.saveBtn, background: 'var(--accent)' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
