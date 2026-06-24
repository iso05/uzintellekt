// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { updateMe } from '../services/api'
import { maskPhone, maskName } from '../utils/inputMasks'
import { validatePhone, validateName, validateRequired } from '../utils/validators'
import FieldError from '../components/FieldError'
import {
  RiUser3Line,
  RiBuilding2Line,
  RiPhoneLine,
  RiMedalLine,
  RiCloseLine,
  RiCheckLine,
  RiIdCardLine,
  RiFileTextLine,
  RiHashtag,
  RiUserLine,
  RiUserSmileLine,
  RiMapPinLine,
  RiPencilLine,
} from 'react-icons/ri'

// ── Ikon komponenti — stilni bir joyda boshqarish uchun ──────────
function FieldIcon({ icon: Icon, color = '#2C4F8A' }) {
  return (
    <span style={S.fieldIconWrap}>
      <Icon size={16} color={color} />
    </span>
  )
}

const GEO_REGIONS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json'
const GEO_DISTRICTS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json'

function SimpleSelect({
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.value === value)
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          background: '#f8fafc',
          border: `1px solid ${open ? '#a855f7' : '#cbd5e1'}`,
          borderRadius: '10px',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'all .2s',
          boxSizing: 'border-box',
          color: selected ? '#0f172a' : '#94a3b8',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <span>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            flexShrink: 0,
            transition: 'transform .2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="#94a3b8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            maxHeight: '180px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            marginTop: '4px',
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
              }}
            >
              Ma'lumot yo'q
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: opt.value === value ? 'rgba(168,85,247,.08)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  color: opt.value === value ? '#a855f7' : '#334155',
                  fontSize: '13.5px',
                  fontWeight: opt.value === value ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (editingKey === 'address') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [editingKey])

  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [phone1Error, setPhone1Error] = useState(null)
  const [phone2Error, setPhone2Error] = useState(null)
  
  const [regions, setRegions] = useState([])
  const [allDistricts, setAllDistricts] = useState([])
  const [addressRegion, setAddressRegion] = useState('')
  const [addressDistrict, setAddressDistrict] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressHouse, setAddressHouse] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

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

  const loadGeoAndPreFill = async (currentAddress) => {
    setGeoLoading(true)
    setGeoError(null)
    try {
      let rData = regions
      let dData = allDistricts
      if (rData.length === 0 || dData.length === 0) {
        const [regionsRes, districtsRes] = await Promise.all([
          fetch(GEO_REGIONS_URL).then(r => r.json()),
          fetch(GEO_DISTRICTS_URL).then(r => r.json())
        ])
        rData = regionsRes
        dData = districtsRes
        setRegions(regionsRes)
        setAllDistricts(districtsRes)
      }

      const parsed = parseAddress(currentAddress)
      
      const regionObj = rData.find(r => r.name.toLowerCase() === parsed.region.toLowerCase())
      if (regionObj) {
        setAddressRegion(String(regionObj.id))
        const districtsFiltered = dData.filter(d => d.region_id === regionObj.id)
        const districtObj = districtsFiltered.find(d => d.name.toLowerCase() === parsed.district.toLowerCase())
        if (districtObj) {
          setAddressDistrict(String(districtObj.id))
        } else {
          setAddressDistrict('')
        }
      } else {
        setAddressRegion('')
        setAddressDistrict('')
      }
      setAddressStreet(parsed.street || '')
      setAddressHouse(parsed.house || '')
    } catch (err) {
      setGeoError("Viloyat/tuman ma'lumotlarini yuklab bo'lmadi.")
    } finally {
      setGeoLoading(false)
    }
  }

  if (!user) return null

  const isLegal  = user.userType === 'LEGAL'
  const fullName = isLegal
    ? user.legalName
    : [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ')

  const fields = isLegal
    ? [
        { label: 'Tashkilot nomi', value: user.legalName,             icon: RiBuilding2Line, color: '#2C4F8A' },
        { label: 'INN',            value: user.inn,                   icon: RiHashtag,       color: '#2C4F8A' },
        { label: 'Telefon(lar)',   value: user.phones?.join(', '),    icon: RiPhoneLine,     color: '#2C4F8A', key: 'phones' },
        { label: 'Manzil',         value: user.address,               icon: RiMapPinLine,    color: '#2C4F8A', key: 'address' },
        { label: "A'zolik holati", value: user.isMember,              icon: RiMedalLine,     color: '#C49A2A', isMember: true },
      ]
    : [
        { label: 'Familiya',       value: user.lastName,              icon: RiUserLine,      color: '#2C4F8A' },
        { label: 'Ism',            value: user.firstName,             icon: RiUserSmileLine, color: '#2C4F8A' },
        { label: 'Tahallus',       value: user.pseudonym || user.pseudoname, icon: RiUserLine,      color: '#2C4F8A', key: 'pseudonym' },
        { label: 'Otasining ismi', value: user.middleName,            icon: RiUser3Line,     color: '#2C4F8A' },
        { label: 'PINFL',          value: user.pinfl,                 icon: RiIdCardLine,    color: '#2C4F8A' },
        { label: 'Pasport',        value: user.passportSeria,         icon: RiFileTextLine,  color: '#2C4F8A' },
        { label: 'Telefon(lar)',   value: user.phones?.join(', '),    icon: RiPhoneLine,     color: '#2C4F8A', key: 'phones' },
        { label: 'Manzil',         value: user.address,               icon: RiMapPinLine,    color: '#2C4F8A', key: 'address' },
        { label: "A'zolik holati", value: user.isMember,              icon: RiMedalLine,     color: '#C49A2A', isMember: true },
      ]

  const initials = isLegal
    ? (user.legalName?.[0] || '?').toUpperCase()
    : [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  const normalizePhone = (raw) => {
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (/^998\d{9}$/.test(digits)) return digits
    if (/^\d{9}$/.test(digits)) return `998${digits}`
    return digits
  }

  const handleSave = async () => {
    setError(null)
    setUpdating(true)
    try {
      let payload = {
        address: user.address,
        phones: user.phones || [],
        pseudonym: user.pseudonym || user.pseudoname || null,
        pseudoname: user.pseudonym || user.pseudoname || null,
      }

      if (editingKey === 'phones') {
        const p1Err = validatePhone(phone1)
        if (p1Err) {
          setPhone1Error(p1Err)
          throw new Error(p1Err)
        }
        let p2Val = ''
        if (phone2.trim()) {
          const p2Err = validatePhone(phone2)
          if (p2Err) {
            setPhone2Error(p2Err)
            throw new Error(p2Err)
          }
          p2Val = phone2.trim()
        }
        payload.phones = [phone1.trim(), p2Val].filter(Boolean)
      } else if (editingKey === 'address') {
        if (!addressRegion || !addressDistrict || !addressStreet.trim() || !addressHouse.trim()) {
          throw new Error("Barcha manzil maydonlarini to'ldirish majburiy.")
        }
        const regionObj = regions.find(r => String(r.id) === addressRegion)
        const districtObj = allDistricts.find(d => String(d.id) === addressDistrict)
        
        if (!regionObj || !districtObj) {
          throw new Error("Viloyat yoki tuman tanlanmagan.")
        }

        payload.address = `${regionObj.name}, ${districtObj.name}, ${addressStreet.trim()}, ${addressHouse.trim()}`
      } else if (editingKey === 'pseudonym') {
        const trimmed = editValue.trim()
        payload.pseudonym = trimmed || null
        payload.pseudoname = trimmed || null
      }

      const updatedUser = await updateMe(payload)
      setUser(updatedUser)
      setEditingKey(null)
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <section style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spinMini {
          to { transform: rotate(360deg); }
        }
        .profile-card { }
        .field-row:hover { background: #FAFBFD !important; }
        
        .edit-btn {
          background: none;
          border: none;
          color: #99A8BB;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          transition: all 0.15s ease;
        }
        .edit-btn:hover {
          color: #2C4F8A;
          background: #E8EDF5;
        }
        .save-btn:hover {
          background-color: #3D64A8 !important;
        }
        .cancel-btn:hover {
          background-color: #E2E7F0 !important;
        }
        .edit-input:focus {
          border-color: #2C4F8A !important;
          box-shadow: 0 0 0 2px rgba(44, 79, 138, 0.1) !important;
        }
        .close-btn:hover {
          background-color: #EEF1F7;
        }
      `}</style>

      <div style={S.wrap}>
        {/* ── Header card ── */}
        <div style={S.headerCard} className="profile-card">
          {/* Glowing avatar */}
          <div style={S.avatarWrap}>
            <div style={S.avatar}>{initials}</div>
            <div style={S.avatarGlow} />
          </div>

          <div style={S.headerInfo}>
            <h1 style={S.name}>{fullName || '—'}</h1>
            <div style={S.badges}>
              <span style={{ ...S.badge, ...S.badgePurple }}>
                {isLegal
                  ? <><RiBuilding2Line size={13} /> Yuridik shaxs</>
                  : <><RiUser3Line size={13} /> Jismoniy shaxs</>
                }
              </span>
              {user.isMember && (
                <span style={{ ...S.badge, ...S.badgeGreen }}>
                  <RiCheckLine size={13} /> A'zo
                </span>
              )}

            </div>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div style={S.infoCard} className="profile-card">
          <h2 style={S.sectionTitle}>
            <RiUser3Line size={17} color="#a855f7" />
            Shaxsiy ma'lumotlar
          </h2>

          <div style={S.fieldList}>
            {fields.map(({ label, value, icon: Icon, color, isMember, key }) => {
              const isEditing = editingKey === key && key
              return (
                <div key={label} className="field-row" style={S.fieldRow}>
                  <div style={S.fieldLeft}>
                    <FieldIcon icon={Icon} color={color} />
                    <span style={S.fieldLabel}>{label}</span>
                  </div>

                  {/* Edit mode or View mode */}
                  {isEditing && key !== 'address' ? (
                    key === 'phones' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px' }}>Tel 1:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, position: 'relative' }}>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={12}
                              className="edit-input"
                              style={{ ...S.editInput, maxWidth: 'none', paddingRight: '28px' }}
                              value={phone1}
                              onChange={(e) => {
                                setPhone1(maskPhone(e.target.value))
                                setPhone1Error(null)
                              }}
                              onBlur={(e) => setPhone1Error(validatePhone(e.target.value))}
                              onFocus={(e) => {
                                if (!e.target.value) setPhone1('998')
                              }}
                              placeholder="998901234567"
                              disabled={updating}
                              autoFocus
                            />
                            {phone1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPhone1('')
                                  setPhone1Error(null)
                                }}
                                style={{ position: 'absolute', right: '4px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                title="Tozalash"
                              >
                                <RiCloseLine size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <FieldError error={phone1Error} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', minWidth: '40px' }}>Tel 2:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, position: 'relative' }}>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={12}
                              className="edit-input"
                              style={{ ...S.editInput, maxWidth: 'none', paddingRight: '28px' }}
                              value={phone2}
                              onChange={(e) => {
                                setPhone2(maskPhone(e.target.value))
                                setPhone2Error(null)
                              }}
                              onBlur={(e) => {
                                if (e.target.value) {
                                  setPhone2Error(validatePhone(e.target.value))
                                } else {
                                  setPhone2Error(null)
                                }
                              }}
                              onFocus={(e) => {
                                if (!e.target.value) setPhone2('998')
                              }}
                              placeholder="998912345678 (ixtiyoriy)"
                              disabled={updating}
                            />
                            {phone2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPhone2('')
                                  setPhone2Error(null)
                                }}
                                style={{ position: 'absolute', right: '4px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                title="O'chirish"
                              >
                                <RiCloseLine size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <FieldError error={phone2Error} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                          <button
                            onClick={handleSave}
                            className="save-btn"
                            style={S.saveBtn}
                            disabled={updating || phone1Error || phone2Error || !phone1.trim()}
                            title="Saqlash"
                          >
                            {updating ? <span style={S.spinnerMini} /> : <RiCheckLine size={16} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingKey(null)
                              setPhone1Error(null)
                              setPhone2Error(null)
                            }}
                            className="cancel-btn"
                            style={S.cancelBtn}
                            disabled={updating}
                            title="Bekor qilish"
                          >
                            <RiCloseLine size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={S.editWrapper}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, position: 'relative' }}>
                          <input
                            type="text"
                            className="edit-input"
                            style={{ ...S.editInput, paddingRight: '28px', maxWidth: 'none' }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Tahallus"
                            disabled={updating}
                            autoFocus
                          />
                          {editValue && (
                            <button
                              type="button"
                              onClick={() => setEditValue('')}
                              style={{ position: 'absolute', right: '4px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                              title="Tozalash"
                            >
                              <RiCloseLine size={16} />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={handleSave}
                          className="save-btn"
                          style={S.saveBtn}
                          disabled={updating}
                          title="Saqlash"
                        >
                          {updating ? <span style={S.spinnerMini} /> : <RiCheckLine size={16} />}
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="cancel-btn"
                          style={S.cancelBtn}
                          disabled={updating}
                          title="Bekor qilish"
                        >
                          <RiCloseLine size={16} />
                        </button>
                      </div>
                    )
                  ) : (
                    <div style={S.fieldRight}>
                      {isMember ? (
                        <span style={value ? S.memberBadgeYes : S.memberBadgeNo}>
                          {value
                            ? <><RiCheckLine size={13} /> A'zo</>
                            : <><RiCloseLine size={13} /> A'zo emas</>
                          }
                        </span>
                      ) : (
                        <span style={S.fieldValue}>{value || '—'}</span>
                      )}
                      
                      {/* Edit button for editable fields */}
                      {key && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingKey(key)
                              if (key === 'phones') {
                                setPhone1(user.phones?.[0] || '')
                                setPhone2(user.phones?.[1] || '')
                              } else if (key === 'address') {
                                loadGeoAndPreFill(user.address)
                              } else {
                                setEditValue(value || '')
                              }
                              setError(null)
                            }}
                            className="edit-btn"
                            title="Tahrirlash"
                          >
                            <RiPencilLine size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div style={S.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Edit Modal */}
      {editingKey === 'address' && (
        <div style={M.overlay}>
          <div style={M.box}>
            <div style={M.header}>
              <h3 style={M.title}>Manzilni tahrirlash</h3>
              <button onClick={() => setEditingKey(null)} style={M.closeBtn} className="close-btn" disabled={updating}>
                <RiCloseLine size={18} />
              </button>
            </div>
            
            {geoLoading ? (
              <div style={M.loadingWrap}>
                <span style={S.spinnerMini} />
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  Hududlar ro'yxati yuklanmoqda...
                </p>
              </div>
            ) : geoError ? (
              <div style={{ padding: '20px', color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
                ⚠️ {geoError}
                <button onClick={() => loadGeoAndPreFill(user.address)} style={M.retryBtn}>
                  Qayta urinish
                </button>
              </div>
            ) : (
              <div style={M.body}>
                <div style={M.field}>
                  <label style={M.label}>Viloyat <span style={{ color: '#ef4444' }}>*</span></label>
                  <SimpleSelect
                    options={regions.map(r => ({ value: String(r.id), label: r.name }))}
                    value={addressRegion}
                    onChange={(val) => {
                      setAddressRegion(val)
                      setAddressDistrict('')
                    }}
                    placeholder="Viloyatni tanlang"
                    disabled={updating}
                  />
                </div>

                <div style={M.field}>
                  <label style={M.label}>Tuman/Shahar <span style={{ color: '#ef4444' }}>*</span></label>
                  <SimpleSelect
                    options={allDistricts
                      .filter(d => String(d.region_id) === addressRegion)
                      .map(d => ({ value: String(d.id), label: d.name }))}
                    value={addressDistrict}
                    onChange={(val) => setAddressDistrict(val)}
                    placeholder={addressRegion ? "Tumanni tanlang" : "Avval viloyat tanlang"}
                    disabled={!addressRegion || updating}
                  />
                </div>

                <div style={M.field}>
                  <label style={M.label}>Ko'cha nomi <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    style={M.input}
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="Masalan: Mustaqillik ko'chasi"
                    disabled={updating}
                  />
                </div>

                <div style={M.field}>
                  <label style={M.label}>Uy raqami <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    style={M.input}
                    value={addressHouse}
                    onChange={(e) => setAddressHouse(e.target.value)}
                    placeholder="Masalan: 45-uy"
                    disabled={updating}
                  />
                </div>
              </div>
            )}

            {!geoLoading && !geoError && (
              <div style={M.footer}>
                <button
                  onClick={() => setEditingKey(null)}
                  style={M.cancelBtn}
                  disabled={updating}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    ...M.saveBtn,
                    opacity: (addressRegion && addressDistrict && addressStreet.trim() && addressHouse.trim()) ? 1 : 0.5,
                    cursor: (addressRegion && addressDistrict && addressStreet.trim() && addressHouse.trim()) ? 'pointer' : 'not-allowed'
                  }}
                  disabled={updating || !(addressRegion && addressDistrict && addressStreet.trim() && addressHouse.trim())}
                >
                  {updating ? (
                    <>
                      <span style={S.spinnerMini} /> Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

const S = {
  page: {
    fontFamily: "'Inter', sans-serif",
    minHeight: 'calc(100vh - 64px)',
    padding: '0',
  },
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '680px',
  },
  // Header card
  headerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '24px 28px',
    background: '#ffffff',
    border: '1px solid #DDE2EC',
    borderRadius: '8px',
    boxShadow: 'none',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '4px',
    background: '#2C4F8A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '0.03em',
    position: 'relative',
    zIndex: 1,
  },
  avatarGlow: {
    display: 'none',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  name: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1E2A3B',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgePurple: {
    background: '#E8EDF5',
    border: '1px solid #B9C6DC',
    color: '#2C4F8A',
  },
  badgeGreen: {
    background: '#E8F5E9',
    border: '1px solid #C8E6C9',
    color: '#2E7D32',
  },
  // Info card
  infoCard: {
    padding: '24px 28px',
    background: '#ffffff',
    border: '1px solid #DDE2EC',
    borderRadius: '8px',
    boxShadow: 'none',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#2C4F8A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 20px',
    borderBottom: '1px solid #DDE2EC',
    paddingBottom: '10px',
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 8px',
    borderBottom: '1px solid #F1F3F7',
    borderRadius: '0',
    transition: 'background .15s',
    gap: '16px',
  },
  fieldLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  fieldIconWrap: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    background: '#E8EDF5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#4F5F74',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  fieldValue: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#1E2A3B',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  memberBadgeYes: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#E8F5E9',
    border: '1px solid #C8E6C9',
    color: '#2E7D32',
  },
  memberBadgeNo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    background: '#FFEBEE',
    border: '1px solid #FFCDD2',
    color: '#C62828',
  },
  editWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    justifyContent: 'flex-end',
  },
  editInput: {
    padding: '8px 12px',
    fontSize: '13.5px',
    borderRadius: '4px',
    border: '1px solid #D5DCE8',
    outline: 'none',
    width: '100%',
    maxWidth: '280px',
    boxSizing: 'border-box',
    color: '#1E2A3B',
    background: '#FAFBFD',
    fontFamily: 'inherit',
    fontWeight: '500',
    transition: 'border-color 0.15s ease',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: 'none',
    background: '#2C4F8A',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: '1px solid #C8D0DE',
    background: '#EEF1F7',
    color: '#4F5F74',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  fieldRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#FFEBEE',
    border: '1px solid #FFCDD2',
    borderRadius: '4px',
    color: '#C62828',
    fontSize: '13px',
    fontWeight: '500',
    margin: '12px 0 0 0',
  },
  spinnerMini: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spinMini 0.6s linear infinite',
  },
}

const M = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(30, 42, 59, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  box: {
    background: '#ffffff',
    border: '1px solid #DDE2EC',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #DDE2EC',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#2C4F8A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#4F5F74',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4F5F74',
  },
  input: {
    padding: '10px 14px',
    fontSize: '13.5px',
    borderRadius: '4px',
    border: '1px solid #D5DCE8',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    background: '#FAFBFD',
    color: '#1E2A3B',
    transition: 'border-color 0.15s ease',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid #DDE2EC',
    background: '#FAFBFD',
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '4px',
    background: '#ffffff',
    border: '1px solid #C8D0DE',
    color: '#4F5F74',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  saveBtn: {
    padding: '9px 20px',
    borderRadius: '4px',
    background: '#2C4F8A',
    border: 'none',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  retryBtn: {
    display: 'block',
    margin: '12px auto 0',
    padding: '8px 16px',
    background: '#2C4F8A',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }
}