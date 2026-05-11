// src/pages/Auth/Register.jsx
import { useState, useEffect, useRef } from 'react'
import {
  signContract,
  previewContract,
  normalizePhone,
  buildAddress,
} from '../../services/api'
import { getMe } from '../../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import useScrollToTop from '../../hooks/useScrollToTop'
import { tokenStorage } from '../../services/api'
import SignaturePad from 'signature_pad'

const GEO_REGIONS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json'
const GEO_DISTRICTS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json'



/* ═══════════════════════════════════════════════════
   SIGNATURE MODAL
═══════════════════════════════════════════════════ */

function applyCanvasClip(ctx, cw, ch) {
  const p = 3 // Safe zone padding
  const r = 9 // Inner border radius
  ctx.beginPath()
  ctx.moveTo(p + r, p)
  ctx.lineTo(cw - p - r, p)
  ctx.quadraticCurveTo(cw - p, p, cw - p, p + r)
  ctx.lineTo(cw - p, ch - p - r)
  ctx.quadraticCurveTo(cw - p, ch - p, cw - p - r, ch - p)
  ctx.lineTo(p + r, ch - p)
  ctx.quadraticCurveTo(p, ch - p, p, ch - p - r)
  ctx.lineTo(p, p + r)
  ctx.quadraticCurveTo(p, p, p + r, p)
  ctx.clip()
}

