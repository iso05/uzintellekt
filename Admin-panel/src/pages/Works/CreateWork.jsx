// src/pages/Works/CreateWork.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import {
  RiFileTextLine,
  RiSearchLine,
  RiRefreshLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiEditLine,
  RiUserLine,
  RiAddLine,
  RiDeleteBinLine,
  RiAlertLine,
  RiSendPlane2Line,
  RiCheckLine,
} from 'react-icons/ri'
import { maskName, maskPassport, maskShare } from '../../utils/inputMasks'
import FieldError from '../../components/FieldError'

/* ─── helpers ────────────────────────────────────────────────── */
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
    label: status || "Noma'lum",
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

/* ─── modal shared styles ─────────────────────────────────────── */
const M = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  box: {
    width: '100%',
    maxWidth: 680,
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
  title: { fontSize: 16, fontWeight: 700, margin: 0 },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: 13.5,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
}

export default function CreateWork() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tableRef = useRef(null)

  /* ── grid state ── */
  const [works, setWorks] = useState([])
  const [workTypes, setWorkTypes] = useState([])
  const [authorRoles, setAuthorRoles] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  /* ── toasts ── */
  const [toasts, setToasts] = useState([])

  /* ── detail modal ── */
  const [detailWork, setDetailWork] = useState(null)

  /* ── action ── */
  const [actionLoading, setActionLoading] = useState(false)

  /* ── edit modal ── */
  const [editingWork, setEditingWork] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    workTypeId: '',
    rightHolders: [],
  })
  const [editError, setEditError] = useState(null)

  /* ── create modal ── */
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createSearch, setCreateSearch] = useState('')
  const [createSearchLoading, setCreateSearchLoading] = useState(false)
  const [createUsersList, setCreateUsersList] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    workTypeId: '',
    rightHolders: [],
  })
  const [createValidationErrors, setCreateValidationErrors] = useState({})
  const [createError, setCreateError] = useState(null)
  const [createSaving, setCreateSaving] = useState(false)
  const [openEditRolesDropdownIdx, setOpenEditRolesDropdownIdx] = useState(null)
  const [openCreateRolesDropdownIdx, setOpenCreateRolesDropdownIdx] =
    useState(null)

  /* ─── helpers ─────────────────────────────────────────────── */
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, type, message }])
    if (type === 'success')
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3000
      )
  }, [])
  const removeToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  )

  const handleApiError = useCallback(
    (err, fallback = 'Xatolik yuz berdi.') => {
      console.error(err)
      const status = err.response?.status
      const data = err.response?.data
      let msg = fallback
      if (status === 400) msg = data?.errorMessage || fallback
      else if (status === 422)
        msg = Array.isArray(data?.errors)
          ? data.errors
              .map((e) => {
                let m = e.message || e.defaultMessage || ''
                if (
                  m.includes('must contain only Latin letters') ||
                  m.toLowerCase().includes('latin letters')
                ) {
                  return "Faqat lotin harflari bo'lishi shart"
                }
                return m
              })
              .join(', ')
          : data?.errorMessage || 'Validatsiya xatosi.'
      else if (status)
        msg = data?.errorMessage || data?.message || `Server xatosi: ${status}`
      else if (err.request) msg = "Server bilan aloqa yo'q."
      else msg = err.message || fallback
      if (
        msg.includes('must contain only Latin letters') ||
        msg.toLowerCase().includes('latin letters')
      ) {
        msg = "Faqat lotin harflari bo'lishi shart"
      }
      addToast('error', msg)
      return msg
    },
    [addToast]
  )

  const getWorkTypeName = (id) => {
    const t = workTypes.find((t) => Number(t.id) === Number(id))
    return (
      t?.localizedName?.uz ||
      t?.localizedName?.ru ||
      t?.localizedName?.en ||
      '—'
    )
  }
  const getAuthorRoleNames = (ids) => {
    if (!ids || ids.length === 0) return '—'
    return ids
      .map((roleId) => {
        const r = authorRoles.find((r) => Number(r.id) === Number(roleId))
        return r?.localizedName?.uz || r?.localizedName?.ru || r?.name || '—'
      })
      .join(', ')
  }

  /* ─── data loading ────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      api.get('/api/v1/dictionaries/work-types').catch(() => ({ data: [] })),
      api.get('/api/v1/dictionaries/author-roles').catch(() => ({ data: [] })),
    ]).then(([wt, ar]) => {
      setWorkTypes(wt.data?.content ?? wt.data ?? [])
      setAuthorRoles(ar.data?.content ?? ar.data ?? [])
    })
  }, [])

  const load = useCallback(
    async (currentPage, size, searchQuery) => {
      setLoading(true)
      try {
        const filters = []
        if (searchQuery?.trim())
          filters.push({
            field: 'name',
            operator: 'lk',
            value: searchQuery.trim(),
          })
        const { data } = await api.get('/api/v1/works/grid', {
          params: {
            gridRequest: JSON.stringify({
              page: currentPage,
              size,
              filters,
              sort: { selector: 'createdAt', desc: true },
            }),
          },
        })
        setWorks(data?.items ?? data?.content ?? [])
        setTotal(data?.totalItems ?? data?.totalElements ?? 0)
        setTotalPages(
          data?.totalPages ?? Math.ceil((data?.totalItems ?? 0) / size)
        )
      } catch (e) {
        handleApiError(e, 'Asarlarni yuklashda xatolik.')
      } finally {
        setLoading(false)
      }
    },
    [handleApiError]
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page, pageSize, debouncedSearch)
  }, [page, pageSize, debouncedSearch, load])

  const handlePageChange = (p) => {
    setPage(p)
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ─── Submit action ───────────────────────────────────────── */
  const handleSubmitTrigger = async (w) => {
    if (!window.confirm("Asarni ko'rib chiqishga yuborasizmi?")) return
    setActionLoading(true)
    try {
      await api.post(`/api/v1/admin/works/${w.id}/submit`)
      addToast('success', "Asar ko'rib chiqishga yuborildi")
      load(page, pageSize, debouncedSearch)
    } catch (e) {
      handleApiError(e, 'Asarni yuborishda xatolik.')
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Edit modal ──────────────────────────────────────────── */
  const handleOpenEdit = (w) => {
    setEditingWork(w)
    setEditError(null)
    setEditForm({
      name: w.name || '',
      description: w.description || '',
      workTypeId: w.workTypeId || w.workType?.id || '',
      rightHolders:
        w.rightHolders?.length > 0
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

  const handleAddHolder = () =>
    setEditForm((f) => ({
      ...f,
      rightHolders: [...f.rightHolders, { ...EMPTY_HOLDER }],
    }))
  const handleRemoveHolder = (idx) => {
    if (editForm.rightHolders.length <= 1)
      return alert("Kamida bitta haq egasi bo'lishi shart.")
    setEditForm((f) => {
      const rh = [...f.rightHolders]
      rh.splice(idx, 1)
      return { ...f, rightHolders: rh }
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
      }
      rh[idx] = { ...rh[idx], [key]: finalVal }
      return { ...f, rightHolders: rh }
    })
  }

  const _handleHolderRoleSelect = (idx, e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value)
    setEditForm((f) => {
      const rh = [...f.rightHolders]
      rh[idx] = { ...rh[idx], authorRoles: selected }
      return { ...f, rightHolders: rh }
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError(null)
    if (!editForm.name.trim())
      return setEditError('Asar nomi kiritilishi shart.')
    if (!editForm.workTypeId) return setEditError('Asar turini tanlang.')
    const totalShare = editForm.rightHolders.reduce(
      (s, rh) => s + (Number(rh.sharePercentage) || 0),
      0
    )
    if (Math.abs(totalShare - 100) > 0.001)
      return setEditError(
        `Jami ulush 100% bo'lishi shart. Hozirgi: ${totalShare}%`
      )
    for (let i = 0; i < editForm.rightHolders.length; i++) {
      const rh = editForm.rightHolders[i]
      if (!rh.passportNo.trim() || !rh.firstName.trim() || !rh.lastName.trim())
        return setEditError(
          `${i + 1}-haq egasining barcha ma'lumotlarini to'ldiring.`
        )
      if (!/^[A-Z]{2}\d{7}$/.test(rh.passportNo.trim()))
        return setEditError(
          `${i + 1}-haq egasining pasport formati noto'g'ri (AA1234567).`
        )
      if (!rh.authorRoles?.length)
        return setEditError(`${i + 1}-haq egasining mualliflik rolini tanlang.`)
    }
    setActionLoading(true)
    try {
      await api.patch(`/api/v1/admin/works/${editingWork.id}`, {
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
      })
      addToast('success', 'Asar muvaffaqiyatli tahrirlandi')
      setEditingWork(null)
      load(page, pageSize, debouncedSearch)
    } catch (err) {
      setEditError(handleApiError(err, 'Tahrirlashda xatolik.'))
    } finally {
      setActionLoading(false)
    }
  }

  /* ─── Create modal ────────────────────────────────────────── */
  const handleOpenCreate = () => {
    setCreateModalOpen(true)
    setCreateSearch('')
    setCreateUsersList([])
    setSelectedUser(null)
    setCreateForm({
      name: '',
      description: '',
      workTypeId: '',
      rightHolders: [],
    })
    setCreateValidationErrors({})
    setCreateError(null)
  }

  const handleUserSearch = async (query) => {
    if (!query?.trim()) return setCreateUsersList([])
    setCreateSearchLoading(true)
    try {
      const q = query.trim()
      const isDigits = /^\d+$/.test(q)
      let items = []
      if (isDigits) {
        const { data } = await api.get('/api/v1/admin/users/grid', {
          params: {
            gridRequest: JSON.stringify({
              filters: [{ field: 'pinfl', operator: 'lk', value: q }],
              page: 0,
              size: 50,
            }),
          },
        })
        items = data?.items || []
      } else {
        const [r1, r2, r3] = await Promise.all([
          api
            .get('/api/v1/admin/users/grid', {
              params: {
                gridRequest: JSON.stringify({
                  filters: [{ field: 'lastName', operator: 'lk', value: q }],
                  page: 0,
                  size: 50,
                }),
              },
            })
            .catch(() => ({ data: { items: [] } })),
          api
            .get('/api/v1/admin/users/grid', {
              params: {
                gridRequest: JSON.stringify({
                  filters: [{ field: 'firstName', operator: 'lk', value: q }],
                  page: 0,
                  size: 50,
                }),
              },
            })
            .catch(() => ({ data: { items: [] } })),
          api
            .get('/api/v1/admin/users/grid', {
              params: {
                gridRequest: JSON.stringify({
                  filters: [{ field: 'legalName', operator: 'lk', value: q }],
                  page: 0,
                  size: 50,
                }),
              },
            })
            .catch(() => ({ data: { items: [] } })),
        ])
        const merged = [
          ...(r1.data?.items || []),
          ...(r2.data?.items || []),
          ...(r3.data?.items || []),
        ]
        const seen = new Set()
        items = merged.filter((u) => {
          if (!u?.id || seen.has(u.id)) return false
          seen.add(u.id)
          return true
        })
      }
      setCreateUsersList(items)
    } catch {
      /* ignore */
    } finally {
      setCreateSearchLoading(false)
    }
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setCreateForm({
      name: '',
      description: '',
      workTypeId: '',
      rightHolders: [
        {
          passportNo: user.passportNo || user.passportSeria || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          sharePercentage: '100',
          authorRoles: [],
        },
      ],
    })
    setCreateValidationErrors({})
    setCreateError(null)
  }

  const handleAddCreateHolder = () =>
    setCreateForm((f) => ({
      ...f,
      rightHolders: [
        ...f.rightHolders,
        {
          passportNo: '',
          firstName: '',
          lastName: '',
          sharePercentage: '',
          authorRoles: [],
        },
      ],
    }))
  const handleRemoveCreateHolder = (idx) => {
    if (createForm.rightHolders.length <= 1)
      return alert("Kamida bitta haq egasi bo'lishi shart.")
    setCreateForm((f) => {
      const rh = [...f.rightHolders]
      rh.splice(idx, 1)
      return { ...f, rightHolders: rh }
    })
  }

  const handleCreateHolderFieldChange = (idx, key, val) => {
    setCreateForm((f) => {
      const rh = [...f.rightHolders]
      let finalVal = val
      if (key === 'passportNo') {
        finalVal = maskPassport(val)
      } else if (key === 'firstName' || key === 'lastName') {
        finalVal = maskName(val)
      } else if (key === 'sharePercentage') {
        finalVal = maskShare(val)
      }
      rh[idx] = { ...rh[idx], [key]: finalVal }
      return { ...f, rightHolders: rh }
    })
  }

  const _handleCreateHolderRoleSelect = (idx, e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value)
    setCreateForm((f) => {
      const rh = [...f.rightHolders]
      rh[idx] = { ...rh[idx], authorRoles: selected }
      return { ...f, rightHolders: rh }
    })
  }

  const handleCreateSubmit = async (ev) => {
    ev.preventDefault()
    setCreateError(null)
    setCreateValidationErrors({})

    if (!createForm.name.trim())
      return setCreateError('Asar nomi kiritilishi shart.')
    if (!createForm.workTypeId) return setCreateError('Asar turini tanlang.')
    const totalShare = createForm.rightHolders.reduce(
      (s, rh) => s + (Number(rh.sharePercentage) || 0),
      0
    )
    if (Math.abs(totalShare - 100) > 0.001)
      return setCreateError(
        `Jami ulush 100% bo'lishi shart. Hozirgi: ${totalShare}%`
      )

    const errors = {}
    let hasErr = false
    for (let i = 0; i < createForm.rightHolders.length; i++) {
      const rh = createForm.rightHolders[i]
      if (!rh.passportNo.trim()) {
        errors[`rightHolders[${i}].passportNo`] = 'Pasport kiritilishi shart.'
        hasErr = true
      } else if (!/^[A-Z]{2}\d{7}$/.test(rh.passportNo.trim())) {
        errors[`rightHolders[${i}].passportNo`] =
          "Noto'g'ri format (AA1234567)."
        hasErr = true
      }
      if (!rh.firstName.trim()) {
        errors[`rightHolders[${i}].firstName`] = 'Ism kiritilishi shart.'
        hasErr = true
      }
      if (!rh.lastName.trim()) {
        errors[`rightHolders[${i}].lastName`] = 'Familiya kiritilishi shart.'
        hasErr = true
      }
      const shareNum = Number(rh.sharePercentage)
      if (isNaN(shareNum) || shareNum < 0.01 || shareNum > 100) {
        errors[`rightHolders[${i}].sharePercentage`] =
          "Ulush 0.01–100 oralig'ida bo'lishi shart."
        hasErr = true
      }
      if (!rh.authorRoles?.length) {
        errors[`rightHolders[${i}].authorRoles`] = 'Kamida bitta rol tanlang.'
        hasErr = true
      }
    }
    if (hasErr) {
      setCreateValidationErrors(errors)
      setCreateError("Qizil ko'rsatilgan maydonlarni to'g'rilang.")
      return
    }

    setCreateSaving(true)
    try {
      await api.post(`/api/v1/admin/users/${selectedUser.id}/works`, {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        workTypeId: Number(createForm.workTypeId),
        rightHolders: createForm.rightHolders.map((rh) => ({
          passportNo: rh.passportNo.trim(),
          firstName: rh.firstName.trim(),
          lastName: rh.lastName.trim(),
          sharePercentage: Number(rh.sharePercentage),
          authorRoles: rh.authorRoles.map(Number),
        })),
      })
      addToast('success', 'Asar muvaffaqiyatli yaratildi')
      setCreateModalOpen(false)
      load(page, pageSize, debouncedSearch)
    } catch (err) {
      if (err.response?.status === 422) {
        const rawErrors =
          err.response?.data?.errors || err.response?.data?.fieldErrors || []
        const errorsMap = {}
        const unmapped = []
        const normalise = (f) =>
          f.replace(/\.(\d+)\./g, '[$1].').replace(/\.(\d+)$/, '[$1]')
        rawErrors.forEach((e) => {
          let msg = e.message || e.defaultMessage || ''
          if (!msg) return
          if (
            msg.includes('must contain only Latin letters') ||
            msg.toLowerCase().includes('latin letters')
          ) {
            msg = "Faqat lotin harflari bo'lishi shart"
          }
          if (e.field) errorsMap[normalise(e.field)] = msg
          else unmapped.push(msg)
        })
        setCreateValidationErrors(errorsMap)
        const hasField = Object.keys(errorsMap).length > 0
        if (hasField) {
          const summary = Object.entries(errorsMap)
            .map(([k, v]) => {
              const friendly = k
                .replace(
                  /rightHolders\[(\d+)\]\./,
                  (_, n) => `${Number(n) + 1}-haq egasi: `
                )
                .replace('passportNo', 'Pasport')
                .replace('firstName', 'Ism')
                .replace('lastName', 'Familiya')
                .replace('sharePercentage', 'Ulush')
                .replace('authorRoles', 'Rol')
                .replace('name', 'Nomi')
                .replace('workTypeId', 'Turi')
              return `${friendly} — ${v}`
            })
            .join(' | ')
          setCreateError(summary)
        } else {
          setCreateError(
            unmapped.join(' | ') ||
              err.response?.data?.errorMessage ||
              'Validatsiya xatosi.'
          )
        }
      } else {
        setCreateError(handleApiError(err, 'Asar yaratishda xatolik.'))
      }
    } finally {
      setCreateSaving(false)
    }
  }

  /* ─── theme-derived tokens ────────────────────────────────── */
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
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    searchWrap: { position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 },
    searchIcon: {
      position: 'absolute',
      left: 11,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
    },
    searchInput: {
      width: '100%',
      padding: '9px 12px 9px 34px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      fontSize: 13.5,
      outline: 'none',
      background: cardBg,
      color: textColor,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '9px 18px',
      borderRadius: 8,
      border: 'none',
      background: '#10B981',
      color: '#fff',
      fontSize: 13.5,
      fontWeight: 700,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
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
    },
    pageBtnActive: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
    refreshBtn: {
      padding: '7px 11px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },
    // form
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
    holderBox: {
      padding: '10px 14px',
      border: `1px solid ${border}`,
      borderRadius: 6,
      background: altRowBg,
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
    holderDetailBox: {
      padding: '10px 14px',
      border: `1px solid ${border}`,
      borderRadius: 6,
      background: altRowBg,
    },
    errorBox: { padding: '10px 14px', borderRadius: 8 },
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
  }

  /* ─── Holder card (shared render helper) ──────────────────── */
  const renderHolderFields = (rh, idx, isCreate) => {
    const onChange = (key, val) =>
      isCreate
        ? handleCreateHolderFieldChange(idx, key, val)
        : handleHolderFieldChange(idx, key, val)
    const onRemove = () =>
      isCreate ? handleRemoveCreateHolder(idx) : handleRemoveHolder(idx)
    const errs = isCreate ? createValidationErrors : {}
    const e = (k) => errs[`rightHolders[${idx}].${k}`]
    const sumOther = (isCreate ? createForm : editForm).rightHolders.reduce(
      (s, item, i) => (i === idx ? s : s + (Number(item.sharePercentage) || 0)),
      0
    )
    const maxShare = Math.max(0, 100 - sumOther)

    return (
      <div key={idx} style={{ ...S.holderBox, border: `1px dashed ${border}` }}>
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
            style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}
          >
            {idx + 1}-Haq egasi
          </span>
          <button
            type="button"
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              padding: 3,
            }}
            title="O'chirish"
          >
            <RiDeleteBinLine size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={S.editRow}>
            <div style={S.formField}>
              <label style={S.formLabel}>
                Familiya <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                style={{
                  ...S.formInput,
                  borderColor: e('lastName') ? '#dc2626' : border,
                }}
                value={rh.lastName}
                onChange={(ev) => onChange('lastName', ev.target.value)}
                placeholder="Familiya"
              />
              {e('lastName') && (
                <span style={{ color: '#dc2626', fontSize: 11 }}>
                  {e('lastName')}
                </span>
              )}
            </div>
            <div style={S.formField}>
              <label style={S.formLabel}>
                Ism <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                style={{
                  ...S.formInput,
                  borderColor: e('firstName') ? '#dc2626' : border,
                }}
                value={rh.firstName}
                onChange={(ev) => onChange('firstName', ev.target.value)}
                placeholder="Ism"
              />
              {e('firstName') && (
                <span style={{ color: '#dc2626', fontSize: 11 }}>
                  {e('firstName')}
                </span>
              )}
            </div>
          </div>
          <div style={S.formField}>
            <label style={S.formLabel}>
              Pasport raqami <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              style={{
                ...S.formInput,
                borderColor: e('passportNo') ? '#dc2626' : border,
                fontFamily: 'monospace',
              }}
              value={rh.passportNo}
              onChange={(ev) => onChange('passportNo', ev.target.value)}
              placeholder="AA1234567"
              maxLength={9}
            />
            {rh.passportNo && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
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
            {e('passportNo') && (
              <span style={{ color: '#dc2626', fontSize: 11 }}>
                {e('passportNo')}
              </span>
            )}
          </div>
          <div style={S.formField}>
            <label style={S.formLabel}>
              Ulush (%) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              style={{
                ...S.formInput,
                borderColor: e('sharePercentage') ? '#dc2626' : border,
              }}
              type="text"
              inputMode="decimal"
              maxLength={6}
              value={rh.sharePercentage}
              onChange={(ev) => onChange('sharePercentage', ev.target.value)}
              placeholder="0.00"
            />
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Maks: {maxShare}%
            </span>
            {e('sharePercentage') && (
              <span style={{ color: '#dc2626', fontSize: 11 }}>
                {e('sharePercentage')}
              </span>
            )}
          </div>
        </div>
        <div style={{ ...S.formField, position: 'relative' }}>
          <label style={S.formLabel}>
            Mualliflik rollari <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div
            onClick={() => {
              const isOpen = isCreate
                ? openCreateRolesDropdownIdx === idx
                : openEditRolesDropdownIdx === idx
              if (isCreate) {
                setOpenCreateRolesDropdownIdx(isOpen ? null : idx)
              } else {
                setOpenEditRolesDropdownIdx(isOpen ? null : idx)
              }
            }}
            style={{
              ...S.formInput,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              minHeight: '38px',
              boxSizing: 'border-box',
              userSelect: 'none',
              borderColor: e('authorRoles') ? '#dc2626' : border,
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
                        ? r.localizedName?.uz || r.localizedName?.ru || r.name
                        : id
                    })
                    .join(', ')
                : 'Rollarini tanlang...'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              {(
                isCreate
                  ? openCreateRolesDropdownIdx === idx
                  : openEditRolesDropdownIdx === idx
              )
                ? '▲'
                : '▼'}
            </span>
          </div>

          {(isCreate
            ? openCreateRolesDropdownIdx === idx
            : openEditRolesDropdownIdx === idx) && (
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
                onClick={(ev) => {
                  ev.stopPropagation()
                  if (isCreate) {
                    setOpenCreateRolesDropdownIdx(null)
                  } else {
                    setOpenEditRolesDropdownIdx(null)
                  }
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
                onClick={(ev) => ev.stopPropagation()}
              >
                {authorRoles.map((role) => {
                  const selectedRoles = rh.authorRoles || []
                  const isChecked = selectedRoles.includes(String(role.id))
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
                            ? '#2e384e'
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
                            : [...selectedRoles, String(role.id)]
                          if (isCreate) {
                            setCreateForm((f) => {
                              const newRh = [...f.rightHolders]
                              newRh[idx] = {
                                ...newRh[idx],
                                authorRoles: newRoles,
                              }
                              return { ...f, rightHolders: newRh }
                            })
                          } else {
                            setEditForm((f) => {
                              const newRh = [...f.rightHolders]
                              newRh[idx] = {
                                ...newRh[idx],
                                authorRoles: newRoles,
                              }
                              return { ...f, rightHolders: newRh }
                            })
                          }
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
          {e('authorRoles') && (
            <span style={{ color: '#dc2626', fontSize: 11 }}>
              {e('authorRoles')}
            </span>
          )}
        </div>
      </div>
    )
  }

  /* ─── RENDER ──────────────────────────────────────────────── */
  return (
    <div style={S.page} ref={tableRef}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .cw-row { transition: background-color 0.15s; }
        .cw-row:hover { background-color: ${hoverRowBg} !important; }
        .gov-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:none; cursor:pointer; transition:all 0.12s; }
        .gov-btn:disabled { opacity:.5; cursor:not-allowed; }
        .edit-btn { background:${isDark ? '#2d281a' : '#fef9c3'}; color:#ca8a04; border:1px solid ${isDark ? '#3f381f' : '#fef08a'}; }
        .edit-btn:hover:not(:disabled) { background:#ca8a04; color:#fff; }
        .submit-btn { background:${isDark ? '#1e2c38' : '#e0f2fe'}; color:#2C4F8A; border:1px solid ${isDark ? '#2a3b4e' : '#B9C6DC'}; }
        .submit-btn:hover:not(:disabled) { background:#2C4F8A; color:#fff; }
        .view-btn { background:${isDark ? '#232b3c' : '#e0f2fe'}; color:#0284c7; border:1px solid ${isDark ? '#334155' : '#bae6fd'}; }
        .view-btn:hover:not(:disabled) { background:#0284c7; color:#fff; }
      `}</style>

      {/* Toasts */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10001,
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
              gap: 12,
              background: t.type === 'success' ? '#2E7D32' : '#C62828',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 500,
              minWidth: 260,
              maxWidth: 360,
              animation: 'fadeUp .25s ease both',
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                padding: 2,
              }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={S.toolbar}>
        {/* Left: search bar */}
        <div style={S.searchWrap}>
          <RiSearchLine size={15} color="#94a3b8" style={S.searchIcon} />
          <input
            style={S.searchInput}
            placeholder="Asar nomini qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Right: + button */}
        <button style={S.addBtn} onClick={handleOpenCreate}>
          <RiAddLine size={17} />
          Asar yaratish
        </button>
      </div>

      {/* ── Table card ── */}
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
            style={{ fontSize: 13.5, fontWeight: 600, color: textSecondary }}
          >
            Jami: {total} ta asar
          </span>
          <button
            style={S.refreshBtn}
            onClick={() => load(page, pageSize, debouncedSearch)}
            title="Yangilash"
          >
            <RiRefreshLine size={16} />
          </button>
        </div>

        {loading ? (
          <div style={S.center}>
            <div style={S.spinner} />
          </div>
        ) : works.length === 0 ? (
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
                  <th style={{ ...S.th, width: 46 }}>№</th>
                  <th style={S.th}>Nomi</th>
                  <th style={S.th}>Turi</th>
                  <th style={S.th}>Holati</th>
                  <th style={S.th}>Haq egalari</th>
                  <th style={S.th}>Yaratilgan</th>
                  <th style={{ ...S.th, width: 130 }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {works.map((w, idx) => {
                  const status = w.state || w.status || 'DRAFT'
                  return (
                    <tr
                      key={w.id}
                      className="cw-row"
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
                        <span style={S.typeBadge}>
                          {getWorkTypeName(w.workTypeId)}
                        </span>
                      </td>
                      <td style={S.td}>
                        <StatusBadge status={status} />
                      </td>
                      <td
                        style={{ ...S.td, color: textSecondary, fontSize: 13 }}
                      >
                        {w.rightHolders?.length || 0} kishi
                      </td>
                      <td
                        style={{ ...S.td, color: textSecondary, fontSize: 13 }}
                      >
                        {w.createdAt || '—'}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="gov-btn view-btn"
                            title="Batafsil"
                            disabled={actionLoading}
                            onClick={() => setDetailWork(w)}
                          >
                            <RiFileTextLine size={14} />
                          </button>
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
                          {status === 'DRAFT' && (
                            <button
                              className="gov-btn submit-btn"
                              title="Ko'rib chiqishga yuborish"
                              disabled={actionLoading}
                              onClick={() => handleSubmitTrigger(w)}
                            >
                              <RiSendPlane2Line size={14} />
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

        {totalPages > 1 && (
          <div style={S.pagination}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {total} tadan {(page - 1) * pageSize + 1}–
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

      {/* ── Detail Modal ── */}
      {detailWork && (
        <div style={M.overlay}>
          <div style={{ ...M.box, background: cardBg, maxWidth: 640 }}>
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
            <div style={{ ...M.body, maxHeight: 480, overflowY: 'auto' }}>
              <div style={S.detailGrid}>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Nomi:</span>
                  <span style={S.detailVal}>{detailWork.name || '—'}</span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Turi:</span>
                  <span style={S.detailVal}>
                    {getWorkTypeName(detailWork.workTypeId)}
                  </span>
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
                  <span style={S.detailLabel}>Yaratilgan:</span>
                  <span style={S.detailVal}>{detailWork.createdAt || '—'}</span>
                </div>
                <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                  <span style={S.detailLabel}>Tavsifi:</span>
                  <div
                    style={{
                      ...S.detailVal,
                      whiteSpace: 'pre-wrap',
                      background: altRowBg,
                      padding: 12,
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                      fontWeight: 'normal',
                    }}
                  >
                    {detailWork.description || '—'}
                  </div>
                </div>
                {detailWork.rightHolders?.length > 0 && (
                  <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                    <span style={S.detailLabel}>Haq egalari:</span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      {detailWork.rightHolders.map((rh, i) => (
                        <div key={i} style={S.holderDetailBox}>
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
                            <RiUserLine size={14} color="var(--accent)" />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: textColor,
                              }}
                            >
                              {[rh.lastName, rh.firstName]
                                .filter(Boolean)
                                .join(' ') || '—'}
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
                              Ulush: {rh.sharePercentage || 0}%
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
                              <strong>Pasport:</strong> {rh.passportNo || '—'}
                            </div>
                            <div>
                              <strong>Roli:</strong>{' '}
                              {getAuthorRoleNames(rh.authorRoleIds || [])}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
              {detailWork.state === 'DRAFT' && (
                <>
                  <button
                    className="gov-btn edit-btn"
                    style={{
                      width: 'auto',
                      padding: '6px 14px',
                      height: 'auto',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    disabled={actionLoading}
                    onClick={() => {
                      setDetailWork(null)
                      handleOpenEdit(detailWork)
                    }}
                  >
                    <RiEditLine size={14} style={{ marginRight: 4 }} />{' '}
                    Tahrirlash
                  </button>
                  <button
                    className="gov-btn submit-btn"
                    style={{
                      width: 'auto',
                      padding: '6px 14px',
                      height: 'auto',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                    disabled={actionLoading}
                    onClick={() => {
                      setDetailWork(null)
                      handleSubmitTrigger(detailWork)
                    }}
                  >
                    <RiSendPlane2Line size={14} style={{ marginRight: 4 }} />{' '}
                    Yuborish
                  </button>
                </>
              )}
              <button
                type="button"
                style={{
                  ...M.cancelBtn,
                  color: textSecondary,
                  borderColor: border,
                  background: cardBg,
                  marginLeft: 'auto',
                }}
                onClick={() => setDetailWork(null)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingWork && (
        <div style={M.overlay}>
          <form
            onSubmit={handleEditSubmit}
            style={{ ...M.box, background: cardBg }}
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
            <div style={{ ...M.body, maxHeight: 460, overflowY: 'auto' }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={S.formField}>
                  <label style={S.formLabel}>
                    Asar nomi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    style={S.formInput}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        name: e.target.value.slice(0, 500),
                      }))
                    }
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
                          : 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {(editForm.name || '').length}/500
                  </div>
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>
                    Asar turi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    style={{
                      ...S.filterSelect,
                      width: '100%',
                      minWidth: 'auto',
                    }}
                    value={editForm.workTypeId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, workTypeId: e.target.value }))
                    }
                  >
                    <option value="">Tanlang...</option>
                    {workTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.localizedName?.uz || t.localizedName?.ru || t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={S.formField}>
                  <label style={S.formLabel}>Tavsifi</label>
                  <textarea
                    style={S.formTextarea}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value.slice(0, 500),
                      }))
                    }
                    rows={3}
                    placeholder="Tavsif..."
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
                          : 'var(--text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {(editForm.description || '').length}/500
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 4,
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
                      <RiAddLine size={14} /> <span>Qo'shish</span>
                    </button>
                  </div>
                  {editForm.rightHolders.map((rh, idx) =>
                    renderHolderFields(rh, idx, false)
                  )}
                </div>
                {editError && (
                  <div
                    style={{
                      background: isDark ? 'rgba(198,40,40,0.12)' : '#fff5f5',
                      border: '1px solid #fca5a5',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <span
                      style={{
                        color: '#C62828',
                        fontSize: 12.5,
                        fontWeight: 500,
                      }}
                    >
                      ⚠️ {editError}
                    </span>
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
                style={{ ...M.saveBtn }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Create Work Modal ── */}
      {createModalOpen && (
        <div style={M.overlay}>
          <div style={{ ...M.box, background: cardBg, maxWidth: 700 }}>
            <div style={{ ...M.header, borderColor: border }}>
              <h3 style={{ ...M.title, color: 'var(--accent)' }}>
                {selectedUser
                  ? `Asar yaratish — ${[selectedUser.lastName, selectedUser.firstName].filter(Boolean).join(' ')}`
                  : 'Asar yaratish'}
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={M.closeBtn}
                disabled={createSaving}
              >
                <RiCloseLine size={18} />
              </button>
            </div>

            <div style={{ ...M.body, maxHeight: 540, overflowY: 'auto' }}>
              {selectedUser === null ? (
                /* ── Step 1: find user ── */
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div
                    style={{
                      background: isDark ? 'rgba(56,189,248,0.1)' : '#f0f9ff',
                      color: isDark ? '#38bdf8' : '#0369a1',
                      border: `1px solid ${isDark ? 'rgba(56,189,248,0.2)' : '#bae6fd'}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <RiAlertLine size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>
                      Avval asar egasini (foydalanuvchini) qidirib toping va
                      tanlang.
                    </span>
                  </div>
                  <div style={S.formField}>
                    <label style={S.formLabel}>Foydalanuvchini qidirish</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={{ ...S.formInput, flex: 1 }}
                        value={createSearch}
                        onChange={(e) => setCreateSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          (e.preventDefault(), handleUserSearch(createSearch))
                        }
                        placeholder="Ism, Familiya yoki PINFL..."
                      />
                      <button
                        type="button"
                        style={S.applyBtn}
                        onClick={() => handleUserSearch(createSearch)}
                        disabled={createSearchLoading}
                      >
                        {createSearchLoading ? 'Qidirilmoqda...' : 'Qidirish'}
                      </button>
                    </div>
                  </div>

                  {createSearchLoading && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '20px 0',
                      }}
                    >
                      <div style={S.spinner} />
                    </div>
                  )}

                  {!createSearchLoading && createUsersList.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <label style={S.formLabel}>
                        Natijalar ({createUsersList.length} ta):
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          maxHeight: 260,
                          overflowY: 'auto',
                        }}
                      >
                        {createUsersList.map((u) => (
                          <div
                            key={u.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: `1px solid ${border}`,
                              background: altRowBg,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: textColor,
                                }}
                              >
                                {[u.lastName, u.firstName, u.middleName]
                                  .filter(Boolean)
                                  .join(' ')}
                              </span>
                              <span
                                style={{ fontSize: 12, color: textSecondary }}
                              >
                                <strong>PINFL:</strong> {u.pinfl || '—'} |{' '}
                                <strong>Pasport:</strong>{' '}
                                {u.passportNo || u.passportSeria || '—'}
                              </span>
                            </div>
                            <button
                              type="button"
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--accent)',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              onClick={() => handleSelectUser(u)}
                            >
                              Tanlash
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!createSearchLoading &&
                    createSearch.trim() &&
                    createUsersList.length === 0 && (
                      <p
                        style={{
                          textAlign: 'center',
                          color: textSecondary,
                          fontSize: 13.5,
                        }}
                      >
                        Foydalanuvchi topilmadi.
                      </p>
                    )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: 10,
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
                      onClick={() => setCreateModalOpen(false)}
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Step 2: work form ── */
                <form
                  onSubmit={handleCreateSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  {/* Selected user banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: isDark ? '#1e293b' : '#f0fdf4',
                      border: `1px solid ${isDark ? '#334155' : '#bbf7d0'}`,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <RiUserLine size={20} color="#16a34a" />
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: textSecondary,
                            fontWeight: 600,
                          }}
                        >
                          Asar kimning nomidan:
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isDark ? '#4ade80' : '#15803d',
                          }}
                        >
                          {[selectedUser.lastName, selectedUser.firstName]
                            .filter(Boolean)
                            .join(' ')}
                        </div>
                        <div style={{ fontSize: 12, color: textSecondary }}>
                          PINFL: {selectedUser.pinfl || '—'} | Pasport:{' '}
                          {selectedUser.passportNo ||
                            selectedUser.passportSeria ||
                            '—'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: `1px solid ${border}`,
                        background: cardBg,
                        color: textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedUser(null)}
                    >
                      O'zgartirish
                    </button>
                  </div>

                  {/* Work fields */}
                  <div style={S.formField}>
                    <label style={S.formLabel}>
                      Asar nomi <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      style={{
                        ...S.formInput,
                        borderColor: createValidationErrors.name
                          ? '#dc2626'
                          : border,
                      }}
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Asar nomi"
                      maxLength={500}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        fontSize: '11px',
                        color:
                          (createForm.name || '').length > 450
                            ? '#dc2626'
                            : textSecondary,
                        marginTop: '2px',
                      }}
                    >
                      {(createForm.name || '').length}/500
                    </div>
                    {createValidationErrors.name && (
                      <span style={{ color: '#dc2626', fontSize: 11 }}>
                        {createValidationErrors.name}
                      </span>
                    )}
                  </div>

                  <div style={S.formField}>
                    <label style={S.formLabel}>
                      Asar turi <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      style={{
                        ...S.filterSelect,
                        width: '100%',
                        minWidth: 'auto',
                        borderColor: createValidationErrors.workTypeId
                          ? '#dc2626'
                          : border,
                      }}
                      value={createForm.workTypeId}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          workTypeId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Tanlang...</option>
                      {workTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.localizedName?.uz || t.localizedName?.ru || t.name}
                        </option>
                      ))}
                    </select>
                    {createValidationErrors.workTypeId && (
                      <span style={{ color: '#dc2626', fontSize: 11 }}>
                        {createValidationErrors.workTypeId}
                      </span>
                    )}
                  </div>

                  <div style={S.formField}>
                    <label style={S.formLabel}>Tavsifi</label>
                    <textarea
                      style={S.formTextarea}
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Tavsif..."
                      maxLength={500}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        fontSize: '11px',
                        color:
                          (createForm.description || '').length > 450
                            ? '#dc2626'
                            : textSecondary,
                        marginTop: '2px',
                      }}
                    >
                      {(createForm.description || '').length}/500
                    </div>
                  </div>

                  {/* Right holders */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      marginTop: 4,
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
                        onClick={handleAddCreateHolder}
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
                        <RiAddLine size={14} /> <span>Qo'shish</span>
                      </button>
                    </div>
                    {createForm.rightHolders.map((rh, idx) =>
                      renderHolderFields(rh, idx, true)
                    )}
                  </div>

                  {/* Error block */}
                  {createError && (
                    <div
                      style={{
                        background: isDark ? 'rgba(198,40,40,0.12)' : '#fff5f5',
                        border: '1px solid #fca5a5',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      {createError.split(' | ').map((line, i) => (
                        <span
                          key={i}
                          style={{
                            color: '#C62828',
                            fontSize: 12.5,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 6,
                          }}
                        >
                          <span style={{ marginTop: 2, flexShrink: 0 }}>
                            ⚠️
                          </span>
                          <span>{line}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 12,
                      paddingTop: 4,
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
                      onClick={() => setCreateModalOpen(false)}
                      disabled={createSaving}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      style={{ ...M.saveBtn }}
                      disabled={createSaving}
                    >
                      {createSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
