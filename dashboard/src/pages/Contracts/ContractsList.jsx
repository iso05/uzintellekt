// src/pages/Contracts/ContractsList.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { getContractsGrid, downloadContract } from '../../services/contractsApi'

// ── Status config ────────────────────────────────────────────────
const STATUS_CFG = {
  SIGNED:    { label: 'Imzolangan', bg: '#E8F5EE', color: '#1E7D4A', border: '#7DCB9E', dot: '#1E7D4A' },
  ACTIVE:    { label: 'Faol',       bg: '#EEF4FB', color: '#2C4F8A', border: '#96B9D8', dot: '#2C4F8A' },
  EXPIRED:   { label: "Muddati o'tgan", bg: '#FEF5E7', color: '#C8922A', border: '#F0C060', dot: '#C8922A' },
  PENDING:   { label: 'Kutilmoqda', bg: '#FFF8EC', color: '#C87B00', border: '#F0C060', dot: '#C87B00' },
  CANCELLED: { label: 'Bekor',      bg: '#F5F5F5', color: '#6B7A8D', border: '#C5CDD8', dot: '#6B7A8D' },
}

const CONTRACT_TYPE_LABELS = {
  MEMBERSHIP: 'A\'zolik shartnomasi',
  LICENSE:    'Litsenziya shartnomasi',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status || 'Noma\'lum', bg: '#F5F5F5', color: '#6B7A8D', border: '#C5CDD8', dot: '#6B7A8D' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: '0.2px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return iso }
}

