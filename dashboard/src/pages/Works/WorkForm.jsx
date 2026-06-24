import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createWork, updateWork, getWork, getWorkTypes, getAuthorRoles, submitWork } from '../../services/worksApi'
import { useAuth } from '../../hooks/useAuth'
import {
  RiAddLine, RiDeleteBinLine, RiArrowLeftLine, RiSaveLine,
  RiUser3Line, RiFileTextLine, RiInformationLine, RiSendPlaneLine,
} from 'react-icons/ri'
import { maskName, maskPassport, maskShare } from '../../utils/inputMasks'
import { validatePassport, validateName, validateShare, validateRequired, validateShareTotal } from '../../utils/validators'
import FieldError from '../../components/FieldError'

const EMPTY_HOLDER = { passportNo: '', firstName: '', lastName: '', share: '', authorRoleIds: [] }

const STATE_LABELS = {
  DRAFT: "Qoralama",
  PENDING: "Ko'rib chiqilmoqda",
  REGISTERED: "Tasdiqlangan",
  APPROVED: "Tasdiqlangan",
  REJECTED: "Rad etilgan",
  CANCELLED: "Bekor qilingan",
}

export default function WorkForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ name: '', description: '', workTypeId: '', rightHolders: [{ ...EMPTY_HOLDER }] })
  const [workState, setWorkState]   = useState('DRAFT')
  const [rejectionReason, setRejectionReason] = useState('')
  const [workTypes, setWorkTypes]   = useState([])
  const [authorRoles, setAuthorRoles] = useState([])
  const [loading, setLoading]       = useState(false)
  const [dictLoading, setDictLoading] = useState(true)
  const [error, setError]           = useState(null)
  const [success, setSuccess]       = useState(false)
  
  const [fieldErrors, setFieldErrors] = useState({})
  const [shareTotalError, setShareTotalError] = useState('')
  const [showAuthorCard, setShowAuthorCard] = useState(true)
  const [openRolesDropdownIdx, setOpenRolesDropdownIdx] = useState(null)

  const toggleRole = (holderIdx, roleId) => {
    const stringRoleId = String(roleId)
    setForm(f => {
      const rh = [...f.rightHolders]
      const currentRoles = rh[holderIdx].authorRoleIds || []
      const isChecked = currentRoles.includes(stringRoleId)
      const nextRoles = isChecked
        ? currentRoles.filter(id => id !== stringRoleId)
        : [...currentRoles, stringRoleId]
      rh[holderIdx] = { ...rh[holderIdx], authorRoleIds: nextRoles }
      return { ...f, rightHolders: rh }
    })

    const errorKey = `rightHolders[${holderIdx}].authorRoles`
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[errorKey]
      return next
    })
  }

  const isReadOnly = isEdit && !['DRAFT', 'REJECTED'].includes(workState)
  const inlineErrorStyle = { color: '#C0392B', fontSize: 12, marginTop: 4, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }

  // Load dictionaries
  useEffect(() => {
    Promise.all([getWorkTypes(), getAuthorRoles()])
      .then(([wt, ar]) => {
        setWorkTypes(wt?.content ?? wt ?? [])
        setAuthorRoles(ar?.content ?? ar ?? [])
      })
      .catch(() => setError("Lug'at ma'lumotlari yuklanmadi"))
      .finally(() => setDictLoading(false))
  }, [])

  // Load work details in edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true)
      getWork(id)
        .then(data => {
          if (data) {
            setWorkState(data.state || data.status || 'DRAFT')
            setRejectionReason(data.rejectionReason || '')
            setForm({
              name: data.name || '',
              description: data.description || '',
              workTypeId: data.workTypeId || data.workType?.id || '',
              rightHolders: data.rightHolders && data.rightHolders.length > 0 
                ? data.rightHolders.map(rh => ({
                    passportNo: rh.passportNo || rh.passportSeria || '',
                    firstName: rh.firstName || '',
                    lastName: rh.lastName || '',
                    share: rh.sharePercentage || rh.share || '',
                    authorRoleIds: rh.authorRoleIds && rh.authorRoleIds.length > 0 
                      ? rh.authorRoleIds.map(String) 
                      : (rh.authorRoles && rh.authorRoles.length > 0 
                          ? rh.authorRoles.map(String) 
                          : (rh.authorRoleId 
                              ? [String(rh.authorRoleId)] 
                              : (rh.authorRole?.id ? [String(rh.authorRole?.id)] : [])))
                  }))
                : [{ ...EMPTY_HOLDER }]
            })
          }
        })
        .catch(e => setError("Asar ma'lumotlarini yuklashda xatolik yuz berdi: " + e.message))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const setHolder = (idx, key, val) => {
    setForm(f => {
      const rh = [...f.rightHolders]
      let finalVal = val
      if (key === 'passportNo') {
        finalVal = maskPassport(val)
      } else if (key === 'firstName' || key === 'lastName') {
        finalVal = maskName(val)
      } else if (key === 'share') {
        finalVal = maskShare(val)
      }
      rh[idx] = { ...rh[idx], [key]: finalVal }
      return { ...f, rightHolders: rh }
    })
    setShareTotalError('')
    const errorKeyKey = key === 'share' ? 'sharePercentage' : key === 'authorRoleIds' ? 'authorRoles' : key
    const errorKey = `rightHolders[${idx}].${errorKeyKey}`
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[errorKey]
        return next
      })
    }
  }

  const addHolder = () => setForm(f => ({ ...f, rightHolders: [...f.rightHolders, { ...EMPTY_HOLDER }] }))

  const removeHolder = (idx) => {
    if (form.rightHolders.length === 1) return
    setForm(f => ({ ...f, rightHolders: f.rightHolders.filter((_, i) => i !== idx) }))
    setShareTotalError('')
  }

  const handleFieldBlur = (fieldKey, value, holderIdx = null) => {
    let errMsg = null
    if (holderIdx === null) {
      if (fieldKey === 'name') {
        errMsg = validateRequired(value, "Asar nomi")
      } else if (fieldKey === 'workTypeId') {
        errMsg = validateRequired(value, "Asar turi")
      }
    } else {
      if (fieldKey === 'passportNo') {
        errMsg = validatePassport(value)
      } else if (fieldKey === 'firstName') {
        errMsg = validateName(value, "Ism")
      } else if (fieldKey === 'lastName') {
        errMsg = validateName(value, "Familiya")
      } else if (fieldKey === 'sharePercentage') {
        errMsg = validateShare(value)
      } else if (fieldKey === 'authorRoles') {
        if (!value || value.length === 0) {
          errMsg = "Kamida bitta muallif roli tanlang"
        }
      }
    }
    setFieldErrors(prev => {
      const next = { ...prev }
      const key = holderIdx === null ? fieldKey : `rightHolders[${holderIdx}].${fieldKey}`
      if (errMsg) {
        next[key] = errMsg
      } else {
        delete next[key]
      }
      return next
    })
  }

  const validateForm = () => {
    const errors = {}
    const nameErr = validateRequired(form.name, "Asar nomi")
    if (nameErr) errors['name'] = nameErr

    if (!form.workTypeId) {
      errors['workTypeId'] = "Asar turini tanlang"
    }

    form.rightHolders.forEach((rh, idx) => {
      const passErr = validatePassport(rh.passportNo)
      if (passErr) errors[`rightHolders[${idx}].passportNo`] = passErr

      const fnErr = validateName(rh.firstName, "Ism")
      if (fnErr) errors[`rightHolders[${idx}].firstName`] = fnErr

      const lnErr = validateName(rh.lastName, "Familiya")
      if (lnErr) errors[`rightHolders[${idx}].lastName`] = lnErr

      const shareErr = validateShare(rh.share)
      if (shareErr) errors[`rightHolders[${idx}].sharePercentage`] = shareErr

      if (!rh.authorRoleIds || rh.authorRoleIds.length === 0) {
        errors[`rightHolders[${idx}].authorRoles`] = "Kamida bitta muallif roli tanlang"
      }
    })
    return errors
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})
    setShareTotalError('')
    
    // Front-end Validation
    const totalShare = form.rightHolders.reduce((sum, rh) => sum + (Number(rh.share) || 0), 0)
    let totalError = ''
    if (totalShare !== 100) {
      totalError = "Haq egalarining jami ulush foizi (%) 100 bo'lishi shart."
      setShareTotalError(totalError)
    }

    const errors = validateForm()
    if (Object.keys(errors).length > 0 || totalError) {
      setFieldErrors(errors)
      let scrollTargetId = ''
      const firstKey = Object.keys(errors)[0]
      if (firstKey) {
        if (firstKey.includes('rightHolders')) {
          const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
          if (match) {
            scrollTargetId = `holder-field-${match[1]}-${match[2]}`
          }
        } else {
          scrollTargetId = `form-field-${firstKey}`
        }
      } else if (totalError) {
        scrollTargetId = 'right-holders-total'
      }
      
      const el = document.getElementById(scrollTargetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setLoading(false)
      return
    }

    let isApiCall = false
    try {
      const validRightHolders = form.rightHolders.map(rh => ({
        passportNo: rh.passportNo.trim(),
        firstName: rh.firstName.trim(),
        lastName: rh.lastName.trim(),
        sharePercentage: Number(rh.share),
        authorRoles: (rh.authorRoleIds || []).map(Number)
      }))

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        workTypeId: Number(form.workTypeId),
        rightHolders: validRightHolders,
      }

      isApiCall = true
      
      if (isEdit) {
        await updateWork(id, payload)
      } else {
        await createWork(payload)
      }
      setSuccess("Muvaffaqiyatli saqlandi! Asarlar ro'yxatiga yo'naltirilmoqda...")
      setTimeout(() => navigate('/works'), 1200)
    } catch (e) {
      if (e.apiError && Array.isArray(e.apiError.errors)) {
        const errorsMap = {}
        e.apiError.errors.forEach(apiErr => {
          if (apiErr.fieldName) {
            errorsMap[apiErr.fieldName] = apiErr.message || apiErr.defaultMessage || "Xatolik"
          }
        })
        setFieldErrors(errorsMap)
        const firstKey = Object.keys(errorsMap)[0]
        let scrollTargetId = ''
        if (firstKey) {
          if (firstKey.includes('rightHolders')) {
            const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
            if (match) {
              scrollTargetId = `holder-field-${match[1]}-${match[2]}`
            }
          } else {
            scrollTargetId = `form-field-${firstKey}`
          }
        }
        const el = document.getElementById(scrollTargetId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        const errorSource = isApiCall ? 'BACKEND/API' : 'FRONTEND';
        console.error(`[${errorSource} ERROR]`, e);
        setError(`[${errorSource} XATOLIK] ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndSubmit = async () => {
    setLoading(true)
    setError(null)
    setFieldErrors({})
    setShareTotalError('')
    
    // Front-end Validation
    const totalShare = form.rightHolders.reduce((sum, rh) => sum + (Number(rh.share) || 0), 0)
    let totalError = ''
    if (totalShare !== 100) {
      totalError = "Haq egalarining jami ulush foizi (%) 100 bo'lishi shart."
      setShareTotalError(totalError)
    }

    const errors = validateForm()
    if (Object.keys(errors).length > 0 || totalError) {
      setFieldErrors(errors)
      let scrollTargetId = ''
      const firstKey = Object.keys(errors)[0]
      if (firstKey) {
        if (firstKey.includes('rightHolders')) {
          const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
          if (match) {
            scrollTargetId = `holder-field-${match[1]}-${match[2]}`
          }
        } else {
          scrollTargetId = `form-field-${firstKey}`
        }
      } else if (totalError) {
        scrollTargetId = 'right-holders-total'
      }
      
      const el = document.getElementById(scrollTargetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setLoading(false)
      return
    }

    try {
      const validRightHolders = form.rightHolders.map(rh => ({
        passportNo: rh.passportNo.trim(),
        firstName: rh.firstName.trim(),
        lastName: rh.lastName.trim(),
        sharePercentage: Number(rh.share),
        authorRoles: (rh.authorRoleIds || []).map(Number)
      }))

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        workTypeId: Number(form.workTypeId),
        rightHolders: validRightHolders,
      }

      await updateWork(id, payload)
      
      await submitWork(id)
      
      setSuccess("Asar ko'rib chiqish uchun yuborildi!")
      setTimeout(() => navigate('/works'), 1500)
    } catch (e) {
      if (e.apiError && Array.isArray(e.apiError.errors)) {
        const errorsMap = {}
        e.apiError.errors.forEach(apiErr => {
          if (apiErr.fieldName) {
            errorsMap[apiErr.fieldName] = apiErr.message || apiErr.defaultMessage || "Xatolik"
          }
        })
        setFieldErrors(errorsMap)
        const firstKey = Object.keys(errorsMap)[0]
        let scrollTargetId = ''
        if (firstKey) {
          if (firstKey.includes('rightHolders')) {
            const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
            if (match) {
              scrollTargetId = `holder-field-${match[1]}-${match[2]}`
            }
          } else {
            scrollTargetId = `form-field-${firstKey}`
          }
        }
        const el = document.getElementById(scrollTargetId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        console.error('[WorkForm] Submit for review failed:', e)
        setError(`[XATOLIK] ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fullName = user?.userType === 'LEGAL'
    ? user?.legalName
    : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Foydalanuvchi'
  const roleBadge = user?.userType === 'LEGAL' ? 'YURIDIK SHAXS' : 'JISMONIY SHAXS'

  if (dictLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={S.spinner} />
    </div>
  )

  if (isEdit && ['PENDING', 'REGISTERED', 'CANCELLED'].includes(workState)) {
    return (
      <div className="gov-form-container" style={S.page}>
        <style>{STYLE_CSS}</style>

        <div style={S.header}>
          <button className="gov-btn-back" onClick={() => navigate('/works')}>
            <RiArrowLeftLine size={17} /> Orqaga
          </button>
          <div>
            <h1 style={S.title}>Tahrirlash taqiqlangan</h1>
            <p style={S.subtitle}>Ushbu asar tahrir qilinadigan holatda emas</p>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.errorBox}>
            <RiInformationLine size={16} style={{ flexShrink: 0 }} />
            <span>Bu asar tahrir qilib bo'lmaydi (holati: {STATE_LABELS[workState] || workState}).</span>
          </div>
        </div>
      </div>
    )
  }

  const runningTotal = form.rightHolders.reduce((sum, rh) => sum + (Number(rh.share) || 0), 0)

  const getRemainingShareFor = (idx) => {
    const sumOther = form.rightHolders.reduce((sum, item, i) => {
      if (i === idx) return sum
      return sum + (Number(item.share) || 0)
    }, 0)
    return Math.max(0, 100 - sumOther)
  }

  return (
    <div className="gov-form-container" style={S.page}>
      <style>{STYLE_CSS}</style>

      {/* Header */}
      <div style={S.header}>
        <button className="gov-btn-back" onClick={() => navigate('/works')}>
          <RiArrowLeftLine size={17} /> Orqaga
        </button>
        <div>
          <h1 style={S.title}>
            {isReadOnly ? 'Asar ma\'lumotlari' : isEdit ? 'Asarni tahrirlash' : 'Yangi asar qo\'shish'}
          </h1>
          <p style={S.subtitle}>Intellektual mulk asarini ro'yxatdan o'tkazish</p>
        </div>
      </div>

      {/* Rejection Reason */}
      {workState === 'REJECTED' && rejectionReason && (
        <div style={S.errorBox}>
          <RiInformationLine size={16} style={{ flexShrink: 0 }} />
          <span><strong>Rad etilish sababi:</strong> {rejectionReason}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={S.successBox}>
          ✓ {success === true ? "Muvaffaqiyatli saqlandi! Asarlar ro'yxatiga yo'naltirilmoqda..." : success}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={S.errorBox}>
          <RiInformationLine size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Basic Info */}
        <div className="gov-card">
          <h2 className="gov-card-title"><RiFileTextLine size={17} color="#2C4F8A" /> Asosiy ma'lumotlar</h2>

          <div style={S.fieldGroup}>
            <label style={S.label}>Asar nomi <span style={{ color: '#C0392B' }}>*</span></label>
            <input
              id="form-field-name"
              className={`gov-input ${fieldErrors['name'] ? 'gov-input-error' : ''}`}
              placeholder="Masalan: Bahor fasli"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              onBlur={e => handleFieldBlur('name', e.target.value)}
              required
              maxLength={500}
              disabled={isReadOnly}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: (form.name || '').length > 450 ? '#dc2626' : '#6B7A8D', marginTop: '2px' }}>
              {(form.name || '').length}/500
            </div>
            <FieldError error={fieldErrors['name']} />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Tavsif</label>
            <textarea
              className="gov-input"
              style={{ minHeight: 90, resize: 'vertical' }}
              placeholder="Asar haqida qisqacha ma'lumot..."
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              maxLength={500}
              disabled={isReadOnly}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: (form.description || '').length > 450 ? '#dc2626' : '#6B7A8D', marginTop: '2px' }}>
              {(form.description || '').length}/500
            </div>
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Asar turi <span style={{ color: '#C0392B' }}>*</span></label>
            <select
              id="form-field-workTypeId"
              className={`gov-input ${fieldErrors['workTypeId'] ? 'gov-input-error' : ''}`}
              value={form.workTypeId}
              onChange={e => setField('workTypeId', e.target.value)}
              onBlur={e => handleFieldBlur('workTypeId', e.target.value)}
              required
              disabled={isReadOnly}
            >
              <option value="" style={{ color: '#000000', background: '#ffffff' }}>— Turni tanlang —</option>
              {workTypes.map(wt => (
                <option key={wt.id} value={wt.id} style={{ color: '#000000', background: '#ffffff' }}>
                  {wt.localizedName?.uz || wt.localizedName?.ru || wt.localizedName?.en || wt.name || ''}
                </option>
              ))}
            </select>
            <FieldError error={fieldErrors['workTypeId']} />
          </div>
        </div>

        {/* Right Holders */}
        <div className="gov-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="gov-card-title" style={{ margin: 0 }}><RiUser3Line size={17} color="#2C4F8A" /> Haq egalari</h2>
            {!isReadOnly && showAuthorCard && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#EEF4FB',
                border: '1px solid #B0C0DE',
                borderRadius: '6px',
                fontSize: '12.5px',
                color: '#2C4F8A',
                fontWeight: 600
              }}>
                <span>Men muallifman</span>
                <button
                  type="button"
                  onClick={() => {
                    setForm(f => {
                      const rh = [...f.rightHolders]
                      if (rh.length > 0) {
                        rh[0] = {
                          ...rh[0],
                          passportNo: maskPassport(user?.passportSeria || user?.passportNo || ''),
                          firstName: maskName(user?.firstName || ''),
                          lastName: maskName(user?.lastName || '')
                        }
                      }
                      return { ...f, rightHolders: rh }
                    })
                    setFieldErrors(prev => {
                      const next = { ...prev }
                      delete next['rightHolders[0].passportNo']
                      delete next['rightHolders[0].firstName']
                      delete next['rightHolders[0].lastName']
                      return next
                    })
                    setShowAuthorCard(false)
                  }}
                  style={{
                    background: '#1E7D4A',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Ha"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthorCard(false)}
                  style={{
                    background: '#C0392B',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Yo'q"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {form.rightHolders.map((rh, idx) => (
            <div key={idx} style={S.holderCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={S.holderNum}>#{idx + 1} Haq egasi</span>
                {!isReadOnly && form.rightHolders.length > 1 && (
                  <button type="button" className="gov-btn-remove" style={{ width: 28, height: 28 }} onClick={() => removeHolder(idx)}>
                    <RiDeleteBinLine size={14} />
                  </button>
                )}
              </div>
              <div style={S.holderGrid}>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Pasport seriya/raqam</label>
                  <input
                    id={`holder-field-${idx}-passportNo`}
                    className={`gov-input ${fieldErrors[`rightHolders[${idx}].passportNo`] ? 'gov-input-error' : ''}`}
                    placeholder="AA1234567"
                    value={rh.passportNo}
                    onChange={e => setHolder(idx, 'passportNo', e.target.value)}
                    onBlur={e => handleFieldBlur('passportNo', e.target.value, idx)}
                    maxLength={9}
                    disabled={isReadOnly}
                    style={{ fontFamily: 'monospace' }}
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
                  <FieldError error={fieldErrors[`rightHolders[${idx}].passportNo`]} />
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Ism</label>
                  <input
                    id={`holder-field-${idx}-firstName`}
                    className={`gov-input ${fieldErrors[`rightHolders[${idx}].firstName`] ? 'gov-input-error' : ''}`}
                    placeholder="Ism"
                    value={rh.firstName}
                    onChange={e => setHolder(idx, 'firstName', e.target.value)}
                    onBlur={e => handleFieldBlur('firstName', e.target.value, idx)}
                    disabled={isReadOnly}
                  />
                  <FieldError error={fieldErrors[`rightHolders[${idx}].firstName`]} />
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Familiya</label>
                  <input
                    id={`holder-field-${idx}-lastName`}
                    className={`gov-input ${fieldErrors[`rightHolders[${idx}].lastName`] ? 'gov-input-error' : ''}`}
                    placeholder="Familiya"
                    value={rh.lastName}
                    onChange={e => setHolder(idx, 'lastName', e.target.value)}
                    onBlur={e => handleFieldBlur('lastName', e.target.value, idx)}
                    disabled={isReadOnly}
                  />
                  <FieldError error={fieldErrors[`rightHolders[${idx}].lastName`]} />
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Ulush (%)</label>
                  <input
                    id={`holder-field-${idx}-sharePercentage`}
                    className={`gov-input ${fieldErrors[`rightHolders[${idx}].sharePercentage`] ? 'gov-input-error' : ''}`}
                    type="text"
                    inputMode="decimal"
                    maxLength={6}
                    placeholder="0.00"
                    value={rh.share}
                    onChange={e => setHolder(idx, 'share', e.target.value)}
                    onBlur={e => handleFieldBlur('sharePercentage', e.target.value, idx)}
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                    <span style={{ fontSize: '11.5px', color: '#4F5F74', marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                      {getRemainingShareFor(idx) > 0 
                        ? `Maksimal kiritish mumkin: ${getRemainingShareFor(idx)}% (yana ${100 - runningTotal}% bo'sh ulush bor)` 
                        : "Barcha ulush taqsimlangan (0% qoldi)"}
                    </span>
                  )}
                  <FieldError error={fieldErrors[`rightHolders[${idx}].sharePercentage`]} />
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.label}>Muallif roli <span style={{ color: '#C0392B' }}>*</span></label>
                  <div className="gov-dropdown-container">
                    <div
                      id={`holder-field-${idx}-authorRoles`}
                      className={`gov-dropdown-trigger ${
                        fieldErrors[`rightHolders[${idx}].authorRoles`] ? 'error' : ''
                      } ${isReadOnly ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isReadOnly) return
                        setOpenRolesDropdownIdx(prev => prev === idx ? null : idx)
                      }}
                    >
                      <span className="gov-dropdown-text">
                        {(rh.authorRoleIds || []).length > 0
                          ? rh.authorRoleIds
                              .map(roleId => {
                                const ar = authorRoles.find(r => String(r.id) === String(roleId))
                                return ar ? (ar.localizedName?.uz || ar.localizedName?.ru || ar.localizedName?.en || ar.name || '') : roleId
                              })
                              .filter(Boolean)
                              .join(', ')
                          : '— Rolni tanlang —'}
                      </span>
                      <span className="gov-dropdown-arrow">
                        {openRolesDropdownIdx === idx ? '▲' : '▼'}
                      </span>
                    </div>

                    {openRolesDropdownIdx === idx && !isReadOnly && (
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
                            handleFieldBlur('authorRoles', rh.authorRoleIds, idx)
                          }}
                        />
                        <div
                          className="gov-dropdown-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {authorRoles.map(ar => {
                            const selectedRoles = rh.authorRoleIds || []
                            const isChecked = selectedRoles.includes(String(ar.id))
                            return (
                              <label
                                key={ar.id}
                                className={`gov-dropdown-item ${isChecked ? 'checked' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  className="gov-dropdown-checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleRole(idx, ar.id)}
                                  disabled={isReadOnly}
                                />
                                <span>
                                  {ar.localizedName?.uz || ar.localizedName?.ru || ar.localizedName?.en || ar.name || ''}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <FieldError error={fieldErrors[`rightHolders[${idx}].authorRoles`]} />
                </div>
              </div>
            </div>
          ))}

          {/* Running total section */}
          <div id="right-holders-total" style={runningTotal === 100 ? S.totalSummaryBarOk : S.totalSummaryBarError}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
              <span>{runningTotal === 100 ? '✓' : '✗'}</span>
              <span>Jami ulush: {runningTotal}% / 100%</span>
            </div>
            {shareTotalError && (
              <span style={{ color: '#C0392B', fontSize: 12, fontWeight: 600, marginTop: 4, display: 'block' }}>
                {shareTotalError}
              </span>
            )}
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={addHolder}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1.5px dashed #B0C0DE',
                background: '#EEF4FB',
                color: '#2C4F8A',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <RiAddLine size={16} /> Haq egasi qo'shish
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="gov-btn-cancel" onClick={() => navigate('/works')}>
            {isReadOnly ? 'Orqaga' : 'Bekor qilish'}
          </button>
          
          {!isReadOnly && (
            <button type="submit" className="gov-btn-primary" disabled={loading}>
              {loading ? <div className="spinner-btn" /> : <RiSaveLine size={17} />}
              {isEdit ? "Saqlash" : "Yaratish"}
            </button>
          )}

          {!isReadOnly && isEdit && workState === 'DRAFT' && (
            <button
              type="button"
              className="gov-btn-submit"
              disabled={loading}
              onClick={handleSaveAndSubmit}
            >
              {loading ? <div className="spinner-btn" /> : <RiSendPlaneLine size={17} />}
              Ko'rib chiqishga yuborish
            </button>
          )}
        </div>

      </form>
    </div>
  )
}

const STYLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.gov-form-container {
  font-family: 'Inter', sans-serif !important;
  color: #1E2A3B;
}

.gov-card {
  background-color: #FFFFFF;
  border: 1px solid #DDE2EC;
  border-top: 3px solid #2C4F8A;
  border-radius: 6px;
  padding: 24px 28px;
  box-shadow: 0 1px 6px rgba(44,79,138,0.07);
  margin-bottom: 18px;
}

.gov-card-title {
  border-left: 3px solid #C49A2A;
  padding-left: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 13px;
  color: #2C4F8A;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
}

.gov-input {
  width: 100%;
  border: 1.5px solid #D5DCE8;
  border-radius: 5px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 400;
  color: #1E2A3B;
  background-color: #FAFBFD;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.gov-input:focus {
  border-color: #4A7DC4;
  box-shadow: 0 0 0 3px rgba(74,125,196,0.12);
  background-color: #FFFFFF;
}

.gov-input::placeholder {
  color: #99A8BB;
}

.gov-input:disabled {
  background-color: #EDF0F7;
  color: #6B7A8D;
  cursor: not-allowed;
  border-color: #DDE2EC;
}

.gov-input-error {
  border-color: #C0392B !important;
  background-color: #FEF8F8 !important;
  box-shadow: 0 0 0 3px rgba(192,57,43,0.08) !important;
}

select.gov-input {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='%232C4F8A' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 20px;
  padding-right: 40px;
}

.gov-btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid #2C4F8A;
  color: #2C4F8A;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.15s ease;
}

