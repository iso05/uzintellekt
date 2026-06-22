// src/pages/Users/UsersList.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  RiUserLine, RiSearchLine, RiRefreshLine,
  RiLockLine, RiLockUnlockLine, RiArrowLeftLine, RiArrowRightLine,
  RiArrowUpLine, RiArrowDownLine, RiCloseLine, RiSaveLine,
  RiAddLine, RiDeleteBinLine
} from 'react-icons/ri'
import FieldError from '../../components/FieldError'
import { maskName, maskPassport, maskShare } from '../../utils/inputMasks'
import { validatePassport, validateName, validateShare } from '../../utils/validators'

const STATE_CONFIG = {
  ACTIVE:   { label: 'Faol',     bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  BLOCKED:  { label: 'Bloklangan', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  CREATED:  { label: 'Nofaol',   bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
  INACTIVE: { label: 'Nofaol',   bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
}

function StateBadge({ state }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.INACTIVE
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>{cfg.label}</span>
  )
}

const WORK_STATE_CONFIG = {
  DRAFT:      { label: "Qoralama",             bg: '#EEF1F6', color: '#5A6478', border: '#C5CDD8' },
  PENDING:    { label: "Ko'rib chiqilmoqda",   bg: '#FEF5E7', color: '#C8922A', border: '#F0C060' },
  REGISTERED: { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#2E7D32', border: '#7DCB9E' },
  APPROVED:   { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#2E7D32', border: '#7DCB9E' },
  REJECTED:   { label: "Rad etilgan",          bg: '#FDEEEE', color: '#C0392B', border: '#F5AAAA' },
  CANCELLED:  { label: "Bekor qilingan",       bg: '#F0F0F0', color: '#9AA5B8', border: '#D0D7E2' },
}

function WorkStatusBadge({ status }) {
  const cfg = WORK_STATE_CONFIG[status] || { label: status || 'Noma’lum', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

function SortIndicator({ field, currentSort }) {
  if (currentSort.selector !== field) {
    return <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10, opacity: 0.5 }}>⇅</span>
  }
  return currentSort.desc
    ? <RiArrowDownLine size={12} color="var(--accent)" style={{ marginLeft: 6 }} />
    : <RiArrowUpLine size={12} color="var(--accent)" style={{ marginLeft: 6 }} />
}

export default function UsersList() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'

  const [users, setUsers]             = useState([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(0)
  const [page, setPage]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  
  // Search state
  const [search, setSearch]           = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchField, setSearchField] = useState('lastName')

  // Dropdown filter state
  const [filterState, setFilterState] = useState('')
  const [filterType, setFilterType]   = useState('')

  // Sort state
  const [sort, setSort]               = useState({ selector: 'id', desc: true })
  
  // Inline action state
  const [actionId, setActionId]       = useState(null)

  // User Details Modal states
  const [modalOpen, setModalOpen]     = useState(false)
  const [modalUserId, setModalUserId] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalUser, setModalUser]     = useState(null)
  const [modalError, setModalError]   = useState(null)
  const [modalSaving, setModalSaving] = useState(false)
  const [activeTab, setActiveTab]     = useState('edit') // 'edit' | 'works'

  // Works list inside modal state
  const [userWorks, setUserWorks] = useState([])
  const [userWorksLoading, setUserWorksLoading] = useState(false)
  const [userWorksError, setUserWorksError] = useState(null)

  // Work dictionaries state
  const [workTypes, setWorkTypes] = useState([])
  const [authorRoles, setAuthorRoles] = useState([])

  // Form states
  const [isCreatingWork, setIsCreatingWork] = useState(false)
  const [newWorkForm, setNewWorkForm] = useState({
    name: '',
    description: '',
    workTypeId: '',
    rightHolders: []
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [workSaving, setWorkSaving] = useState(false)

  // Edit form states
  const [editPseudonym, setEditPseudonym] = useState('')
  const [editPhones, setEditPhones]       = useState([''])
  const [phoneErrors, setPhoneErrors]     = useState([])

  const loadDictionaries = async () => {
    if (workTypes.length > 0 && authorRoles.length > 0) return
    try {
      const [wtRes, arRes] = await Promise.all([
        api.get('/api/v1/dictionaries/work-types').catch(() => ({ data: [] })),
        api.get('/api/v1/dictionaries/author-roles').catch(() => ({ data: [] }))
      ])
      setWorkTypes(wtRes.data?.content ?? wtRes.data ?? [])
      setAuthorRoles(arRes.data?.content ?? arRes.data ?? [])
    } catch (e) {
      console.error('Failed to load dictionaries', e)
    }
  }

  const loadUserWorks = async (userId) => {
    setUserWorksLoading(true)
    setUserWorksError(null)
    try {
      const { data } = await api.get('/api/v1/works/grid', {
        params: {
          gridRequest: JSON.stringify({
            page: 1,
            size: 100,
            filters: [{ field: 'userId', operator: 'eq', value: String(userId) }],
            sort: { selector: 'createdAt', desc: true }
          })
        }
      })
      setUserWorks(data?.items ?? data?.content ?? [])
    } catch (e) {
      console.error('Failed to load user works', e)
      setUserWorksError(e.response?.data?.errorMessage || e.message || 'Asarlarni yuklashda xatolik yuz berdi.')
    } finally {
      setUserWorksLoading(false)
    }
  }

  const isFormDirty = () => {
    if (newWorkForm.name.trim()) return true
    if (newWorkForm.description.trim()) return true
    if (newWorkForm.workTypeId) return true
    if (newWorkForm.rightHolders.length > 1) return true
    const rh = newWorkForm.rightHolders[0]
    if (rh && (rh.passportNo.trim() || rh.firstName.trim() || rh.lastName.trim() || rh.sharePercentage || rh.authorRoles.length > 0)) {
      return true
    }
    return false
  }

  const handleCancelCreateWork = () => {
    if (isFormDirty()) {
      if (!confirm("Kiritilgan ma'lumotlar yo'qolishi haqida tasdiqlash: bekor qilishni xohlaysizmi?")) {
        return
      }
    }
    setIsCreatingWork(false)
    setValidationErrors({})
  }

  const handleCloseModal = () => {
    if (isCreatingWork && isFormDirty()) {
      if (!confirm("Asar yaratish formasi to'ldirilgan. Ma'lumotlar yo'qolishi mumkin. Modalni yopishni tasdiqlaysizmi?")) {
        return
      }
    }
    setModalOpen(false)
    setIsCreatingWork(false)
    setValidationErrors({})
  }

  const handleStartCreateWork = () => {
    loadDictionaries()
    const userPass = modalUser?.passportNo || modalUser?.passportSeria || ''
    const userFirst = modalUser?.firstName || ''
    const userLast = modalUser?.lastName || ''
    
    setNewWorkForm({
      name: '',
      description: '',
      workTypeId: '',
      rightHolders: [
        {
          passportNo: userPass,
          firstName: userFirst,
          lastName: userLast,
          sharePercentage: '100',
          authorRoles: []
        }
      ]
    })
    setIsCreatingWork(true)
    setValidationErrors({})
  }

  const handleAddNewWorkHolder = () => {
    setNewWorkForm(prev => ({
      ...prev,
      rightHolders: [...prev.rightHolders, { passportNo: '', firstName: '', lastName: '', sharePercentage: '', authorRoles: [] }]
    }))
  }

  const handleRemoveNewWorkHolder = (idx) => {
    if (newWorkForm.rightHolders.length <= 1) return
    setNewWorkForm(prev => {
      const nextHolders = [...prev.rightHolders]
      nextHolders.splice(idx, 1)
      return { ...prev, rightHolders: nextHolders }
    })
  }

  const handleNewWorkFieldBlur = (idx, key, val) => {
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
    setValidationErrors(prev => {
      const copy = { ...prev }
      if (err) {
        copy[fieldKey] = err
      } else {
        delete copy[fieldKey]
      }
      return copy
    })
  }

  const handleNewWorkHolderFieldChange = (idx, key, val) => {
    setNewWorkForm(prev => {
      const nextHolders = [...prev.rightHolders]
      let finalVal = val
      if (key === 'passportNo') {
        finalVal = maskPassport(val)
      } else if (key === 'firstName' || key === 'lastName') {
        finalVal = maskName(val)
      } else if (key === 'sharePercentage') {
        finalVal = maskShare(val)
        const sumOther = nextHolders.reduce((sum, item, i) => {
          if (i === idx) return sum
          return sum + (Number(item.sharePercentage) || 0)
        }, 0)
        const maxAllowed = Math.max(0, 100 - sumOther)
        const numVal = Number(finalVal)
        if (!isNaN(numVal) && numVal > maxAllowed) {
          finalVal = String(Number(maxAllowed.toFixed(4)))
        }
      }
      nextHolders[idx] = { ...nextHolders[idx], [key]: finalVal }
      return { ...prev, rightHolders: nextHolders }
    })

    const fieldKey = `rightHolders[${idx}].${key}`
    setValidationErrors(prev => {
      const copy = { ...prev }
      delete copy[fieldKey]
      return copy
    })
  }

  const handleNewWorkHolderRoleSelect = (idx, roleId) => {
    setNewWorkForm(prev => {
      const nextHolders = [...prev.rightHolders]
      const currentRoles = nextHolders[idx].authorRoles
      let newRoles = []
      if (currentRoles.includes(roleId)) {
        newRoles = currentRoles.filter(r => r !== roleId)
      } else {
        newRoles = [...currentRoles, roleId]
      }
      nextHolders[idx] = { ...nextHolders[idx], authorRoles: newRoles }
      return { ...prev, rightHolders: nextHolders }
    })

    const fieldKey = `rightHolders[${idx}].authorRoles`
    setValidationErrors(prev => {
      const copy = { ...prev }
      delete copy[fieldKey]
      return copy
    })
  }

  const handleCreateWorkSubmit = async (e) => {
    e.preventDefault()
    setValidationErrors({})
    setUserWorksError(null)

    const errors = {}

    // Local validation
    if (!newWorkForm.name.trim()) {
      errors['name'] = "Asar nomi kiritilishi shart."
    }
    if (!newWorkForm.workTypeId) {
      errors['workTypeId'] = "Asar turini tanlang."
    }

    const totalShare = newWorkForm.rightHolders.reduce((sum, rh) => sum + (Number(rh.sharePercentage) || 0), 0)
    let totalShareErr = null
    if (Math.abs(totalShare - 100) > 0.0001) {
      totalShareErr = `Haq egalarining jami ulushi 100% bo'lishi shart. Hozirgi jami: ${totalShare}%`
      setUserWorksError(totalShareErr)
    }

    newWorkForm.rightHolders.forEach((rh, i) => {
      const passportErr = validatePassport(rh.passportNo)
      if (passportErr) errors[`rightHolders[${i}].passportNo`] = passportErr

      const firstNameErr = validateName(rh.firstName, 'Ism')
      if (firstNameErr) errors[`rightHolders[${i}].firstName`] = firstNameErr

      const lastNameErr = validateName(rh.lastName, 'Familiya')
      if (lastNameErr) errors[`rightHolders[${i}].lastName`] = lastNameErr

      const shareErr = validateShare(rh.sharePercentage)
      if (shareErr) errors[`rightHolders[${i}].sharePercentage`] = shareErr

      if (!rh.authorRoles || rh.authorRoles.length === 0) {
        errors[`rightHolders[${i}].authorRoles`] = "Kamida bitta muallif roli tanlang."
      }
    })

    if (Object.keys(errors).length > 0 || totalShareErr) {
      setValidationErrors(errors)
      if (!totalShareErr) {
        setUserWorksError("Iltimos, kiritilgan ma'lumotlarni tekshiring.")
      }
      
      let targetId = ""
      const firstKey = Object.keys(errors)[0]
      if (firstKey) {
        if (firstKey.includes('rightHolders')) {
          const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
          if (match) {
            targetId = `new-holder-field-${match[1]}-${match[2]}`
          }
        } else {
          targetId = `new-form-field-${firstKey}`
        }
      } else if (totalShareErr) {
        targetId = `new-share-total-bar`
      }
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setWorkSaving(true)
    try {
      const payload = {
        name: newWorkForm.name.trim(),
        description: newWorkForm.description.trim() || undefined,
        workTypeId: Number(newWorkForm.workTypeId),
        rightHolders: newWorkForm.rightHolders.map(rh => ({
          passportNo: rh.passportNo.trim(),
          firstName: rh.firstName.trim(),
          lastName: rh.lastName.trim(),
          sharePercentage: Number(rh.sharePercentage),
          authorRoles: rh.authorRoles.map(Number)
        }))
      }

      await api.post(`/api/v1/admin/users/${modalUserId}/works`, payload)
      
      alert("Asar muvaffaqiyatli yaratildi")
      setIsCreatingWork(false)
      loadUserWorks(modalUserId)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 422) {
        const errorsMap = {}
        if (Array.isArray(err.response?.data?.errors)) {
          err.response.data.errors.forEach(e => {
            if (e.field) {
              let uzMsg = e.defaultMessage || e.message || "Xatolik"
              if (uzMsg.toLowerCase().includes("passport")) {
                uzMsg = "Pasport seriya/raqami noto'g'ri (AA1234567 formatida)"
              } else if (uzMsg.toLowerCase().includes("firstname") || uzMsg.toLowerCase().includes("first name")) {
                uzMsg = "Ism kiritilishi shart"
              } else if (uzMsg.toLowerCase().includes("lastname") || uzMsg.toLowerCase().includes("last name")) {
                uzMsg = "Familiya kiritilishi shart"
              } else if (uzMsg.toLowerCase().includes("share")) {
                uzMsg = "Ulush 0.01 dan 100 gacha bo'lishi kerak"
              }
              errorsMap[e.field] = uzMsg
            }
          })
        }
        setValidationErrors(errorsMap)
        setUserWorksError("Validatsiya xatosi yuz berdi. Iltimos, formani tekshiring.")
        
        const firstKey = Object.keys(errorsMap)[0]
        let targetId = ""
        if (firstKey) {
          if (firstKey.includes('rightHolders')) {
            const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
            if (match) {
              targetId = `new-holder-field-${match[1]}-${match[2]}`
            }
          } else {
            targetId = `new-form-field-${firstKey}`
          }
          const el = document.getElementById(targetId)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      } else {
        setUserWorksError(err.response?.data?.errorMessage || err.message || "Asar yaratishda xatolik yuz berdi.")
      }
    } finally {
      setWorkSaving(false)
    }
  }

  // Geography states and URLs
  const GEO_REGIONS_URL = 'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json'
  const GEO_DISTRICTS_URL = 'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json'

  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])

  const [addressRegion, setAddressRegion] = useState('')
  const [addressDistrict, setAddressDistrict] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressHouse, setAddressHouse] = useState('')

  const parseAddress = (addressStr) => {
    if (!addressStr) return { region: '', district: '', street: '', house: '' }
    const parts = addressStr.split(',').map(p => p.trim())
    if (parts.length >= 4) {
      return {
        region: parts[0],
        district: parts[1],
        street: parts[2],
        house: parts[3]
      }
    }
    return { region: '', district: '', street: addressStr, house: '' }
  }

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const [regionsRes, districtsRes] = await Promise.all([
          fetch(GEO_REGIONS_URL).then(r => r.json()),
          fetch(GEO_DISTRICTS_URL).then(r => r.json())
        ])
        setRegions(regionsRes)
        setDistricts(districtsRes)
      } catch (err) {
        console.error('Failed to load geo data', err)
      }
    }
    fetchGeoData()
  }, [])

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  const handleRowDoubleClick = async (userId) => {
    setActiveTab('edit')
    setIsCreatingWork(false)
    setModalUserId(userId)
    setModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    setModalUser(null)
    try {
      // Load geography data if not loaded yet
      let rList = regions
      let dList = districts
      if (rList.length === 0 || dList.length === 0) {
        const [regionsRes, districtsRes] = await Promise.all([
          fetch(GEO_REGIONS_URL).then(r => r.json()),
          fetch(GEO_DISTRICTS_URL).then(r => r.json())
        ])
        rList = regionsRes
        dList = districtsRes
        setRegions(regionsRes)
        setDistricts(districtsRes)
      }

      const { data } = await api.get(`/api/v1/admin/users/${userId}`)
      setModalUser(data)
      setEditPseudonym(data?.pseudonym || '')
      if (data?.phones && data.phones.length > 0) {
        const parsedPhones = data.phones.map(p => {
          if (p.startsWith('998') && p.length === 12) {
            return p.substring(3)
          }
          return p
        })
        setEditPhones(parsedPhones)
        setPhoneErrors(new Array(parsedPhones.length).fill(''))
      } else {
        setEditPhones([''])
        setPhoneErrors([''])
      }

      // Parse current address and pre-select dropdowns
      const parsed = parseAddress(data?.address || '')
      let matchedRegionId = ''
      let matchedDistrictId = ''
      
      const regionObj = rList.find(r => r.name.toLowerCase() === parsed.region.toLowerCase())
      if (regionObj) {
        matchedRegionId = String(regionObj.id)
        const districtsFiltered = dList.filter(d => d.region_id === regionObj.id)
        const districtObj = districtsFiltered.find(d => d.name.toLowerCase() === parsed.district.toLowerCase())
        if (districtObj) {
          matchedDistrictId = String(districtObj.id)
        }
      }
      
      setAddressRegion(matchedRegionId)
      setAddressDistrict(matchedDistrictId)
      setAddressStreet(parsed.street || '')
      setAddressHouse(parsed.house || '')
    } catch (e) {
      setModalError(e.response?.data?.errorMessage || e.message || 'Foydalanuvchi ma’lumotlarini yuklashda xatolik yuz berdi.')
    } finally {
      setModalLoading(false)
    }
  }

  const handlePhoneChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').substring(0, 9)
    setEditPhones(prev => {
      const next = [...prev]
      next[index] = cleanValue
      return next
    })
    setPhoneErrors(prev => {
      const next = [...prev]
      next[index] = ''
      return next
    })
  }

  const handleAddPhone = () => {
    setEditPhones(prev => {
      if (prev.length >= 2) return prev
      return [...prev, '']
    })
    setPhoneErrors(prev => {
      if (prev.length >= 2) return prev
      return [...prev, '']
    })
  }

  const handleRemovePhone = (index) => {
    setEditPhones(prev => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
    setPhoneErrors(prev => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!addressRegion || !addressDistrict || !addressStreet.trim() || !addressHouse.trim()) {
      setModalError('Barcha manzil maydonlarini (viloyat, tuman, ko‘cha, uy) to‘ldirish majburiy.')
      return
    }

    const regionObj = regions.find(r => String(r.id) === addressRegion)
    const districtObj = districts.find(d => String(d.id) === addressDistrict)
    if (!regionObj || !districtObj) {
      setModalError('Viloyat yoki tuman tanlanmagan.')
      return
    }

    let phoneValidationError = false
    const newPhoneErrors = new Array(editPhones.length).fill('')
    const cleanPhones = []
    
    for (let i = 0; i < editPhones.length; i++) {
      const p = editPhones[i].trim()
      if (!p) {
        newPhoneErrors[i] = 'Telefon raqamini kiritish majburiy.'
        phoneValidationError = true
      } else if (p.length !== 9) {
        newPhoneErrors[i] = 'To‘liq kiriting (masalan: 901234567).'
        phoneValidationError = true
      } else {
        cleanPhones.push('998' + p)
      }
    }
    
    setPhoneErrors(newPhoneErrors)
    if (phoneValidationError) {
      setModalError('Iltimos, telefon raqamlarini to‘g‘ri kiriting.')
      return
    }

    setModalSaving(true)
    setModalError(null)
    try {
      const finalAddress = `${regionObj.name}, ${districtObj.name}, ${addressStreet.trim()}, ${addressHouse.trim()}`
      const payload = {
        pseudonym: editPseudonym.trim() || null,
        address: finalAddress,
        phones: cleanPhones,
        role: modalUser?.role || 'USER'
      }
      await api.patch(`/api/v1/admin/users/${modalUserId}`, payload)
      setModalOpen(false)
      load(page)
    } catch (e) {
      setModalError(e.response?.data?.errorMessage || e.message || 'Ma’lumotlarni saqlashda xatolik yuz berdi.')
    } finally {
      setModalSaving(false)
    }
  }

  const SIZE = 15

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch users from API using Salvadore1987/datagrid request payload format
  const load = useCallback(async (currentPage) => {
    setLoading(true)
    setError(null)
    try {
      const filters = []
      
      if (debouncedSearch.trim()) {
        filters.push({
          field: searchField,
          operator: 'lk',
          value: debouncedSearch.trim()
        })
      }
      
      if (filterState) {
        if (filterState === 'ACTIVE') {
          filters.push({
            field: 'state',
            operator: 'eq',
            value: 'ACTIVE'
          })
          filters.push({
            field: 'isMember',
            operator: 'eq',
            value: 'true'
          })
        } else if (filterState === 'BLOCKED') {
          filters.push({
            field: 'state',
            operator: 'eq',
            value: 'BLOCKED'
          })
        } else if (filterState === 'CREATED') {
          filters.push({
            field: 'isMember',
            operator: 'eq',
            value: 'false'
          })
        }
      }

      // Filter by type using legalName presence (PHYSICAL users have legalName null, LEGAL entities have legalName not null)
      if (filterType) {
        if (filterType === 'PHYSICAL') {
          filters.push({
            field: 'legalName',
            operator: 'nu',
            value: 'true'
          })
        } else if (filterType === 'LEGAL') {
          filters.push({
            field: 'legalName',
            operator: 'nn',
            value: 'true'
          })
        }
      }

      const requestPayload = {
        filters,
        sort,
        page: currentPage,
        size: SIZE
      }

      const { data } = await api.get('/api/v1/admin/users/grid', {
        params: {
          gridRequest: JSON.stringify(requestPayload)
        }
      })
      
      setUsers(data?.items ?? [])
      setTotal(data?.totalItems ?? 0)
      setTotalPages(data?.totalPages ?? 0)
    } catch (e) {
      setError(e.response?.data?.errorMessage || e.message || 'Foydalanuvchilarni yuklashda xatolik yuz berdi.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, searchField, filterState, filterType, sort])

  // Load grid when page or dependencies change
  useEffect(() => {
    load(page)
  }, [page, load])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  const handleSearchFieldChange = (e) => {
    setSearchField(e.target.value)
    setPage(0)
  }

  const handleFilterStateChange = (e) => {
    setFilterState(e.target.value)
    setPage(0)
  }

  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value)
    setPage(0)
  }

  const handleSortChange = (field) => {
    setSort(prev => {
      const nextSort = prev.selector === field
        ? { selector: field, desc: !prev.desc }
        : { selector: field, desc: false }
      return nextSort
    })
    setPage(0)
  }

  // Row actions (block/activate)
  const handleBlock = async (userId) => {
    if (!confirm('Foydalanuvchini bloklaysizmi?')) return
    setActionId(userId)
    try {
      await api.patch(`/api/v1/admin/users/${userId}/block`)
      load(page)
    } catch (e) {
      alert(e.response?.data?.errorMessage || e.message || 'Bloklashda xatolik yuz berdi.')
    } finally {
      setActionId(null)
    }
  }

  const handleActivate = async (userId) => {
    if (!confirm('Foydalanuvchini faollashtirasizmi?')) return
    setActionId(userId)
    try {
      await api.patch(`/api/v1/admin/users/${userId}/activate`)
      load(page)
    } catch (e) {
      alert(e.response?.data?.errorMessage || e.message || 'Faollashtirishda xatolik yuz berdi.')
    } finally {
      setActionId(null)
    }
  }

  // Theme-sensitive styles
  const textColor = isDark ? '#f1f2f6' : '#111827'
  const textSecondary = isDark ? '#9094a8' : '#4b5563'
  const border = isDark ? '#2a2d3a' : '#e2e4ec'
  const cardBg = isDark ? '#1a1d27' : '#ffffff'
  const altRowBg = isDark ? '#202432' : '#f8fafc'
  const tableHeaderBg = isDark ? '#13161f' : '#f1f5f9'
  const hoverRowBg = isDark ? '#272b3c' : '#f1f5f9'

  const S = {
    page: { fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: 16 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 20, fontWeight: 800, color: textColor, margin: 0 },
    subtitle: { fontSize: 13, color: textSecondary, margin: '3px 0 0' },
    toolbar: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
    
    // Search group
    searchContainer: { display: 'flex', flex: 1, minWidth: 320, maxWidth: 460, borderRadius: 10, border: `1px solid ${border}`, overflow: 'hidden' },
    selectSearchField: { padding: '9px 12px', border: 'none', borderRight: `1px solid ${border}`, outline: 'none', background: cardBg, color: textColor, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 },
    searchWrap: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' },
    searchInput: { width: '100%', padding: '9px 12px 9px 36px', border: 'none', fontSize: 13.5, outline: 'none', background: cardBg, color: textColor, fontFamily: 'inherit' },

    // Filters group
    filtersRow: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    filterLabel: { fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' },
    filterSelect: { padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: textColor, fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 120 },
    refreshBtn: { width: 36, height: 36, borderRadius: 8, border: `1px solid ${border}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textSecondary, alignSelf: 'flex-end', transition: 'background-color 0.2s' },

    errorBox: { padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)', color: 'var(--danger)', fontSize: 13.5 },
    card: { background: cardBg, borderRadius: 16, border: `1px solid ${border}`, boxShadow: 'var(--shadow)', overflow: 'hidden', animation: 'fadeUp .3s ease both' },
    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 20px', gap: 4 },
    spinner: { width: 32, height: 32, borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' },
    spinnerMini: { width: 12, height: 12, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'currentColor', borderRightColor: 'currentColor', animation: 'spin 0.6s linear infinite', display: 'inline-block' },
    
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${border}`, whiteSpace: 'nowrap', background: tableHeaderBg },
    thActions: { width: 160, padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: `1px solid ${border}`, whiteSpace: 'nowrap', background: tableHeaderBg },
    thContent: { display: 'flex', alignItems: 'center' },
    td: { padding: '13px 14px', fontSize: 13.5, color: textColor, borderBottom: `1px solid ${border}` },
    actionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'opacity 0.2s' },
    
    pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${border}`, flexWrap: 'wrap', gap: 8 },
    pageBtn: { width: 30, height: 30, borderRadius: 7, border: `1px solid ${border}`, background: cardBg, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' },
    pageBtnActive: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
    
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    },
    modalCard: {
      background: cardBg,
      borderRadius: 18,
      border: `1px solid ${border}`,
      width: '100%',
      maxWidth: 580,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: `1px solid ${border}`,
      background: tableHeaderBg
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 800,
      color: textColor,
      margin: 0
    },
    modalCloseBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
      borderRadius: 6,
      transition: 'background-color 0.2s'
    },
    modalContent: {
      padding: 20,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      padding: '14px 20px',
      borderTop: `1px solid ${border}`,
      background: tableHeaderBg
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
      background: altRowBg,
      padding: 14,
      borderRadius: 10,
      border: `1px solid ${border}`
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    },
    infoValue: {
      fontSize: 13,
      fontWeight: 600,
      color: textColor,
      wordBreak: 'break-all'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    },
    formLabel: {
      fontSize: 12,
      fontWeight: 700,
      color: textSecondary
    },
    input: {
      padding: '9px 12px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textColor,
      fontSize: 13.5,
      outline: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
    },
    phoneRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    },
    phoneInputWrap: {
      display: 'flex',
      flex: 1,
      position: 'relative',
      alignItems: 'center'
    },
    phonePrefix: {
      position: 'absolute',
      left: 12,
      fontSize: 13.5,
      color: 'var(--text-muted)',
      fontWeight: 600
    },
    phoneInput: {
      width: '100%',
      padding: '9px 12px 9px 42px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textColor,
      fontSize: 13.5,
      outline: 'none',
      fontFamily: 'inherit'
    },
    iconBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    submitBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '9px 16px',
      borderRadius: 8,
      border: 'none',
      background: 'var(--accent)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 13.5,
      fontWeight: 600,
      transition: 'opacity 0.2s'
    },
    cancelBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '9px 16px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textSecondary,
      cursor: 'pointer',
      fontSize: 13.5,
      fontWeight: 600,
      transition: 'background-color 0.2s'
    }
  }

  const D = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDark ? 'rgba(5, 5, 8, 0.85)' : 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    },
    card: {
      background: isDark ? '#0f111a' : '#ffffff',
      borderRadius: 24,
      border: `1px solid ${border}`,
      width: '100%',
      maxWidth: 720,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      color: textColor
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: `1px solid ${border}`,
      background: isDark ? '#131622' : '#f8fafc'
    },
    title: {
      fontSize: 18,
      fontWeight: 800,
      color: textColor,
      margin: 0
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
      borderRadius: 8,
      transition: 'background-color 0.2s, color 0.2s'
    },
    content: {
      padding: 24,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 12,
      padding: '16px 24px',
      borderTop: `1px solid ${border}`,
      background: isDark ? '#131622' : '#f8fafc'
    },
    infoBox: {
      background: isDark ? '#161927' : '#f1f5f9',
      padding: 18,
      borderRadius: 16,
      border: `1px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    },
    infoName: {
      fontSize: 18,
      fontWeight: 800,
      color: textColor,
      wordBreak: 'break-all'
    },
    infoPinfl: {
      fontSize: 13,
      fontFamily: 'monospace',
      color: textSecondary,
      letterSpacing: '0.05em'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    },
    label: {
      fontSize: 12.5,
      fontWeight: 700,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    input: {
      padding: '11px 14px',
      borderRadius: 10,
      border: `1px solid ${border}`,
      background: isDark ? '#151824' : '#ffffff',
      color: textColor,
      fontSize: 14,
      outline: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    phoneRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    },
    phoneInputWrap: {
      display: 'flex',
      flex: 1,
      position: 'relative',
      alignItems: 'center'
    },
    phonePrefix: {
      position: 'absolute',
      left: 14,
      fontSize: 14,
      color: textSecondary,
      fontWeight: 600
    },
    phoneInput: {
      width: '100%',
      padding: '11px 14px 11px 54px',
      borderRadius: 10,
      border: `1px solid ${border}`,
      background: isDark ? '#151824' : '#ffffff',
      color: textColor,
      fontSize: 14,
      outline: 'none',
      fontFamily: 'inherit',
      letterSpacing: '0.05em'
    },
    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 8,
      border: 'none',
      background: 'var(--accent)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 600,
      transition: 'opacity 0.2s'
    },
    submitBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '11px 20px',
      borderRadius: 10,
      border: 'none',
      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 700,
      boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
      transition: 'all 0.2s'
    },
    cancelBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '11px 20px',
      borderRadius: 10,
      border: `1px solid ${border}`,
      background: 'transparent',
      color: textSecondary,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .th-sortable { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        .th-sortable:hover { background-color: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} !important; }
        .table-row { transition: background-color 0.15s; }
        .table-row:hover { background-color: ${hoverRowBg} !important; }
        
        /* Premium Dark Modal Input styles */
        .dark-input:focus {
          border-color: #a855f7 !important;
          box-shadow: 0 0 0 2px rgba(168,85,247,0.2) !important;
        }
        .dark-close:hover {
          background-color: #1e293b !important;
          color: #ffffff !important;
        }
        .dark-submit:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px);
        }
        .dark-cancel:hover {
          border-color: #475569 !important;
          color: #f8fafc !important;
        }
        .dark-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dark-scroll::-webkit-scrollbar-track {
          background: #0f111a;
        }
        .dark-scroll::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .dark-scroll::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Foydalanuvchilar</h2>
          <p style={S.subtitle}>{total} ta ro'yxatdan o'tgan foydalanuvchi</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        {/* Search */}
        <div style={S.searchContainer}>
          <select
            style={S.selectSearchField}
            value={searchField}
            onChange={handleSearchFieldChange}
          >
            <option value="lastName">Familiya</option>
            <option value="firstName">Ism</option>
            <option value="legalName">Tashkilot nomi</option>
            <option value="pinfl">PINFL</option>
            <option value="inn">INN</option>
          </select>
          <div style={S.searchWrap}>
            <RiSearchLine size={15} color="#94a3b8" style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Qidiruv..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Filters and Refresh */}
        <div style={S.filtersRow}>
          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Holati</label>
            <select
              style={S.filterSelect}
              value={filterState}
              onChange={handleFilterStateChange}
            >
              <option value="">Barchasi</option>
              <option value="ACTIVE">Faol</option>
              <option value="BLOCKED">Bloklangan</option>
              <option value="CREATED">Nofaol</option>
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Turi</label>
            <select
              style={S.filterSelect}
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="">Barchasi</option>
              <option value="PHYSICAL">Jismoniy</option>
              <option value="LEGAL">Yuridik</option>
            </select>
          </div>

          <button style={S.refreshBtn} onClick={() => load(page)} title="Yangilash">
            <RiRefreshLine size={16} />
          </button>
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      {/* Table Card */}
      <div style={S.card}>
        {loading ? (
          <div style={S.center}><div style={S.spinner} /></div>
        ) : users.length === 0 ? (
          <div style={S.center}>
            <RiUserLine size={44} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>
              Foydalanuvchilar topilmadi
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th} className="th-sortable" onClick={() => handleSortChange('lastName')}>
                    <div style={S.thContent}>F.I.O. <SortIndicator field="lastName" currentSort={sort} /></div>
                  </th>
                  <th style={S.th}>Tur</th>
                  <th style={S.th} className="th-sortable" onClick={() => handleSortChange('pinfl')}>
                    <div style={S.thContent}>PINFL / INN <SortIndicator field="pinfl" currentSort={sort} /></div>
                  </th>
                  <th style={S.th}>Telefon</th>
                  <th style={S.th}>A'zolik</th>
                  <th style={S.th} className="th-sortable" onClick={() => handleSortChange('state')}>
                    <div style={S.thContent}>Holat <SortIndicator field="state" currentSort={sort} /></div>
                  </th>
                  <th style={S.thActions}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const fullName = u.legalName ||
                    [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' ') || '—'
                  const isLegal = !!u.legalName || !!u.inn || u.userType === 'LEGAL'
                  
                  const displayState = u.state === 'BLOCKED' || u.status === 'BLOCKED'
                    ? 'BLOCKED'
                    : (u.isMember ? 'ACTIVE' : 'INACTIVE')
                  
                  const isEditable = u.isMember === true

                  return (
                    <tr
                      key={u.id}
                      className="table-row"
                      style={{ background: i % 2 === 1 ? altRowBg : cardBg, cursor: isEditable ? 'pointer' : 'default' }}
                      onDoubleClick={isEditable ? () => handleRowDoubleClick(u.id) : undefined}
                      title={isEditable ? "Batafsil ko'rish va tahrirlash uchun ikki marta bosing" : "Foydalanuvchi a'zo emas (tahrirlab bo'lmaydi)"}
                    >
                      <td style={{ ...S.td, fontWeight: 600, color: textColor, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fullName}
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isLegal ? '#1e40af' : '#93c5fd',
                          color: isLegal ? '#ffffff' : '#1e3a8a'
                        }}>
                          {isLegal ? 'Yuridik' : 'Jismoniy'}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 13, color: textSecondary }}>
                        {u.pinfl || u.inn || '—'}
                      </td>
                      <td style={{ ...S.td, color: textSecondary, fontSize: 13 }}>
                        {u.phones?.[0] || '—'}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: u.isMember ? '#dcfce7' : (isDark ? '#2e3244' : '#f1f5f9'),
                          color: u.isMember ? '#15803d' : (isDark ? '#9094a8' : '#475569'),
                          border: u.isMember ? '1px solid #86efac' : `1px solid ${border}`
                        }}>
                          {u.isMember ? "A'zo" : "A'zo emas"}
                        </span>
                      </td>
                      <td style={S.td}><StateBadge state={displayState} /></td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(u.state === 'ACTIVE' || u.status === 'ACTIVE') ? (
                            <button
                              style={{ ...S.actionBtn, background: '#fee2e2', color: '#b91c1c' }}
                              title="Bloklash"
                              disabled={actionId === u.id}
                              onClick={() => handleBlock(u.id)}
                            >
                              {actionId === u.id ? <span style={S.spinnerMini} /> : <RiLockLine size={13} />}
                              <span>Bloklash</span>
                            </button>
                          ) : (
                            <button
                              style={{ ...S.actionBtn, background: '#dcfce7', color: '#15803d' }}
                              title="Faollashtirish"
                              disabled={actionId === u.id}
                              onClick={() => handleActivate(u.id)}
                            >
                              {actionId === u.id ? <span style={S.spinnerMini} /> : <RiLockUnlockLine size={13} />}
                              <span>Faollashtirish</span>
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
              {total} ta dan {page * SIZE + 1}–{Math.min((page + 1) * SIZE, total)}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{ ...S.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <RiArrowLeftLine size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
                <button
                  key={i}
                  style={{ ...S.pageBtn, ...(i === page ? S.pageBtnActive : {}) }}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                style={{ ...S.pageBtn, opacity: page >= totalPages - 1 ? 0.4 : 1 }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <RiArrowRightLine size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal (Placed at root level to prevent overflow:hidden cropping from S.card) */}
      {modalOpen && (
        <div style={D.overlay} onClick={handleCloseModal}>
          <div style={D.card} onClick={(e) => e.stopPropagation()}>
            <div style={D.header}>
              <h3 style={D.title}>
                {activeTab === 'edit' ? "Foydalanuvchi ma'lumotlarini tahrirlash" : "Foydalanuvchining asarlari"}
              </h3>
              <button className="dark-close" style={D.closeBtn} onClick={handleCloseModal}>
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Modal Tabs */}
            {!modalLoading && modalUser && (
              <div style={{
                display: 'flex',
                borderBottom: `1px solid ${border}`,
                background: isDark ? '#131622' : '#f8fafc',
                padding: '0 24px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isCreatingWork) {
                      if (!confirm("Asar yaratish arizasi bekor qilinadi. Ishonchingiz komilmi?")) return
                    }
                    setIsCreatingWork(false)
                    setActiveTab('edit')
                  }}
                  style={{
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: activeTab === 'edit' ? 'var(--accent)' : textSecondary,
                    borderBottom: activeTab === 'edit' ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('works')
                    loadUserWorks(modalUserId)
                  }}
                  style={{
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: activeTab === 'works' ? 'var(--accent)' : textSecondary,
                    borderBottom: activeTab === 'works' ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Asarlar
                </button>
              </div>
            )}

            {modalLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12 }}>
                <div style={{ ...S.spinner, borderTopColor: '#a855f7' }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Ma'lumotlar yuklanmoqda...</p>
              </div>
            ) : activeTab === 'edit' ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="dark-scroll" style={D.content}>
                  {modalError && (
                    <div style={{ ...S.errorBox, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                      <span>⚠️ {modalError}</span>
                    </div>
                  )}

                  {modalUser && (
                    <>
                      {/* Name & PINFL Card */}
                      <div style={D.infoBox}>
                        <div style={D.infoName}>
                          {modalUser.legalName || [modalUser.lastName, modalUser.firstName, modalUser.middleName].filter(Boolean).join(' ') || '—'}
                        </div>
                        <div style={D.infoPinfl}>
                          {modalUser.legalName || modalUser.userType === 'LEGAL' ? 'INN' : 'PINFL / INN'}: {modalUser.pinfl || modalUser.inn || '—'}
                        </div>
                        <div style={{ ...D.infoPinfl, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>A'zolik holati:</span>
                          <span style={{
                            color: modalUser.isMember ? '#22c55e' : '#94a3b8',
                            fontWeight: 'bold'
                          }}>
                            {modalUser.isMember ? "A'zo" : "A'zo emas"}
                          </span>
                        </div>
                      </div>


                      {/* Address Selectors (Viloyat & Tuman) */}
                      <div style={D.formRow}>
                        <div style={D.formGroup}>
                          <label style={D.label}>Viloyat <span style={{ color: '#ef4444' }}>*</span></label>
                          <select
                            className="dark-input"
                            style={D.input}
                            value={addressRegion}
                            onChange={(e) => {
                              setAddressRegion(e.target.value)
                              setAddressDistrict('')
                            }}
                            required
                          >
                            <option value="" style={{ background: '#151824', color: '#64748b' }}>Viloyatni tanlang</option>
                            {regions.map(r => (
                              <option key={r.id} value={String(r.id)} style={{ background: '#151824', color: '#f8fafc' }}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={D.formGroup}>
                          <label style={D.label}>Tuman/Shahar <span style={{ color: '#ef4444' }}>*</span></label>
                          <select
                            className="dark-input"
                            style={D.input}
                            value={addressDistrict}
                            onChange={(e) => setAddressDistrict(e.target.value)}
                            disabled={!addressRegion}
                            required
                          >
                            <option value="" style={{ background: '#151824', color: '#64748b' }}>
                              {addressRegion ? 'Tumanni tanlang' : 'Avval viloyat tanlang'}
                            </option>
                            {districts.filter(d => String(d.region_id) === addressRegion).map(d => (
                              <option key={d.id} value={String(d.id)} style={{ background: '#151824', color: '#f8fafc' }}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Address Inputs (Street & House) */}
                      <div style={D.formRow}>
                        <div style={D.formGroup}>
                          <label style={D.label}>Ko'cha nomi <span style={{ color: '#ef4444' }}>*</span></label>
                          <input
                            type="text"
                            className="dark-input"
                            style={D.input}
                            value={addressStreet}
                            onChange={(e) => setAddressStreet(e.target.value)}
                            placeholder="Masalan: Mustaqillik ko'chasi"
                            required
                          />
                        </div>

                        <div style={D.formGroup}>
                          <label style={D.label}>Uy raqami <span style={{ color: '#ef4444' }}>*</span></label>
                          <input
                            type="text"
                            className="dark-input"
                            style={D.input}
                            value={addressHouse}
                            onChange={(e) => setAddressHouse(e.target.value)}
                            placeholder="Masalan: 45-uy"
                            required
                          />
                        </div>
                      </div>

                      {/* Taxallusi / Pseudonym */}
                      <div style={D.formGroup}>
                        <label style={D.label}>Taxallusi / Pseudonym</label>
                        <input
                          type="text"
                          className="dark-input"
                          style={D.input}
                          value={editPseudonym}
                          onChange={(e) => setEditPseudonym(e.target.value)}
                          placeholder="Taxallusi bo'lsa kiriting"
                        />
                      </div>

                      {/* Dynamic Phones list */}
                      <div style={D.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={D.label}>Telefon raqamlari <span style={{ color: '#ef4444' }}>*</span></label>
                          {editPhones.length < 2 && (
                            <button
                              type="button"
                              style={D.addBtn}
                              onClick={handleAddPhone}
                            >
                              <RiAddLine size={14} />
                              <span>Qo'shish</span>
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                          {editPhones.map((phone, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={D.phoneRow}>
                                <div style={D.phoneInputWrap}>
                                  <span style={D.phonePrefix}>+998</span>
                                  <input
                                    type="text"
                                    className="dark-input"
                                    style={D.phoneInput}
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(idx, e.target.value)}
                                    placeholder="901234567"
                                    required
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={editPhones.length === 1}
                                  style={{
                                    ...S.iconBtn,
                                    background: editPhones.length === 1 ? 'transparent' : 'rgba(239,68,68,0.15)',
                                    color: editPhones.length === 1 ? '#475569' : '#f87171',
                                    cursor: editPhones.length === 1 ? 'not-allowed' : 'pointer',
                                    opacity: editPhones.length === 1 ? 0.3 : 1
                                  }}
                                  onClick={() => handleRemovePhone(idx)}
                                  title="O'chirish"
                                >
                                  <RiDeleteBinLine size={16} />
                                </button>
                              </div>
                              {phoneErrors[idx] && (
                                <div style={{ color: '#f87171', fontSize: '12px', fontWeight: '500', marginLeft: 4, marginTop: 2 }}>
                                  ⚠️ {phoneErrors[idx]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={D.footer}>
                  <button className="dark-cancel" type="button" style={D.cancelBtn} onClick={() => setModalOpen(false)} disabled={modalSaving}>
                    Bekor qilish
                  </button>
                  <button className="dark-submit" type="submit" style={D.submitBtn} disabled={modalSaving}>
                    {modalSaving ? <span style={S.spinnerMini} /> : <RiSaveLine size={16} />}
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Works Tab Content */
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="dark-scroll" style={D.content}>
                  {userWorksError && (
                    <div style={{ ...S.errorBox, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                      <span>⚠️ {userWorksError}</span>
                    </div>
                  )}

                  {isCreatingWork ? (
                    /* Create Work Form */
                    <form onSubmit={handleCreateWorkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Name */}
                      <div style={S.formField}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <label style={S.formLabel}>Asar nomi <span style={{ color: '#ef4444' }}>*</span></label>
                          <span style={{ fontSize: 11, color: textSecondary }}>
                            {500 - (newWorkForm.name || '').length} belgi qoldi
                          </span>
                        </div>
                        <input
                          id="new-form-field-name"
                          type="text"
                          className="dark-input"
                          style={{ ...S.formInput, borderColor: validationErrors.name ? '#ef4444' : border }}
                          maxLength={500}
                          value={newWorkForm.name}
                          onChange={e => {
                            setNewWorkForm(prev => ({ ...prev, name: e.target.value }))
                            if (validationErrors.name) {
                              setValidationErrors(v => {
                                const copy = { ...v }
                                delete copy.name
                                return copy
                              })
                            }
                          }}
                          placeholder="Asar nomini kiriting"
                          required
                        />
                        <FieldError error={validationErrors.name} />
                      </div>

                      {/* Description */}
                      <div style={S.formField}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <label style={S.formLabel}>Tavsifi (Ixtiyoriy)</label>
                          <span style={{ fontSize: 11, color: textSecondary }}>
                            {500 - (newWorkForm.description || '').length} belgi qoldi
                          </span>
                        </div>
                        <textarea
                          id="new-form-field-description"
                          className="dark-input"
                          style={{ ...S.formTextarea, borderColor: validationErrors.description ? '#ef4444' : border }}
                          maxLength={500}
                          value={newWorkForm.description}
                          onChange={e => {
                            setNewWorkForm(prev => ({ ...prev, description: e.target.value }))
                            if (validationErrors.description) {
                              setValidationErrors(v => {
                                const copy = { ...v }
                                delete copy.description
                                return copy
                              })
                            }
                          }}
                          placeholder="Asar tavsifini kiriting"
                          rows={3}
                        />
                        <FieldError error={validationErrors.description} />
                      </div>

                      {/* Work Type */}
                      <div style={S.formField}>
                        <label style={S.formLabel}>Asar turi <span style={{ color: '#ef4444' }}>*</span></label>
                        <select
                          id="new-form-field-workTypeId"
                          className="dark-input"
                          style={{ ...S.formInput, borderColor: validationErrors.workTypeId ? '#ef4444' : border }}
                          value={newWorkForm.workTypeId}
                          onChange={e => {
                            setNewWorkForm(prev => ({ ...prev, workTypeId: e.target.value }))
                            if (validationErrors.workTypeId) {
                              setValidationErrors(v => {
                                const copy = { ...v }
                                delete copy.workTypeId
                                return copy
                              })
                            }
                          }}
                          required
                        >
                          <option value="" style={{ background: '#151824', color: '#64748b' }}>Asar turini tanlang</option>
                          {workTypes.map(wt => {
                            const name = wt.localizedName?.uz || wt.localizedName?.ru || wt.localizedName?.en || wt.name
                            return (
                              <option key={wt.id} value={String(wt.id)} style={{ background: '#151824', color: '#f8fafc' }}>
                                {name}
                              </option>
                            )
                          })}
                        </select>
                        <FieldError error={validationErrors.workTypeId} />
                      </div>

                      {/* Right Holders / Authors */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ ...S.formLabel, fontSize: 14 }}>
                            Huquq egalari va hammualliflar <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <button
                            type="button"
                            style={D.addBtn}
                            onClick={handleAddNewWorkHolder}
                          >
                            <RiAddLine size={14} />
                            <span>Qo'shish</span>
                          </button>
                        </div>

                        {newWorkForm.rightHolders.map((rh, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: `1px solid ${border}`,
                              borderRadius: 12,
                              padding: 16,
                              background: isDark ? '#161927' : '#f1f5f9',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                                {idx + 1}-ishtirokchi
                              </span>
                              {newWorkForm.rightHolders.length > 1 && (
                                <button
                                  type="button"
                                  style={{
                                    border: 'none',
                                    background: 'rgba(239,68,68,0.15)',
                                    color: '#f87171',
                                    borderRadius: 6,
                                    padding: '4px 8px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleRemoveNewWorkHolder(idx)}
                                >
                                  O'chirish
                                </button>
                              )}
                            </div>

                            <div style={S.editRow}>
                              {/* Passport */}
                              <div style={S.formField}>
                                <label style={S.formLabel}>Pasport (AA1234567) <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  id={`new-holder-field-${idx}-passportNo`}
                                  type="text"
                                  className="dark-input"
                                  style={{ ...S.formInput, borderColor: validationErrors[`rightHolders[${idx}].passportNo`] ? '#ef4444' : border, fontFamily: 'monospace' }}
                                  value={rh.passportNo}
                                  onChange={e => handleNewWorkHolderFieldChange(idx, 'passportNo', e.target.value)}
                                  onBlur={e => handleNewWorkFieldBlur(idx, 'passportNo', e.target.value)}
                                  placeholder="Pasport raqami"
                                  maxLength={9}
                                  required
                                />
                                {rh.passportNo && (
                                  <div style={{ fontSize: '11px', color: '#6B7A8D', marginTop: '2px', fontFamily: 'monospace' }}>
                                    {(() => {
                                      const len = rh.passportNo.length
                                      if (len === 0) return ''
                                      const letters = rh.passportNo.slice(0, 2)
                                      const digits = rh.passportNo.slice(2)
                                      const underscores = '_'.repeat(9 - len)
                                      return len <= 2 ? `Seriya: ${letters}${underscores}` : `${letters}${digits}${underscores}`
                                    })()}
                                  </div>
                                )}
                                <FieldError error={validationErrors[`rightHolders[${idx}].passportNo`]} />
                              </div>

                              {/* Share */}
                              <div style={S.formField}>
                                <label style={S.formLabel}>Ulush (%) <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  id={`new-holder-field-${idx}-sharePercentage`}
                                  type="text"
                                  inputMode="decimal"
                                  className="dark-input"
                                  style={{ ...S.formInput, borderColor: validationErrors[`rightHolders[${idx}].sharePercentage`] ? '#ef4444' : border }}
                                  value={rh.sharePercentage}
                                  onChange={e => handleNewWorkHolderFieldChange(idx, 'sharePercentage', e.target.value)}
                                  onBlur={e => handleNewWorkFieldBlur(idx, 'sharePercentage', e.target.value)}
                                  placeholder="Masalan: 100"
                                  maxLength={6}
                                  required
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                                  {(() => {
                                    const sumOther = newWorkForm.rightHolders.reduce((sum, item, i) => {
                                      if (i === idx) return sum
                                      return sum + (Number(item.sharePercentage) || 0)
                                    }, 0)
                                    const maxAllowed = Math.max(0, 100 - sumOther)
                                    const total = newWorkForm.rightHolders.reduce((sum, item) => sum + (Number(item.sharePercentage) || 0), 0)
                                    return maxAllowed > 0 
                                      ? `Maksimal kiritish mumkin: ${maxAllowed}% (yana ${100 - total}% bo'sh ulush bor)` 
                                      : "Barcha ulush taqsimlangan (0% qoldi)"
                                  })()}
                                </span>
                                <FieldError error={validationErrors[`rightHolders[${idx}].sharePercentage`]} />
                              </div>
                            </div>

                            <div style={S.editRow}>
                              {/* Last Name */}
                              <div style={S.formField}>
                                <label style={S.formLabel}>Familiya <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  id={`new-holder-field-${idx}-lastName`}
                                  type="text"
                                  className="dark-input"
                                  style={{ ...S.formInput, borderColor: validationErrors[`rightHolders[${idx}].lastName`] ? '#ef4444' : border }}
                                  value={rh.lastName}
                                  onChange={e => handleNewWorkHolderFieldChange(idx, 'lastName', e.target.value)}
                                  onBlur={e => handleNewWorkFieldBlur(idx, 'lastName', e.target.value)}
                                  placeholder="Familiya"
                                  required
                                />
                                <FieldError error={validationErrors[`rightHolders[${idx}].lastName`]} />
                              </div>

                              {/* First Name */}
                              <div style={S.formField}>
                                <label style={S.formLabel}>Ism <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  id={`new-holder-field-${idx}-firstName`}
                                  type="text"
                                  className="dark-input"
                                  style={{ ...S.formInput, borderColor: validationErrors[`rightHolders[${idx}].firstName`] ? '#ef4444' : border }}
                                  value={rh.firstName}
                                  onChange={e => handleNewWorkHolderFieldChange(idx, 'firstName', e.target.value)}
                                  onBlur={e => handleNewWorkFieldBlur(idx, 'firstName', e.target.value)}
                                  placeholder="Ism"
                                  required
                                />
                                <FieldError error={validationErrors[`rightHolders[${idx}].firstName`]} />
                              </div>
                            </div>

                            {/* Author Roles */}
                            <div style={S.formField}>
                              <label style={S.formLabel}>Mualliflik rollari <span style={{ color: '#ef4444' }}>*</span></label>
                              <div style={S.roleGrid}>
                                {authorRoles.map(role => {
                                  const roleName = role.localizedName?.uz || role.name
                                  const isChecked = rh.authorRoles.includes(String(role.id))
                                  return (
                                    <label
                                      key={role.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 12.5,
                                        cursor: 'pointer',
                                        color: textColor
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleNewWorkHolderRoleSelect(idx, String(role.id))}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <span>{roleName}</span>
                                    </label>
                                  )
                                })}
                              </div>
                              <FieldError error={validationErrors[`rightHolders[${idx}].authorRoles`]} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total share summary bar */}
                      {(() => {
                        const total = newWorkForm.rightHolders.reduce((sum, item) => sum + (Number(item.sharePercentage) || 0), 0)
                        const isOk = Math.abs(total - 100) < 0.0001
                        return (
                          <div 
                            id="new-share-total-bar"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: isOk ? (isDark ? 'rgba(46,125,50,0.15)' : '#E8F5EE') : (isDark ? 'rgba(198,40,40,0.15)' : '#FDEEEE'),
                              border: `1px solid ${isOk ? (isDark ? '#1e3f20' : '#7DCB9E') : (isDark ? '#3f1f21' : '#F5AAAA')}`,
                              color: isOk ? (isDark ? '#4ade80' : '#2E7D32') : (isDark ? '#f87171' : '#C0392B'),
                              marginTop: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
                              <span>{isOk ? '✓' : '✗'}</span>
                              <span>Jami ulush: {total}% / 100%</span>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Footer Actions inside tab container */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                        <button
                          type="button"
                          className="dark-cancel"
                          style={D.cancelBtn}
                          onClick={handleCancelCreateWork}
                          disabled={workSaving}
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="submit"
                          className="dark-submit"
                          style={D.submitBtn}
                          disabled={workSaving}
                        >
                          {workSaving ? <span style={S.spinnerMini} /> : <RiSaveLine size={16} />}
                          <span>Yaratish</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Works list view */
                    <div>
                      {/* Sub-header with Add Work button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: textSecondary }}>
                          Jami: {userWorks.length} ta asar
                        </span>
                        {/* Only show the button if the logged-in admin has permissions */}
                        {['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(user?.raw?.role) && (
                          <button
                            type="button"
                            className="dark-submit"
                            style={D.addBtn}
                            onClick={handleStartCreateWork}
                          >
                            <RiAddLine size={14} />
                            <span>+ Yangi asar yaratish</span>
                          </button>
                        )}
                      </div>

                      {userWorksLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                          <div style={S.spinner} />
                        </div>
                      ) : userWorks.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 8 }}>
                          <RiFileTextLine size={40} color="#cbd5e1" />
                          <span style={{ color: '#94a3b8', fontSize: 13.5, fontWeight: 500 }}>
                            Asarlar topilmadi
                          </span>
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={S.table}>
                            <thead>
                              <tr>
                                <th style={S.th}>Nomi</th>
                                <th style={S.th}>Asar turi</th>
                                <th style={S.th}>Holati</th>
                                <th style={S.th}>Yaratilgan sana</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userWorks.map((w, idx) => {
                                const typeObj = workTypes.find(t => Number(t.id) === Number(w.workTypeId || w.workType?.id))
                                const typeName = typeObj?.localizedName?.uz || typeObj?.name || '—'
                                return (
                                  <tr key={w.id} className="table-row" style={{ background: idx % 2 === 1 ? altRowBg : cardBg }}>
                                    <td style={{ ...S.td, fontWeight: 600 }}>{w.name}</td>
                                    <td style={S.td}>
                                      <span style={S.typeBadge}>{typeName}</span>
                                    </td>
                                    <td style={S.td}>
                                      <WorkStatusBadge status={w.state} />
                                    </td>
                                    <td style={{ ...S.td, fontSize: 12, color: textSecondary }}>
                                      {w.createdAt || '—'}
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
              </div>
            )}
          </div>
        </div>
      )}
      </div>
  )
}