// ── PDF preview modal ─────────────────────────────────────────────
function PdfPreviewModal({ url, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // esc tugmasi bilan yopish
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,20,40,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeInModal 0.2s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 8,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        width: '100%', maxWidth: 900,
        height: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '2px solid #2C4F8A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#2C4F8A', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Shartnomani ko'rish</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600,
                background: '#F0C040', color: '#1E2A3B', border: 'none', cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Yuklab olish
            </a>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 4, border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <iframe
          ref={ref}
          src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
          title="Shartnoma"
          style={{ flex: 1, width: '100%', border: 'none', background: '#525659' }}
        />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function ContractsList() {
  const [contracts, setContracts]         = useState([])
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [actionLoading, setActionLoading] = useState(null) // contractId
  const [previewUrl, setPreviewUrl]       = useState(null)

  const SIZE = 10

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getContractsGrid({ page: p, size: SIZE })
      // Backend DataGridResponse: { content, totalElements, ... }
      setContracts(data?.content ?? data?.items ?? [])
      setTotal(data?.totalElements ?? data?.totalItems ?? 0)
    } catch (e) {
      setError(e.message || 'Shartnomalar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  const handleView = async (contract) => {
    setActionLoading(contract.id)
    try {
      const res = await downloadContract(contract.id)
      const url = res?.url || res?.downloadUrl
      if (url) {
        setPreviewUrl(url)
      } else {
        setError('Shartnoma fayli topilmadi')
      }
    } catch (e) {
      setError(e.message || 'Yuklab olishda xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = async (contract) => {
    setActionLoading('dl_' + contract.id)
    try {
      const res = await downloadContract(contract.id)
      const url = res?.url || res?.downloadUrl
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = `shartnoma_${contract.id}.pdf`
        a.target = '_blank'
        a.click()
      } else {
        setError('Shartnoma fayli topilmadi')
      }
    } catch (e) {
      setError(e.message || 'Yuklab olishda xatolik')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / SIZE)

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInModal { from { opacity:0; } to { opacity:1; } }
        .ct-row:hover { background: #F0F5FB !important; }
        .ct-btn:hover { opacity: 0.8; }
      `}</style>

      {previewUrl && (
        <PdfPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {/* Page Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>
            <svg width="22" height="22" fill="none" stroke="#2C4F8A" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Shartnomalarim
          </h1>
          <p style={S.subtitle}>Imzolangan a'zolik va litsenziya shartnomalaringiz</p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          style={S.refreshBtn}
          title="Yangilash"
        >
          <svg
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={S.errorBox}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Main Card */}
      <div style={S.card}>
        {loading ? (
          <div style={S.center}>
            <div style={S.spinner} />
            <p style={{ color: '#6B7A8D', marginTop: 12, fontSize: 13 }}>Shartnomalar yuklanmoqda...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={S.emptyIcon}>
              <svg width="36" height="36" fill="none" stroke="#96B9D8" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2C4F8A', margin: '0 0 6px' }}>Shartnomalar mavjud emas</p>
            <p style={{ fontSize: 13, color: '#6B7A8D', margin: 0 }}>Hozircha imzolangan shartnomalar topilmadi</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: '#F4F6FA', borderBottom: '2px solid #DDE2EC' }}>
                    <th style={S.th}>Shartnoma turi</th>
                    <th style={S.th}>Holati</th>
                    <th style={S.th}>Imzolangan sana</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, idx) => {
                    const isLoading = actionLoading === c.id
                    const isDlLoading = actionLoading === 'dl_' + c.id
                    const typeLabel = "A'zolik shartnomasi"
                    return (
                      <tr
                        key={c.id}
                        className="ct-row"
                        style={{
                          background: idx % 2 === 1 ? '#FAFBFD' : '#fff',
                          borderBottom: '1px solid #E8EDF5',
                          animation: `fadeUp ${0.1 + idx * 0.04}s ease both`,
                        }}
                      >
                        {/* Turi */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 4,
                              background: '#EEF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <svg width="17" height="17" fill="none" stroke="#2C4F8A" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                            </div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E2A3B' }}>{typeLabel}</div>
                          </div>
                        </td>

                        {/* Holat — fixed Imzolangan */}
                        <td style={S.td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700,
                            background: '#E8F5EE', color: '#1E7D4A', border: '1px solid #7DCB9E',
                            letterSpacing: '0.2px',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E7D4A', flexShrink: 0 }} />
                            Imzolangan
                          </span>
                        </td>

                        {/* Imzolangan */}
                        <td style={{ ...S.td, color: '#4F5F74', fontSize: 13 }}>
                          {formatDate(c.signedAt || c.createdAt)}
                        </td>


                        {/* Amallar */}
                        <td style={{ ...S.td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Ko'rish */}
                            <button
                              className="ct-btn"
                              title="Ko'rish"
                              disabled={!!actionLoading}
                              onClick={() => handleView(c)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 3, fontSize: 12, fontWeight: 600,
                                background: '#EEF4FB', color: '#2C4F8A',
                                border: '1px solid #B0C0DE', cursor: 'pointer',
                                transition: 'opacity 0.15s',
                              }}
                            >
                              {isLoading ? (
                                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #96B9D8', borderTopColor: '#2C4F8A', animation: 'spin 0.7s linear infinite' }} />
                              ) : (
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                              )}
                              Ko'rish
                            </button>

                            {/* Yuklab olish */}
                            <button
                              className="ct-btn"
                              title="Yuklab olish"
                              disabled={!!actionLoading}
                              onClick={() => handleDownload(c)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 3, fontSize: 12, fontWeight: 600,
                                background: '#E8F5EE', color: '#1E7D4A',
                                border: '1px solid #7DCB9E', cursor: 'pointer',
                                transition: 'opacity 0.15s',
                              }}
                            >
                              {isDlLoading ? (
                                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #7DCB9E', borderTopColor: '#1E7D4A', animation: 'spin 0.7s linear infinite' }} />
                              ) : (
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                              )}
                              Yuklab olish
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={S.pagination}>
                <span style={{ fontSize: 12, color: '#6B7A8D' }}>
                  Jami {total} ta shartnoma. {page * SIZE + 1}–{Math.min((page + 1) * SIZE, total)} ko'rsatilmoqda
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    style={{ ...S.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
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
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info block */}
      <div style={S.infoBox}>
        <svg width="15" height="15" fill="none" stroke="#2C4F8A" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>
          Shartnomani yuklab olish uchun <strong>Yuklab olish</strong> tugmasini bosing.
          Ko'rish uchun <strong>Ko'rish</strong> tugmasini bosing (brauzerda ochiladi).
          Muammo bo'lsa, administrator bilan bog'laning.
        </span>
      </div>
    </div>
  )
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', sans-serif" },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
  },
  title: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 22, fontWeight: 700, color: '#2C4F8A', margin: '0 0 4px',
  },
  subtitle: { fontSize: 13, color: '#6B7A8D', margin: 0, fontWeight: 400 },
  refreshBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 4,
    border: '1px solid #DDE2EC', background: '#fff',
    cursor: 'pointer', color: '#2C4F8A',
    transition: 'background 0.15s',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderRadius: 4,
    background: '#FDECEA', border: '1px solid #F5AAAA',
    color: '#C0392B', fontSize: 13, fontWeight: 500,
  },
  card: {
    background: '#fff', borderRadius: 6,
    border: '1px solid #DDE2EC', borderTop: '3px solid #2C4F8A',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
    overflow: 'hidden',
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: 34, height: 34, borderRadius: '50%',
    border: '3px solid #DDE2EC', borderTopColor: '#2C4F8A',
    animation: 'spin 0.8s linear infinite',
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', gap: 8, textAlign: 'center',
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 8,
    background: '#EEF4FB', display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '11px 16px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: '#4F5F74',
    textTransform: 'uppercase', letterSpacing: '0.4px',
  },
  td: {
    padding: '13px 16px', fontSize: 13.5, color: '#1E2A3B',
    verticalAlign: 'middle',
  },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderTop: '1px solid #E8EDF5', flexWrap: 'wrap', gap: 10,
  },
  pageBtn: {
    width: 30, height: 30, borderRadius: 3,
    border: '1px solid #DDE2EC', background: '#fff',
    cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#4F5F74',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.12s',
  },
  pageBtnActive: { background: '#2C4F8A', color: '#fff', borderColor: '#2C4F8A' },
  infoBox: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 16px', borderRadius: 4,
    background: '#EEF4FB', border: '1px solid #B0C0DE',
    fontSize: 12.5, color: '#2C4F8A', lineHeight: 1.6,
  },
}