function SignatureModal({ onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const padRef = useRef(null)
  const containerRef = useRef(null)

  const [hasSig, setHasSig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  const LOGICAL_W = 900
  const LOGICAL_H = 450

  // ── Init SignaturePad ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Touch offset fix ────────────────────────────────────────
    // SignaturePad koordinat formulasi:
    //   x = (touch.clientX - rect.left) * (canvas.width / rect.width)
    // Agar canvas.width !== rect.width bo'lsa → offset xato!
    // Yechim: canvas intrinsic size = CSS size (doim)
    const applySize = () => {
      if (!containerRef.current) return
      const cw = containerRef.current.clientWidth || LOGICAL_W
      const ch = Math.round(cw / 2)
      // Intrinsic = CSS → scale = 1 → touch to'g'ri joy
      canvas.width = cw
      canvas.height = ch
      canvas.style.width = cw + 'px'
      canvas.style.height = ch + 'px'
      // Canvas chegarasidan chiqmaslik — xavfsiz (safe) zona qoldirib clip qilish
      const ctx = canvas.getContext('2d')
      applyCanvasClip(ctx, cw, ch)
    }
    applySize()

    canvas.style.touchAction = 'none'
    canvas.style.userSelect = 'none'

    const isMobile = window.innerWidth < 768;
    const pad = new SignaturePad(canvas, {
      minWidth: isMobile ? 0.6 : 1.0, // Thinner on mobile
      maxWidth: isMobile ? 2.5 : 4.0, // Thinner on mobile
      penColor: '#000080', // Reverted to original blue drawing color
      backgroundColor: 'rgba(0,0,0,0)',
      velocityFilterWeight: 0.7, // SignWell style: balanced smoothness without lag
    })

    pad.addEventListener('beginStroke', () => {
      setSaveErr(null)
    })
    pad.addEventListener('endStroke', () => {
      setHasSig(!pad.isEmpty())
    })

    padRef.current = pad

    // Resize: canvas + CSS birga o'zgaradi, imzo scale qilib saqlanadi
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !padRef.current) return
      const cw = containerRef.current.clientWidth
      if (!cw || cw === canvas.width) return
      const ch = Math.round(cw / 2)
      const scaleX = cw / canvas.width
      const scaleY = ch / canvas.height
      const data = padRef.current.toData()
      canvas.width = cw
      canvas.height = ch
      canvas.style.width = cw + 'px'
      canvas.style.height = ch + 'px'
      // Resize keyin clip rect qayta o'rnatish
      const rCtx = canvas.getContext('2d')
      applyCanvasClip(rCtx, cw, ch)
      if (data?.length) {
        const scaled = data.map((g) => ({
          ...g,
          points: g.points.map((p) => ({
            ...p,
            x: p.x * scaleX,
            y: p.y * scaleY,
          })),
        }))
        padRef.current.fromData(scaled)
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      pad.off()
    }
  }, [])

  const handleClear = () => {
    if (!padRef.current) return
    padRef.current.clear()
    setHasSig(false)
    setSaveErr(null)
  }

  const compressImage = async (dataUrl, maxSizeKB = 100) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        let quality = 0.9
        const tryCompress = () => {
          const compressed = canvas.toDataURL('image/png', quality)
          const base64Length =
            compressed.length - 'data:image/png;base64,'.length
          const sizeKB = Math.round((base64Length * 0.75) / 1024)

          if (sizeKB > maxSizeKB && quality > 0.3) {
            quality -= 0.1
            tryCompress()
          } else {
            resolve(compressed)
          }
        }
        tryCompress()
      }
      img.src = dataUrl
    })
  }

  const handleConfirm = async () => {
    if (!padRef.current) {
      setSaveErr('Imzo maydoni tayyor emas')
      return
    }

    if (padRef.current.isEmpty()) {
      setSaveErr("Iltimos, imzo qo'ying")
      return
    }

    if (saving) return

    setSaving(true)
    setSaveErr(null)

    try {
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL('image/png')
      const compressedDataUrl = await compressImage(dataUrl, 100)
      onConfirm(compressedDataUrl)
    } catch (err) {
      setSaveErr(err.message || 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  const canConfirm = hasSig && !saving

  return (
    <div style={SM.overlay}>
      <div style={SM.box}>
        <div style={SM.header}>
          <div style={SM.headerLeft}>
            <div style={SM.penIcon}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <p style={SM.headerTitle}>Imzo qo'ying</p>
              <p style={SM.headerSub}>Barmoq yoki sichqoncha bilan imzolang</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleClear} style={SM.clearBtn}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
              </svg>
              <span>Tozalash</span>
            </button>
            <button onClick={onCancel} style={SM.closeBtn}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div style={SM.canvasZone}>
          {!hasSig && (
            <div style={SM.hintOverlay}>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0004a6"
                strokeWidth="1.5"
                opacity="0.4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <p style={SM.hintText}>Bu yerga imzo qo'ying</p>
              <p style={SM.hintSub}>Barmoq yoki sichqoncha bilan</p>
            </div>
          )}
          <div ref={containerRef} style={SM.canvasContainer}>
            <canvas
              ref={canvasRef}
              style={SM.canvas}
              width={900}
              height={450}
            />
          </div>
        </div>

        <div style={SM.footer}>
          <div style={SM.statusArea}>
            {saveErr ? (
              <span style={SM.statusError}>⚠ {saveErr}</span>
            ) : hasSig ? (
              <span style={SM.statusOk}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Imzo tayyor
              </span>
            ) : (
              <span style={SM.statusWait}>Imzo kutilmoqda...</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onCancel} style={SM.cancelBtn}>
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              style={{
                ...SM.confirmBtn,
                opacity: canConfirm ? 1 : 0.38,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
              }}
            >
              {saving ? (
                <>
                  <span style={SM.miniSpin} />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Tasdiqlash
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SM = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(4,6,20,.88)',
    backdropFilter: 'blur(24px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    fontFamily: "'DM Sans',sans-serif",
  },
  box: {
    background: 'linear-gradient(160deg,#080d1f 0%,#0f1535 60%,#151e45 100%)',
    border: '1px solid rgba(99,102,241,.3)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '720px',
    boxShadow: '0 40px 100px rgba(0,0,0,.8)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(99,102,241,.12)',
    flexShrink: 0,
    background: 'rgba(99,102,241,.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  penIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#0004a6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,4,166,.4)',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  headerSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,.35)',
    margin: '2px 0 0',
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 13px',
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,.55)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'DM Sans',sans-serif",
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'rgba(239,68,68,.12)',
    border: '1px solid rgba(239,68,68,.2)',
    borderRadius: '8px',
    color: 'rgba(239,68,68,.75)',
    cursor: 'pointer',
  },
  canvasZone: {
    position: 'relative',
    padding: '16px 18px',
    background: 'rgba(0,0,0,.18)',
  },
  hintOverlay: {
    position: 'absolute',
    inset: '16px 18px',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    pointerEvents: 'none',
  },
  hintText: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'rgba(0,4,166,.5)',
    margin: 0,
  },
  hintSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,.2)',
    margin: 0,
  },
  canvasContainer: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid rgba(0,4,166,.3)',
    boxShadow: '0 2px 20px rgba(0,0,0,.5)',
    background: 'white',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 10 10\'><circle cx=\'5\' cy=\'5\' r=\'3.5\' fill=\'black\'/></svg>") 5 5, crosshair',
    background: 'white',
    borderRadius: '12px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px 14px',
    borderTop: '1px solid rgba(99,102,241,.1)',
    flexShrink: 0,
    gap: '10px',
    background: 'rgba(99,102,241,.03)',
  },
  statusArea: {
    flex: 1,
  },
  statusOk: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#4ade80',
    fontSize: '13px',
    fontWeight: '600',
  },
  statusWait: {
    color: 'rgba(255,255,255,.28)',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  statusError: {
    color: '#fca5a5',
    fontSize: '12px',
  },
  cancelBtn: {
    padding: '10px 18px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,.55)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'DM Sans',sans-serif",
  },
  confirmBtn: {
    padding: '10px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#0004a6',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: "'DM Sans',sans-serif",
    transition: 'opacity .2s',
  },
  miniSpin: {
    display: 'inline-block',
    width: '13px',
    height: '13px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,.3)',
    borderTopColor: '#fff',
    animation: 'spin .8s linear infinite',
    flexShrink: 0,
  },
}