.gov-btn-back:hover {
  background-color: #2C4F8A;
  color: #FFFFFF;
}

.gov-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #2C4F8A;
  color: #FFFFFF;
  border: none;
  border-radius: 5px;
  padding: 10px 26px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-primary:hover {
  background-color: #3D64A8;
  box-shadow: 0 2px 8px rgba(44,79,138,0.25);
}

.gov-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gov-btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #2E7D51;
  color: #FFFFFF;
  border: none;
  border-radius: 5px;
  padding: 10px 26px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-submit:hover {
  background-color: #246040;
}

.gov-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gov-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #EEF1F7;
  border: 1.5px solid #C8D0DE;
  color: #4F5F74;
  border-radius: 5px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-cancel:hover {
  background-color: #E2E7F0;
}

.gov-btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #EEF4FB;
  border: 1.5px solid #4A7DC4;
  color: #2C4F8A;
  border-radius: 5px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-add:hover {
  background-color: #2C4F8A;
  color: #FFFFFF;
}

.gov-btn-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #FEF0F0;
  border: none;
  color: #C0392B;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-remove:hover {
  background-color: #FDDEDE;
}

.spinner-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #FFFFFF;
  animation: spin 0.8s linear infinite;
}

/* Custom Multi-select Dropdown */
.gov-dropdown-container {
  position: relative;
  width: 100%;
}
.gov-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  min-height: 41px;
  background-color: #FAFBFD;
  border: 1.5px solid #D5DCE8;
  border-radius: 5px;
  padding: 8px 14px;
  font-size: 14px;
  color: #1E2A3B;
  transition: all 0.15s ease;
  user-select: none;
  box-sizing: border-box;
}
.gov-dropdown-trigger:hover:not(.disabled) {
  border-color: #4A7DC4;
}
.gov-dropdown-trigger.disabled {
  background-color: #EDF0F7;
  color: #6B7A8D;
  cursor: not-allowed;
  border-color: #DDE2EC;
}
.gov-dropdown-trigger.error {
  border-color: #C0392B !important;
  background-color: #FEF8F8 !important;
}
.gov-dropdown-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
.gov-dropdown-arrow {
  font-size: 10px;
  color: #4F5F74;
}
.gov-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: #FFFFFF;
  border: 1px solid #DDE2EC;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(44,79,138,0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gov-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13.5px;
  color: #1E2A3B;
  transition: background-color 0.15s ease;
  user-select: none;
  margin: 0;
}
.gov-dropdown-item:hover {
  background-color: #F0F5FB;
}
.gov-dropdown-item.checked {
  background-color: #EEF4FB;
  font-weight: 600;
  color: #2C4F8A;
}
.gov-dropdown-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2C4F8A;
  margin: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }
