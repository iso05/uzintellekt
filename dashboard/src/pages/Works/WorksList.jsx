import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorks, getWork, submitWork, cancelWork, getWorkTypes, getAuthorRoles, getMyContributions } from '../../services/worksApi'
import {
  RiAddLine, RiFileTextLine, RiEditLine, RiSendPlaneLine,
  RiCloseLine, RiRefreshLine, RiSearchLine, RiArrowLeftLine, RiArrowRightLine,
} from 'react-icons/ri'

const STATUS_CONFIG = {
  DRAFT:      { label: "Qoralama",             bg: '#EEF1F6', color: '#5A6478', border: '#C5CDD8' },
  PENDING:    { label: "Ko'rib chiqilmoqda",   bg: '#FEF5E7', color: '#C8922A', border: '#F0C060' },
  REGISTERED: { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#1E7D4A', border: '#7DCB9E' },
  APPROVED:   { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#1E7D4A', border: '#7DCB9E' },
  REJECTED:   { label: "Rad etilgan",          bg: '#FDEEEE', color: '#C0392B', border: '#F5AAAA' },
  CANCELLED:  { label: "Bekor qilingan",       bg: '#F0F0F0', color: '#9AA5B8', border: '#D0D7E2' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || 'Noma’lum', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
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
    backdropFilter: 'blur(4px)'
  },
  box: {
    width: '100%',
    borderRadius: '6px',
    border: '1px solid #DDE2EC',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'fadeUp 0.25s ease both'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #DDE2EC'
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    color: '#4F5F74',
    transition: 'background-color 0.2s'
  },
  body: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #DDE2EC'
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: '1px solid #DDE2EC',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none'
  }
}

export default function WorksList() {
  const navigate = useNavigate()
  const [works, setWorks]           = useState([])
  const [contributions, setContributions] = useState([])
  const [workTypes, setWorkTypes]   = useState([])
  const [authorRoles, setAuthorRoles] = useState([])
  
  const [activeTab, setActiveTab]   = useState('my-works') // 'my-works' | 'contributions'
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1) // 1-based index as per Swagger spec
  const [pageSize, setPageSize]     = useState(10)
  
  const [loading, setLoading]       = useState(true)
  const [contribLoading, setContribLoading] = useState(false)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [actionId, setActionId]     = useState(null)
  
  const [search, setSearch]         = useState('')
  const [filterState, setFilterState] = useState('')
  
  // Detail Modal State
  const [detailWork, setDetailWork] = useState(null)
  
  // Toasts
  const [toasts, setToasts]         = useState([])

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message }])
    if (type === 'success') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const handleApiError = useCallback((err, fallbackMsg = 'Xatolik yuz berdi.') => {
    console.error(err)
    if (err.response || err.apiError) {
      const data = err.response?.data || err.apiError
      const status = err.response?.status || err.status
      
      if (status === 400) {
        const msg = data?.errorMessage || fallbackMsg
        addToast('error', msg)
        return msg
      } else if (status === 422) {
        const msg = Array.isArray(data?.errors)
          ? data.errors.map(e => e.message || e.defaultMessage || JSON.stringify(e)).join(', ')
          : (data?.errorMessage || 'Kiritilgan ma’lumotlar xato.')
        addToast('error', msg)
        return msg
      } else {
        const msg = data?.errorMessage || data?.message || `Server xatosi: ${status}`
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
  }, [addToast])

  // Load grid list
  const load = useCallback(async (currentPage = 1, size = 10, stateFilter = '', searchQuery = '') => {
    setLoading(true)
    try {
      const filters = []
      if (stateFilter) {
        filters.push({ field: 'state', operator: 'eq', value: stateFilter })
      }
      if (searchQuery && searchQuery.trim().length >= 2) {
        filters.push({ field: 'name', operator: 'cn', value: searchQuery.trim() })
      }

      const response = await getWorks({
        page: currentPage,
        size,
        filters,
        sort: { selector: 'createdAt', desc: true }
      })
      const items = response?.items ?? response?.data?.items ?? []
      const totalItems = response?.totalItems ?? response?.data?.totalItems ?? 0
      
      setWorks(items)
      setTotal(totalItems)
    } catch (e) {
      handleApiError(e, "Asarlarni yuklashda xatolik yuz berdi.")
    } finally {
      setLoading(false)
    }
  }, [handleApiError])

  // Load contributions
  const loadContributions = useCallback(async () => {
    setContribLoading(true)
    try {
      const response = await getMyContributions()
      setContributions(response ?? [])
    } catch (e) {
      console.error("Contributions load error:", e)
    } finally {
      setContribLoading(false)
    }
  }, [])

  // Mount effects
  useEffect(() => {
    const timer = setTimeout(() => {
      load(page, pageSize, filterState, search)
    }, 0)
    return () => clearTimeout(timer)
  }, [page, pageSize, filterState, search, load])

  useEffect(() => {
    loadContributions()
  }, [loadContributions])

  useEffect(() => {
    Promise.all([getWorkTypes(), getAuthorRoles()])
      .then(([wt, ar]) => {
        setWorkTypes(wt?.content ?? wt ?? [])
        setAuthorRoles(ar?.content ?? ar ?? [])
      })
      .catch(e => console.error("Lug'atlarni yuklashda xatolik:", e))
  }, [])

  const handleSubmit = async (workId) => {
    if (!confirm("Asarni ko'rib chiqishga yuborasizmi?")) return
    setActionId(workId)
    try {
      await submitWork(workId)
      addToast('success', "Asar ko'rib chiqish uchun yuborildi ✓")
      load(page, pageSize, filterState, search)
    } catch (e) {
      handleApiError(e, "Asarni yuborishda xatolik yuz berdi.")
    } finally {
      setActionId(null)
    }
  }

  const handleCancel = async (workId) => {
    if (!confirm("Asarni bekor qilishni xohlaysizmi?")) return
    setActionId(workId)
    try {
      await cancelWork(workId)
      addToast('success', "Asar bekor qilindi ✓")
      load(page, pageSize, filterState, search)
    } catch (e) {
      handleApiError(e, "Asarni bekor qilishda xatolik yuz berdi.")
    } finally {
      setActionId(null)
    }
  }

  const handleOpenDetail = async (workId) => {
    setDetailLoading(true)
    try {
      const work = await getWork(workId)
      setDetailWork(work)
    } catch (e) {
      handleApiError(e, "Asar tafsilotlarini yuklashda xatolik yuz berdi.")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleFilterStateChange = (e) => {
    setFilterState(e.target.value)
    setPage(1)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="gov-works-container" style={S.page}>
      <style>{STYLE_CSS}</style>

      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              borderRadius: 5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: t.type === 'success' ? '#2E7D51' : '#C0392B',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 500,
              minWidth: 260,
              maxWidth: 360,
              animation: 'fadeUp 0.25s ease both'
            }}
          >
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 2, opacity: 0.8 }}
            >
              <RiCloseLine size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Asarlar</h1>
          <p style={S.subtitle}>Tizimdagi barcha intellektual mulk asarlari</p>
        </div>
        <button className="gov-btn-primary" onClick={() => navigate('/works/new')}>
          <RiAddLine size={18} />
          Yangi asar
        </button>
      </div>

      {/* Tabs list */}
      <div style={S.tabsContainer}>
        <button
          style={{ ...S.tabBtn, ...(activeTab === 'my-works' ? S.tabBtnActive : {}) }}
          onClick={() => setActiveTab('my-works')}
        >
          Mening asarlarim ({total})
        </button>
        <button
          style={{ ...S.tabBtn, ...(activeTab === 'contributions' ? S.tabBtnActive : {}) }}
          onClick={() => setActiveTab('contributions')}
        >
          Qatnashgan asarlarim ({contributions.length})
        </button>
      </div>

      {activeTab === 'my-works' ? (
        <>
          {/* Search & Filters */}
          <div className="gov-search-bar">
            <div style={S.searchWrap}>
              <RiSearchLine size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="gov-search-input"
                placeholder="Asar nomini qidirish..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <select
              style={S.filterSelect}
              value={filterState}
              onChange={handleFilterStateChange}
            >
              <option value="">— Barcha holatlar —</option>
              <option value="DRAFT">Qoralama</option>
              <option value="PENDING">Ko'rib chiqilmoqda</option>
              <option value="REGISTERED">Tasdiqlangan</option>
              <option value="REJECTED">Rad etilgan</option>
              <option value="CANCELLED">Bekor qilingan</option>
            </select>

            <select
              style={S.filterSelect}
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={10}>10 talab</option>
              <option value={20}>20 talab</option>
              <option value={50}>50 talab</option>
            </select>

            <button className="gov-refresh-btn" onClick={() => load(page, pageSize, filterState, search)} title="Yangilash">
              <RiRefreshLine size={16} />
            </button>
          </div>

          {/* Table Card */}
          <div style={S.card}>
            <div style={{ marginBottom: 12, fontSize: 13.5, fontWeight: 600, color: '#4F5F74' }}>
              Jami: {total} ta asar
            </div>

            {loading ? (
              <div style={S.center}>
                <div style={S.spinner} />
                <p style={{ color: '#4F5F74', marginTop: 12, fontWeight: 500 }}>Yuklanmoqda...</p>
              </div>
            ) : works.length === 0 ? (
              <div style={S.center}>
                <RiFileTextLine size={48} color="#DDE2EC" />
                <p style={{ color: '#4F5F74', marginTop: 12, fontWeight: 500 }}>
                  {search || filterState ? 'Hech narsa topilmadi' : "Hozircha asarlar yo'q"}
                </p>
                {!search && !filterState && (
                  <button className="gov-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/works/new')}>
                    <RiAddLine size={16} /> Birinchi asarni qo'shing
                  </button>
                )}
              </div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Nomi</th>
                      <th style={S.th}>Tur</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Haq egalari</th>
                      <th style={S.th}>Ro'yxatga olingan</th>
                      <th style={S.th}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {works.map((w) => {
                      const status = w.state || w.status || 'DRAFT'
                      const typeObj = workTypes.find(t => Number(t.id) === Number(w.workTypeId))
                      const workType = typeObj?.localizedName?.uz || typeObj?.name || '—'
                      const isRegistered = status === 'REGISTERED'

                      return (
                        <tr key={w.id}>
                          <td style={{ ...S.td, fontWeight: 700, color: '#2C4F8A', cursor: 'pointer', maxWidth: 220 }} onClick={() => handleOpenDetail(w.id)}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.name}>
                              {w.name || '—'}
                            </div>
                            {status === 'REJECTED' && w.rejectionReason && (
                              <div style={{ fontSize: '11px', color: '#C0392B', fontWeight: 500, marginTop: 4, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                Rad etilish sababi: {w.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td style={S.td}><span style={S.typeBadge}>{workType}</span></td>
                          <td style={S.td}><StatusBadge status={status} /></td>
                          <td style={{ ...S.td, color: '#4F5F74', fontSize: 13 }}>
                            {w.rightHolders?.length ?? 0} kishi
                          </td>
                          <td style={{ ...S.td, color: '#4F5F74', fontSize: 13 }}>
                            {isRegistered ? (w.registrationDate || '—') : '—'}
                          </td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {['DRAFT', 'REJECTED'].includes(status) ? (
                                <button
                                  className="gov-list-icon-btn gov-list-icon-btn-edit"
                                  title="Tahrirlash"
                                  onClick={() => navigate(`/works/${w.id}/edit`)}
                                >
                                  <RiEditLine size={15} />
                                </button>
                              ) : (
                                <button
                                  className="gov-list-icon-btn gov-list-icon-btn-view"
                                  title="Batafsil ko'rish"
                                  disabled={detailLoading}
                                  onClick={() => handleOpenDetail(w.id)}
                                >
                                  <RiFileTextLine size={15} />
                                </button>
                              )}
                              
                              {['DRAFT', 'REJECTED'].includes(status) && (
                                <button
                                  className="gov-list-icon-btn gov-list-icon-btn-submit"
                                  title="Yuborish"
                                  disabled={actionId === w.id}
                                  onClick={() => handleSubmit(w.id)}
                                >
                                  <RiSendPlaneLine size={15} />
                                </button>
                              )}
                              
                              {status === 'DRAFT' && (
                                <button
                                  className="gov-list-icon-btn gov-list-icon-btn-cancel"
                                  title="Bekor qilish"
                                  disabled={actionId === w.id}
                                  onClick={() => handleCancel(w.id)}
                                >
                                  <RiCloseLine size={15} />
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
                <span style={{ color: '#4F5F74', fontSize: 13 }}>
                  Jami: {total} ta dan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="gov-page-btn"
                    style={{ opacity: page === 1 ? 0.4 : 1 }}
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <RiArrowLeftLine size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`gov-page-btn ${i + 1 === page ? 'gov-page-btn-active' : ''}`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="gov-page-btn"
                    style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <RiArrowRightLine size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Contributions List */}
          <div style={S.card}>
            {contribLoading ? (
              <div style={S.center}>
                <div style={S.spinner} />
                <p style={{ color: '#4F5F74', marginTop: 12, fontWeight: 500 }}>Yuklanmoqda...</p>
              </div>
            ) : contributions.length === 0 ? (
              <div style={S.center}>
                <RiFileTextLine size={48} color="#DDE2EC" />
                <p style={{ color: '#4F5F74', marginTop: 12, fontWeight: 500 }}>
                  Siz haq egasi sifatida kiritilgan asarlar yo'q
                </p>
              </div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Nomi</th>
                      <th style={S.th}>Tavsif</th>
                      <th style={S.th}>Holati</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((w) => {
                      const status = w.state || w.status || 'DRAFT'
                      return (
                        <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetail(w.id)}>
                          <td style={{ ...S.td, fontWeight: 700, color: '#2C4F8A' }}>
                            {w.name || '—'}
                          </td>
                          <td style={S.td}>
                            {w.description || '—'}
                          </td>
                          <td style={S.td}>
                            <StatusBadge status={status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal Overlay */}
      {detailWork && (
        <div style={M.overlay}>
          <div style={{ ...M.box, background: '#FFFFFF', maxWidth: '640px' }}>
            <div style={{ ...M.header, borderColor: '#DDE2EC' }}>
              <h3 style={{ ...M.title, color: '#2C4F8A' }}>Asar tafsilotlari</h3>
              <button type="button" onClick={() => setDetailWork(null)} style={M.closeBtn}>
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
                    {(() => {
                      const typeObj = workTypes.find(t => Number(t.id) === Number(detailWork.workTypeId))
                      return typeObj?.localizedName?.uz || typeObj?.name || '—'
                    })()}
                  </span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Yaratuvchi ID:</span>
                  <span style={S.detailVal}>{detailWork.createdBy || '—'}</span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Holati:</span>
                  <span style={S.detailVal}><StatusBadge status={detailWork.state || detailWork.status} /></span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>Yaratilgan sana:</span>
                  <span style={S.detailVal}>{formatDateTime(detailWork.createdAt)}</span>
                </div>
                <div style={S.detailItem}>
                  <span style={S.detailLabel}>O'zgartirilgan sana:</span>
                  <span style={S.detailVal}>{formatDateTime(detailWork.updatedAt)}</span>
                </div>

                {detailWork.state === 'REGISTERED' && detailWork.registrationDate && (
                  <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                    <div style={{ background: '#EBF7EF', borderLeft: '4px solid #2E7D51', color: '#2E7D51', padding: '12px 16px', borderRadius: '5px', fontSize: '14px', fontWeight: 600 }}>
                      ✓ Ro'yxatga olindi: {detailWork.registrationDate}
                    </div>
                  </div>
                )}

                {detailWork.state === 'REJECTED' && detailWork.rejectionReason && (
                  <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                    <div style={{ background: '#FEF0F0', borderLeft: '4px solid #C0392B', color: '#C0392B', padding: '12px 16px', borderRadius: '5px', fontSize: '14px', fontWeight: 600 }}>
                      ✗ Rad etilish sababi: {detailWork.rejectionReason}
                    </div>
                  </div>
                )}

                <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                  <span style={S.detailLabel}>Tavsifi:</span>
                  <div style={{ ...S.detailVal, whiteSpace: 'pre-wrap', background: '#FAFBFD', padding: '12px', border: `1px solid #DDE2EC`, borderRadius: '6px', marginTop: '4px', fontWeight: 'normal' }}>
                    {detailWork.description || '—'}
                  </div>
                </div>

                {/* Right Holders Table */}
                <div style={{ ...S.detailItem, gridColumn: 'span 2' }}>
                  <span style={S.detailLabel}>Mulk egalari (Haq egalari):</span>
                  <div style={{ overflowX: 'auto', marginTop: 8, border: '1px solid #DDE2EC', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#EEF1F7', borderBottom: '1px solid #DDE2EC' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>№</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Pasport</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Ism</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Familiya</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Ulush (%)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Muallif roli</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!detailWork.rightHolders || detailWork.rightHolders.length === 0) ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '8px 12px', textAlign: 'center', color: '#99A8BB' }}>Ko'rsatilmagan.</td>
                          </tr>
                        ) : (
                          detailWork.rightHolders.map((rh, idx) => (
                            <tr key={rh.id || idx} style={{ borderBottom: '1px solid #E8EDF5' }}>
                              <td style={{ padding: '8px 12px' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px' }}>{rh.passportNo || rh.passportSeria || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{rh.firstName || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>{rh.lastName || '—'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{rh.sharePercentage || rh.share || 0}%</td>
                              <td style={{ padding: '8px 12px' }}>
                                {(() => {
                                  const ids = rh.authorRoleIds || []
                                  return ids.map(roleId => {
                                    const roleObj = authorRoles.find(r => Number(r.id) === Number(roleId))
                                    return roleObj?.localizedName?.uz || roleObj?.name || '—'
                                  }).join(', ') || '—'
                                })()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ ...M.footer, borderTopColor: '#DDE2EC', background: '#FAFBFD' }}>
              <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-start' }}>
                {['DRAFT', 'REJECTED'].includes(detailWork.state) && (
                  <button
                    className="gov-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                    onClick={() => {
                      setDetailWork(null)
                      navigate(`/works/${detailWork.id}/edit`)
                    }}
                  >
                    Tahrirlash
                  </button>
                )}
                {['DRAFT', 'REJECTED'].includes(detailWork.state) && (
                  <button
                    className="gov-list-icon-btn gov-list-icon-btn-submit"
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '13px', height: 'auto' }}
                    onClick={() => {
                      setDetailWork(null)
                      handleSubmit(detailWork.id)
                    }}
                  >
                    Yuborish
                  </button>
                )}
                {detailWork.state === 'DRAFT' && (
                  <button
                    className="gov-list-icon-btn gov-list-icon-btn-cancel"
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '13px', height: 'auto' }}
                    onClick={() => {
                      setDetailWork(null)
                      handleCancel(detailWork.id)
                    }}
                  >
                    Bekor qilish
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...M.cancelBtn, marginLeft: 'auto', background: '#FFFFFF', borderColor: '#DDE2EC', color: '#4F5F74' }}
                  onClick={() => setDetailWork(null)}
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const STYLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.gov-works-container {
  font-family: 'Inter', sans-serif !important;
  color: #1E2A3B;
}

.gov-search-bar {
  background-color: #FFFFFF;
  border: 1px solid #DDE2EC;
  border-radius: 5px;
  padding: 10px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.gov-search-input {
  width: 100%;
  border: 1.5px solid #D5DCE8;
  border-radius: 4px;
  padding: 8px 12px 8px 36px;
  font-size: 14px;
  font-weight: 400;
  color: #1E2A3B;
  background-color: #FAFBFD;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}

.gov-search-input:focus {
  border-color: #4A7DC4;
  box-shadow: 0 0 0 3px rgba(74,125,196,0.10);
  background-color: #FFFFFF;
}

.gov-search-input::placeholder {
  color: #99A8BB;
}

.gov-refresh-btn {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1.5px solid #D5DCE8;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #2C4F8A;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.gov-refresh-btn:hover {
  background-color: #EEF1F7;
  border-color: #C8D0DE;
}

.gov-list-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  font-weight: 600;
}

.gov-list-icon-btn-edit {
  background-color: #EEF4FB;
  border: 1.5px solid #4A7DC4;
  color: #2C4F8A;
}

.gov-list-icon-btn-edit:hover {
  background-color: #2C4F8A;
  color: #FFFFFF;
}

.gov-list-icon-btn-view {
  background-color: #EEF1F7;
  border: 1.5px solid #C8D0DE;
  color: #4F5F74;
}

.gov-list-icon-btn-view:hover {
  background-color: #E2E7F0;
  color: #1E2A3B;
}

.gov-list-icon-btn-submit {
  background-color: #EAF6EF;
  border: 1.5px solid #80C89A;
  color: #2E7D51;
}

.gov-list-icon-btn-submit:hover {
  background-color: #2E7D51;
  color: #FFFFFF;
}

.gov-list-icon-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gov-list-icon-btn-cancel {
  background-color: #FEF0F0;
  border: 1.5px solid #EAA0A0;
  color: #C0392B;
}

.gov-list-icon-btn-cancel:hover {
  background-color: #C0392B;
  color: #FFFFFF;
}

.gov-list-icon-btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gov-page-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1.5px solid #D5DCE8;
  background-color: #FFFFFF;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #2C4F8A;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.gov-page-btn:hover {
  background-color: #EEF4FB;
}

.gov-page-btn-active {
  background-color: #2C4F8A !important;
  color: #FFFFFF !important;
  border-color: #2C4F8A !important;
}

.gov-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #2C4F8A;
  color: #FFFFFF;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.gov-btn-primary:hover {
  background-color: #3D64A8;
  box-shadow: 0 2px 8px rgba(44,79,138,0.25);
}

table tbody tr {
  border-bottom: 1px solid #E8EDF5;
  transition: background-color 0.15s ease;
}

table tbody tr:hover {
  background-color: #F0F5FB !important;
}

table tbody tr:nth-child(even) {
  background-color: #FAFBFD;
}

@keyframes spin { to { transform: rotate(360deg); } }
`

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 18 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: '#2C4F8A', margin: 0 },
  subtitle: { fontSize: 13, color: '#4F5F74', margin: '4px 0 0' },
  searchWrap: { position: 'relative', flex: 1, maxWidth: 360 },
  filterSelect: { padding: '8px 12px', borderRadius: 4, border: '1.5px solid #D5DCE8', background: '#FFFFFF', color: '#1E2A3B', fontSize: 13.5, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 140 },
  tabsContainer: { display: 'flex', gap: 16, borderBottom: '1px solid #DDE2EC', marginBottom: 20 },
  tabBtn: { padding: '10px 16px', fontSize: 14, fontWeight: 600, color: '#4F5F74', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s ease', background: 'none' },
  tabBtnActive: { color: '#2C4F8A', borderBottom: '2px solid #2C4F8A' },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
    borderRadius: 5, background: '#FEF0F0', borderLeft: '4px solid #C0392B', color: '#C0392B', fontSize: 14,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #DDE2EC',
    borderTop: '3px solid #2C4F8A',
    borderRadius: '6px',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
    overflow: 'hidden',
    padding: '24px 28px',
  },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 4 },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid #DDE2EC', borderTopColor: '#2C4F8A', animation: 'spin 0.8s linear infinite' },
  tableWrap: { overflowX: 'auto', margin: '0 -28px -24px -28px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '13px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#2C4F8A', whiteSpace: 'nowrap' },
  td: { padding: '13px 16px', fontSize: 14, color: '#1E2A3B', borderBottom: '1px solid #E8EDF5', verticalAlign: 'middle' },
  typeBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 3, background: '#EEF4FB', border: '1px solid #DDE2EC', color: '#2C4F8A', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #DDE2EC', flexWrap: 'wrap', gap: 10, background: '#FFFFFF', margin: '0 -28px -24px -28px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  detailLabel: { fontSize: 11, color: '#99A8BB', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 },
  detailVal: { fontSize: 13.5, fontWeight: 600, color: '#1E2A3B' }
}