/* ═══════════════════════════════════════════════════
   CONTRACT MODAL
═══════════════════════════════════════════════════ */
function ContractModal({ onAgree, onCancel }) {
  const [agreed, setAgreed] = useState(false)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const pdfWrapRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const noCtx = (e) => e.preventDefault()
    const noSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') e.preventDefault()
    }
    const noPrint = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') e.preventDefault()
    }
    document.addEventListener('keydown', noSave)
    document.addEventListener('keydown', noPrint)
    document.addEventListener('contextmenu', noCtx)
    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', noSave)
      document.removeEventListener('keydown', noPrint)
      document.removeEventListener('contextmenu', noCtx)
    }
  }, [])

  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      renderPDF()
    }
    document.head.appendChild(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = pdfWrapRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 40)
        setScrolledToEnd(true)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const renderPDF = async () => {
    try {
      // Backend preview endpoint dan PDF olish
      // Form to'ldirilmagan holatda bo'lishi mumkinligi uchun preview uchun default ma'lumotlar
      const pdfBlob = await previewContract({
        address: 'Toshkent',
        phones: ['998900000000'],
        contractType: 'MEMBERSHIP',
      })
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise
      const container = pdfWrapRef.current
      if (!container) return
      container.innerHTML = ''
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p)
        const cv = document.createElement('canvas')
        const vp = page.getViewport({ scale: 1.5 })
        cv.width = vp.width
        cv.height = vp.height
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp })
          .promise
        cv.style.cssText =
          'display:block;max-width:100%;height:auto;user-select:none;pointer-events:none'
        container.appendChild(cv)
        const sep = document.createElement('div')
        sep.style.height = '12px'
        container.appendChild(sep)
      }
    } catch {
      if (pdfWrapRef.current)
        pdfWrapRef.current.innerHTML =
          '<p style="color:rgba(255,255,255,.4);padding:40px;text-align:center">Shartnomani yuklab bo\'lmadi</p>'
    }
  }

  return (
    <div style={CM.overlay}>
      <div style={CM.box}>
        <div style={CM.header}>
          <div>
            <h2 style={CM.title}>A'zolik shartnomasi</h2>
            <p style={CM.sub}>
              Platformadan foydalanishdan oldin diqqat bilan o'qib chiqing
            </p>
          </div>
          <div style={CM.docIcon}>
            <svg
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
        </div>

        <div
          ref={pdfWrapRef}
          className="pdf-secure"
          style={CM.pdf}
          onContextMenu={(e) => e.preventDefault()}
          onSelectStart={(e) => e.preventDefault()}
        >
          <div
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,.4)',
              padding: '48px 20px',
            }}
          >
            <div
              style={{
                animation: 'spin 1s linear infinite',
                display: 'inline-block',
              }}
            >
              <svg
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="15.7 47.1" />
              </svg>
            </div>
            <p style={{ marginTop: '12px', fontSize: '14px' }}>
              Shartnoma yuklanmoqda...
            </p>
          </div>
        </div>

        <div style={CM.footer}>
          {!scrolledToEnd && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255,255,255,.35)',
                margin: '0 0 10px',
              }}
            >
              ⬇️ Shartnomani oxirigacha o'qing
            </p>
          )}
          <div
            style={{
              opacity: scrolledToEnd ? 1 : 0,
              pointerEvents: scrolledToEnd ? 'auto' : 'none',
              transition: 'opacity .4s ease',
            }}
          >
            <div
              onClick={() => setAgreed(!agreed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                background: 'rgba(168,85,247,.07)',
                border: '1px solid rgba(168,85,247,.18)',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  transition: 'all .2s',
                  border:
                    '1.5px solid ' +
                    (agreed ? 'rgba(34,197,94,.8)' : 'rgba(168,85,247,.35)'),
                  background: agreed
                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {agreed && (
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="white"
                      strokeWidth="2.5"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
              <span
                style={{
                  color: agreed ? '#86efac' : 'rgba(255,255,255,.6)',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Shartnomani o'qidim va roziman
              </span>
            </div>
          </div>
          <div
            style={{
              opacity: scrolledToEnd ? 1 : 0,
              pointerEvents: scrolledToEnd ? 'auto' : 'none',
              transition: 'opacity .5s ease .1s',
            }}
          >
            <button
              onClick={onAgree}
              disabled={!agreed}
              style={{
                ...CM.agreeBtn,
                opacity: agreed ? 1 : 0.45,
                cursor: agreed ? 'pointer' : 'not-allowed',
              }}
            >
              <svg
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Davom etish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CM = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2001,
    background: 'rgba(10,8,30,.82)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'fadeOverlay .25s ease both',
  },
  box: {
    background: 'linear-gradient(145deg,#1e1b4b,#2d1f6e)',
    border: '1px solid rgba(168,85,247,.3)',
    borderRadius: '22px',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '600px',
    width: '100%',
    height: '90vh',
    maxHeight: '90vh',
    boxShadow: '0 32px 80px rgba(0,0,0,.65)',
    animation: 'slideUp .3s ease both',
    fontFamily: "'DM Sans',sans-serif",
    overflow: 'hidden',
  },
  header: {
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    borderBottom: '1px solid rgba(168,85,247,.12)',
    flexShrink: 0,
  },
  title: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  sub: { fontSize: '12px', color: 'rgba(255,255,255,.38)', margin: 0 },
  docIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '13px',
    background:
      'linear-gradient(135deg,rgba(168,85,247,.22),rgba(99,102,241,.12))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a855f7',
    border: '1px solid rgba(168,85,247,.18)',
    flexShrink: 0,
  },
  pdf: {
    flex: 1,
    overflow: 'auto',
    background: 'rgba(255,255,255,.03)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '14px 28px 18px',
    borderTop: '1px solid rgba(168,85,247,.12)',
    flexShrink: 0,
  },
  agreeBtn: {
    padding: '13px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    fontFamily: "'DM Sans',sans-serif",
    boxShadow: '0 6px 20px rgba(34,197,94,.3)',
    cursor: 'pointer',
  },
}

/* ═══════════════════════════════════════════════════
   SIMPLE DROPDOWN
═══════════════════════════════════════════════════ */
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
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,.08)',
          border: `1px solid ${open ? 'rgba(168,85,247,.7)' : 'rgba(255,255,255,.15)'}`,
          borderRadius: open ? '12px 12px 0 0' : '12px',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'border-color .2s',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            color: selected ? '#fff' : 'rgba(255,255,255,.35)',
            fontSize: '14px',
          }}
        >
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
            stroke="rgba(255,255,255,.4)"
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
            zIndex: 999,
            background: 'linear-gradient(145deg,#2d1b69,#1e1b4b)',
            border: '1px solid rgba(168,85,247,.3)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            maxHeight: '210px',
            overflowY: 'auto',
            boxShadow: '0 12px 32px rgba(0,0,0,.5)',
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'rgba(255,255,255,.3)',
                fontSize: '14px',
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
                className="ss-item"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  background:
                    opt.value === value
                      ? 'rgba(168,85,247,.18)'
                      : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  color:
                    opt.value === value ? '#e9d5ff' : 'rgba(255,255,255,.75)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background .12s',
                }}
              >
                {opt.label}
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7l4 4 6-6"
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN REGISTER PAGE
═══════════════════════════════════════════════════ */
export default function Register() {
  useScrollToTop()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, setUser } = useAuth()

  const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.uzintellekt.uz'

  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [showContractModal, setShowContractModal] = useState(true)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureData, setSignatureData] = useState(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Token from dashboard redirect: /register?token=ACCESS&refresh=REFRESH
  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')
    if (token) {
      tokenStorage.set(token)
      if (refresh) tokenStorage.setRefresh(refresh)
      window.history.replaceState({}, '', '/register')
    }
  }, [searchParams])

  const [form, setForm] = useState({
    phoneRequired: '',
    phoneOptional: '',
    region: '',
    district: '',
    street: '',
    houseNumber: '',
  })
  const [regions, setRegions] = useState([])
  const [allDistricts, setAllDistricts] = useState([])
  const [filteredDistricts, setFiltered] = useState([])

  // Pre-fill phone from OneID user data when available
  useEffect(() => {
    if (user?.phones?.length && !form.phoneRequired) {
      setForm((p) => ({ ...p, phoneRequired: user.phones[0] }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (user === null) {
      navigate('/login', { replace: true })
      return
    }
    if (user && user.isMember) {
      window.location.replace(DASHBOARD_URL)
    }
  }, [authLoading, user, navigate, DASHBOARD_URL])

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    Promise.all([
      fetch(GEO_REGIONS_URL, { signal: ctrl.signal }).then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      }),
      fetch(GEO_DISTRICTS_URL, { signal: ctrl.signal }).then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      }),
    ])
      .then(([reg, dis]) => {
        setRegions(reg)
        setAllDistricts(dis)
      })
      .catch((err) => {
        if (err.name !== 'AbortError')
          setError('Viloyat/tuman yuklanmadi. Yangilang.')
      })
      .finally(() => {
        setRegionsLoading(false)
        setLoading(false)
      })
    return () => ctrl.abort()
  }, [])

  useEffect(() => {
    if (form.region) {
      setFiltered(
        allDistricts.filter((d) => d?.region_id === parseInt(form.region))
      )
      setForm((p) => ({ ...p, district: '' }))
    } else setFiltered([])
  }, [form.region, allDistricts])

  const handleChange = (e) => {
    setError(null)
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handlePhoneChange = (e) => {
    setError(null)
    const { name, value } = e.target
    // Faqat raqamlar va '+' belgisiga ruxsat berish
    const numericValue = value.replace(/[^\d+]/g, '')
    setForm((p) => ({ ...p, [name]: numericValue }))
  }

  // Phone valid if it produces 998XXXXXXXXX (12 digits starting with 998)
  const isValidPhone = (p) => {
    if (!p) return false
    const normalized = normalizePhone(p)
    return /^998\d{9}$/.test(normalized)
  }

  const formComplete = () =>
    form.phoneRequired &&
    isValidPhone(form.phoneRequired) &&
    (!form.phoneOptional || isValidPhone(form.phoneOptional)) &&
    form.region &&
    form.district &&
    form.street.trim() &&
    form.houseNumber.trim()

  const handleContractAgree = () => setShowContractModal(false)
  const handleBecomeMember = () => {
    setError(null)
    setShowSignatureModal(true)
  }

  const handleSignatureConfirm = (dataUrl) => {
    setSignatureData(dataUrl)
    setShowSignatureModal(false)
    handleRegister(dataUrl)
  }

  const handleRegister = async (sigData) => {
    if (!formComplete()) {
      setError("Barcha * maydonlarni to'g'ri to'ldiring.")
      return
    }
    if (!sigData) {
      setError('Imzo talab qilinadi.')
      return
    }
    setError(null)
    setSubmitLoading(true)

    try {
      // Region va district nomlarini topish
      const regionObj = regions.find((r) => String(r.id) === form.region)
      const districtObj = filteredDistricts.find(
        (d) => String(d.id) === form.district
      )
      const regionName = regionObj?.name || ''
      const districtName = districtObj?.name || ''

      // Phone list — backend format: ["998901234567"]
      const phones = [normalizePhone(form.phoneRequired)]
      if (form.phoneOptional && form.phoneOptional.trim()) {
        phones.push(normalizePhone(form.phoneOptional))
      }

      // Address string
      const address = buildAddress({
        regionName,
        districtName,
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim(),
      })

      // POST /api/v1/contracts/sign — multipart
      const signedPdfBlob = await signContract(
        {
          address,
          phones,
          contractType: 'MEMBERSHIP',
          // pseudonym: ixtiyoriy, qo'shmoqchi bo'lsangiz form ga qo'shing
        },
        sigData
      )
      const userData = await getMe()
      setUser(userData)

      // Signed PDF ni yuklab olish (ixtiyoriy)
      const pdfUrl = URL.createObjectURL(signedPdfBlob)
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `shartnoma_${Date.now()}.pdf`
      link.click()
      URL.revokeObjectURL(pdfUrl)

      setSuccess(true)
      // Ro'yxatdan o'tish tugadi → tashqi dashboard domeniga o'tish
      setTimeout(() => {
        window.location.replace(DASHBOARD_URL)
      }, 2500)
    } catch (err) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik. Qayta urining.")
      setSubmitLoading(false)
    }
  }

  const regionOptions = regions
    .filter((r) => r?.id && r?.name)
    .map((r) => ({ value: String(r.id), label: r.name }))
  const districtOptions = filteredDistricts
    .filter((d) => d?.id && d?.name)
    .map((d) => ({ value: String(d.id), label: d.name }))

  return (
    <section style={R.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeOverlay{ from{opacity:0} to{opacity:1} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(32px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes successPop { 0%{transform:scale(.7);opacity:0} 80%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .reg-card{animation:fadeUp .4s ease both}
        .reg-input{width:100%;padding:12px 16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:12px;color:#fff;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s,background .2s;box-sizing:border-box}
        .reg-input::placeholder{color:rgba(255,255,255,.3)}
        .reg-input:focus{border-color:rgba(168,85,247,.7);background:rgba(168,85,247,.06)}
        .ss-item:hover{background:rgba(255,255,255,.06) !important}
        .submit-btn{transition:transform .15s,box-shadow .15s}
        .submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(168,85,247,.55) !important}
        .submit-btn:active:not(:disabled){transform:scale(.97)}
        .pdf-secure{user-select:none;-webkit-user-select:none}
        .pdf-secure canvas{user-select:none;pointer-events:none}
        @media(max-width:480px){.reg-grid{grid-template-columns:1fr !important}}
      `}</style>

      {showContractModal && (
        <ContractModal
          onAgree={handleContractAgree}
          onCancel={() => navigate('/login')}
        />
      )}
      {showSignatureModal && (
        <SignatureModal
          onConfirm={handleSignatureConfirm}
          onCancel={() => setShowSignatureModal(false)}
        />
      )}

      <div
        style={{
          ...R.blob,
          top: '-100px',
          right: '-80px',
          width: 380,
          height: 380,
          background:
            'radial-gradient(circle,rgba(168,85,247,.22) 0%,transparent 70%)',
        }}
      />
      <div
        style={{
          ...R.blob,
          bottom: '-100px',
          left: '-80px',
          width: 340,
          height: 340,
          background:
            'radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%)',
        }}
      />

      <div style={R.wrap}>
        <div style={R.card} className="reg-card">
          {/* Progress */}
          <div style={R.progressWrap}>
            <div style={R.progressBar}>
              <div
                style={{
                  ...R.progressFill,
                  width: success
                    ? '100%'
                    : signatureData
                      ? '90%'
                      : formComplete()
                        ? '65%'
                        : '30%',
                }}
              />
            </div>
            <span style={R.progressText}>
              {success
                ? "A'zo bo'ldingiz! 🎉"
                : signatureData
                  ? 'Imzo qabul qilindi...'
                  : formComplete()
                    ? "A'zo bo'lish uchun tayyor"
                    : "Ma'lumotlarni kiriting"}
            </span>
          </div>

          {/* Title */}
          <div style={R.titleBlock}>
            <div style={R.iconBox}>
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h1 style={R.h1}>
              {success ? 'Muvaffaqiyatli! 🎉' : "A'zo bo'lish"}
            </h1>
            {/* Show logged-in user identity from OneID */}
            {user && !success && (
              <div style={R.userPill}>
                <span style={R.userPillDot} />
                <span>
                  {[user.lastName, user.firstName, user.middleName]
                    .filter(Boolean)
                    .join(' ') ||
                    user.pinfl ||
                    'Autentifikatsiya qilingan foydalanuvchi'}
                </span>
              </div>
            )}
            <p style={R.subtitle}>
              {success
                ? "Dashboard'ga yo'naltirilmoqda..."
                : "Ma'lumotlaringizni kiriting"}
            </p>
          </div>

          {(loading || submitLoading) && !success && (
            <div style={R.spinnerWrap}>
              <div style={R.spinner} />
              <p style={R.spinnerText}>
                {submitLoading
                  ? "Ma'lumotlar yuborilmoqda..."
                  : 'Yuklanmoqda...'}
              </p>
            </div>
          )}

          {success && (
            <div style={R.successBox}>
              <div style={R.successCheck}>
                <svg
                  width="32"
                  height="32"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p
                style={{
                  color: '#bbf7d0',
                  fontSize: '15px',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                Ro'yxatdan muvaffaqiyatli o'tdingiz!
              </p>
            </div>
          )}

          {error && (
            <div style={R.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !submitLoading && !success && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              <div>
                <label style={R.label}>
                  Telefon raqami <span style={R.required}>*</span>
                </label>
                <input
                  type="tel"
                  name="phoneRequired"
                  value={form.phoneRequired}
                  onChange={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                  className="reg-input"
                />
                {form.phoneRequired && !isValidPhone(form.phoneRequired) && (
                  <p style={R.fieldError}>
                    Noto'g'ri format. Misol: +998901234567
                  </p>
                )}
              </div>
              <div>
                <label style={R.label}>Qo'shimcha telefon</label>
                <input
                  type="tel"
                  name="phoneOptional"
                  value={form.phoneOptional}
                  onChange={handlePhoneChange}
                  placeholder="+998 91 234 56 78"
                  className="reg-input"
                />
                {form.phoneOptional && !isValidPhone(form.phoneOptional) && (
                  <p style={R.fieldError}>Noto'g'ri format</p>
                )}
              </div>
              <div>
                <label style={R.label}>
                  Viloyat <span style={R.required}>*</span>
                </label>
                {regionsLoading ? (
                  <div
                    className="reg-input"
                    style={{ color: 'rgba(255,255,255,.3)' }}
                  >
                    Yuklanmoqda...
                  </div>
                ) : (
                  <SimpleSelect
                    options={regionOptions}
                    value={form.region}
                    onChange={(v) => {
                      setError(null)
                      setForm((p) => ({ ...p, region: v }))
                    }}
                    placeholder="Viloyatni tanlang"
                  />
                )}
              </div>
              <div>
                <label style={R.label}>
                  Tuman <span style={R.required}>*</span>
                </label>
                <SimpleSelect
                  options={districtOptions}
                  value={form.district}
                  onChange={(v) => {
                    setError(null)
                    setForm((p) => ({ ...p, district: v }))
                  }}
                  placeholder={
                    form.region ? 'Tumanni tanlang' : 'Avval viloyat tanlang'
                  }
                  disabled={!form.region}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                }}
                className="reg-grid"
              >
                <div>
                  <label style={R.label}>
                    Ko'cha <span style={R.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Ko'cha nomi"
                    className="reg-input"
                  />
                </div>
                <div>
                  <label style={R.label}>
                    Uy raqami <span style={R.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={form.houseNumber}
                    onChange={handleChange}
                    placeholder="12A"
                    className="reg-input"
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(168,85,247,.2)',
                  background: 'rgba(168,85,247,.06)',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,.7)',
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                ✓ Barcha * maydonlarni to'ldiring va shartnomaga rozilik berish
                uchun
                <br />
                <strong style={{ color: '#fff' }}>A'zo bo'lish</strong>{' '}
                tugmasini bosing
              </div>

              <button
                className="submit-btn"
                onClick={handleBecomeMember}
                disabled={!formComplete()}
                style={{
                  ...R.submitBtn,
                  opacity: formComplete() ? 1 : 0.4,
                  cursor: formComplete() ? 'pointer' : 'not-allowed',
                  boxShadow: formComplete()
                    ? '0 8px 28px rgba(168,85,247,.4)'
                    : 'none',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  <path
                    d="M22 11v6M19 14h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                A'zo bo'lish
              </button>
            </div>
          )}
        </div>

        <p style={R.backText}>
          Akkauntingiz bormi?{' '}
          <button onClick={() => navigate('/login')} style={R.linkBtn}>
            Kirish
          </button>
        </p>

        <div style={R.badges}>
          {[
            ['🛡️', 'Xavfsiz'],
            ['📱', 'OneID'],
            ['✓', 'Tezkor'],
          ].map(([icon, label]) => (
            <div key={label} style={R.badge}>
              <span style={{ fontSize: '18px' }}>{icon}</span>
              <span style={R.badgeLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const R = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
    padding: '32px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans',sans-serif",
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(50px)',
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    background: 'rgba(255,255,255,.06)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,.11)',
    borderRadius: '28px',
    padding: '36px 32px',
    boxShadow: '0 32px 80px rgba(0,0,0,.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  progressBar: {
    height: '4px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    background: 'linear-gradient(90deg,#a855f7,#6366f1)',
    transition: 'width .5s ease',
  },
  progressText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,.4)',
    textAlign: 'right',
  },
  titleBlock: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg,#a855f7,#6366f1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(168,85,247,.35)',
  },
  h1: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: { fontSize: '14px', color: 'rgba(255,255,255,.45)', margin: 0 },
  userPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '5px 14px',
    borderRadius: '999px',
    background: 'rgba(168,85,247,.12)',
    border: '1px solid rgba(168,85,247,.28)',
    color: '#e9d5ff',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  userPillDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#a855f7',
    boxShadow: '0 0 6px rgba(168,85,247,.7)',
    flexShrink: 0,
  },
  spinnerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '20px 0',
  },
  spinner: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,.1)',
    borderTopColor: '#a855f7',
    animation: 'spin 1s linear infinite',
  },
  spinnerText: { color: 'rgba(255,255,255,.5)', fontSize: '14px', margin: 0 },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(34,197,94,.1)',
    border: '1px solid rgba(34,197,94,.25)',
  },
  successCheck: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'successPop .4s cubic-bezier(.34,1.56,.64,1) both',
    boxShadow: '0 8px 24px rgba(34,197,94,.3)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(239,68,68,.12)',
    border: '1px solid rgba(239,68,68,.25)',
    color: '#fecaca',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,.75)',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  required: { color: '#f87171' },
  fieldError: { marginTop: '5px', color: '#fca5a5', fontSize: '12px' },
  submitBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px',
    background: 'linear-gradient(135deg,#a855f7,#6366f1)',
    border: 'none',
    borderRadius: '14px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: "'DM Sans',sans-serif",
  },
  backText: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'rgba(255,255,255,.45)',
    margin: 0,
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#c084fc',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'DM Sans',sans-serif",
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    padding: 0,
  },
  badges: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: '10px',
  },
  badge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: '12px',
    gap: '4px',
  },
  badgeLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,.4)',
    fontWeight: '500',
  },
}