`

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 18 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: '#2C4F8A', margin: 0 },
  subtitle: { fontSize: 13, color: '#4F5F74', margin: '4px 0 0' },
  successBox: { background: '#EBF7EF', borderLeft: '4px solid #2E7D51', color: '#2E7D51', borderRadius: 5, padding: '12px 16px', fontSize: 14, fontWeight: 600 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 5, background: '#FEF0F0', borderLeft: '4px solid #C0392B', color: '#C0392B', fontSize: 14 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: 600, color: '#3A4A5E', marginBottom: 6, display: 'block' },
  holderCard: { background: '#F7F9FC', border: '1px solid #DDE2EC', borderLeft: '4px solid #4A7DC4', borderRadius: 6, padding: '20px 22px', marginBottom: 14 },
  holderNum: { fontSize: 12, fontWeight: 600, color: '#FFFFFF', background: '#2C4F8A', padding: '3px 12px', borderRadius: 3 },
  holderGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 16px' },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid #DDE2EC', borderTopColor: '#2C4F8A', animation: 'spin 0.8s linear infinite' },
  totalSummaryBarOk: {
    background: '#EBF7EF',
    border: '1px solid #7DC49A',
    color: '#2E7D51',
    borderRadius: '5px',
    padding: '10px 16px',
    marginTop: 20,
  },
  totalSummaryBarError: {
    background: '#FEF6F6',
    border: '1px solid #EAA0A0',
    color: '#C0392B',
    borderRadius: '5px',
    padding: '10px 16px',
    marginTop: 20,
  }
}

