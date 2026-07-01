import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SignaturePad from 'signature_pad'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  PenLine,
  Smartphone,
  Trash2,
  UserPlus,
  X,
  ShieldCheck,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Input,
  Label,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { downloadBlob } from '@/shared/lib/download'
import {
  signContract,
  previewContract,
  normalizePhone,
  buildAddress,
  getMe,
  tokenStorage,
} from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import {
  cleanURLHistory,
  sanitizeFormData,
  sanitizeErrorMessage,
} from '../../utils/securityUtils'

const GEO_REGIONS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json'
const GEO_DISTRICTS_URL =
  'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json'

/* ─────────────── SIGNATURE MODAL ─────────────── */

function applyCanvasClip(ctx, cw, ch) {
  const p = 3
  const r = 9
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

function SignatureModal({ open, onConfirm, onCancel }) {
  const { t } = useTranslation()
  const canvasRef = useRef(null)
  const padRef = useRef(null)
  const containerRef = useRef(null)

  const [hasSig, setHasSig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return

    const applySize = () => {
      if (!containerRef.current) return
      const cw = containerRef.current.clientWidth
      const ch = Math.round(cw / 2)
      canvas.width = cw
      canvas.height = ch
      canvas.style.width = cw + 'px'
      canvas.style.height = ch + 'px'
      const ctx = canvas.getContext('2d')
      applyCanvasClip(ctx, cw, ch)
    }
    applySize()

    canvas.style.touchAction = 'none'
    canvas.style.userSelect = 'none'

    const isMobile = window.innerWidth < 768
    const pad = new SignaturePad(canvas, {
      minWidth: isMobile ? 0.6 : 1.0,
      maxWidth: isMobile ? 2.5 : 4.0,
      penColor: '#1d3a8a',
      backgroundColor: 'rgba(0,0,0,0)',
      velocityFilterWeight: 0.7,
    })

    pad.addEventListener('beginStroke', () => setSaveErr(null))
    pad.addEventListener('endStroke', () => setHasSig(!pad.isEmpty()))

    padRef.current = pad

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
      const rCtx = canvas.getContext('2d')
      applyCanvasClip(rCtx, cw, ch)
      if (data?.length) {
        const scaled = data.map((g) => ({
          ...g,
          points: g.points.map((pt) => ({
            ...pt,
            x: pt.x * scaleX,
            y: pt.y * scaleY,
          })),
        }))
        padRef.current.fromData(scaled)
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      pad.off()
      setHasSig(false)
      setSaveErr(null)
    }
  }, [open])

  const handleClear = () => {
    if (!padRef.current) return
    padRef.current.clear()
    setHasSig(false)
    setSaveErr(null)
  }

  const compressImage = (dataUrl, maxSizeKB = 100) =>
    new Promise((resolve) => {
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
          const base64Length = compressed.length - 'data:image/png;base64,'.length
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

  const handleConfirm = async () => {
    if (!padRef.current) {
      setSaveErr(t('register_page.sig_err_notready'))
      return
    }
    if (padRef.current.isEmpty()) {
      setSaveErr(t('register_page.sig_err_empty'))
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
      setSaveErr(err.message || t('register_page.sig_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-3xl gap-0 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PenLine className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('register_page.sig_title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('register_page.sig_subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5" />
              {t('register_page.sig_clear')}
            </Button>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label={t('register_page.close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative px-5 py-4">
          {!hasSig && (
            <div className="pointer-events-none absolute inset-x-5 inset-y-4 z-10 flex flex-col items-center justify-center gap-1.5 opacity-60">
              <PenLine className="h-8 w-8 text-primary/40" />
              <p className="text-sm font-semibold text-muted-foreground">
                {t('register_page.sig_placeholder_title')}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {t('register_page.sig_placeholder_sub')}
              </p>
            </div>
          )}
          <div
            ref={containerRef}
            className="relative z-0 overflow-hidden rounded-lg border-2 border-border bg-card shadow-soft"
          >
            <canvas ref={canvasRef} width={900} height={450} className="block w-full" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3.5">
          <div className="flex-1 text-sm">
            {saveErr ? (
              <span className="inline-flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {saveErr}
              </span>
            ) : hasSig ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                <Check className="h-3.5 w-3.5" />
                {t('register_page.sig_ready')}
              </span>
            ) : (
              <span className="text-xs italic text-muted-foreground">
                {t('register_page.sig_waiting')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              {t('register_page.cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={!hasSig || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('register_page.sig_saving')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('register_page.sig_confirm')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────── CONTRACT MODAL ─────────────── */

function ContractModal({ open, onAgree, onCancel, form, regions, allDistricts }) {
  const { t } = useTranslation()
  const [agreed, setAgreed] = useState(false)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(true)
  const pdfWrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
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
      document.removeEventListener('keydown', noSave)
      document.removeEventListener('keydown', noPrint)
      document.removeEventListener('contextmenu', noCtx)
      setAgreed(false)
      setScrolledToEnd(false)
      setLoadingPdf(true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    // pdf.js allaqachon yuklangan bo'lsa, qayta inject qilmaymiz
    if (window.pdfjsLib) {
      renderPDF()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      renderPDF()
    }
    document.head.appendChild(s)
    return () => {
      s.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = pdfWrapRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
        setScrolledToEnd(true)
      }
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [open])

  const renderPDF = async () => {
    try {
      const sanitizedForm = sanitizeFormData(form)
      const regionObj = regions.find((r) => String(r.id) === sanitizedForm.region)
      const districtObj = allDistricts.find(
        (d) => String(d.id) === sanitizedForm.district
      )
      const addressString = buildAddress({
        regionName: regionObj ? regionObj.name : '',
        districtName: districtObj ? districtObj.name : '',
        street: sanitizedForm.street,
        houseNumber: sanitizedForm.houseNumber,
      })
      const primaryPhone = normalizePhone(sanitizedForm.phoneRequired)
      const secondaryPhone = sanitizedForm.phoneOptional
        ? normalizePhone(sanitizedForm.phoneOptional)
        : null
      const phonesList = [primaryPhone, secondaryPhone].filter(Boolean)

      if (!tokenStorage.get()) {
        if (pdfWrapRef.current) {
          pdfWrapRef.current.innerHTML = `
            <div class="prose prose-sm max-w-none p-6 text-foreground">
              <h3 class="text-base font-semibold text-center">[TEST REJIMI — SHARTNOMA PREVIEW]</h3>
              <p><strong>Foydalanuvchi ma'lumotlari:</strong></p>
              <ul>
                <li><strong>Telefon:</strong> ${phonesList.join(', ')}</li>
                <li><strong>Manzil:</strong> ${addressString}</li>
                <li><strong>Taxallus:</strong> ${sanitizedForm.pseudonym || "Yo'q"}</li>
              </ul>
              <p>Tizimda token yo'qligi sababli mock shartnoma yuklandi. Shartnoma matnini tasdiqlab, imzo chekish tugmasini bosing.</p>
            </div>`
          setScrolledToEnd(true)
          setLoadingPdf(false)
        }
        return
      }

      const pdfBlob = await previewContract({
        address: addressString,
        phones: phonesList,
        contractType: 'MEMBERSHIP',
        pseudonym: sanitizedForm.pseudonym || null,
        pseudoname: sanitizedForm.pseudonym || null,
      })
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise
      const container = pdfWrapRef.current
      if (!container) {
        URL.revokeObjectURL(pdfUrl)
        return
      }
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
          'display:block;max-width:100%;height:auto;user-select:none;pointer-events:none;border-radius:6px;box-shadow:0 1px 2px rgba(15,23,42,.06)'
        container.appendChild(cv)
        const sep = document.createElement('div')
        sep.style.height = '12px'
        container.appendChild(sep)
      }
      URL.revokeObjectURL(pdfUrl)
      setLoadingPdf(false)
    } catch {
      if (pdfWrapRef.current) {
        pdfWrapRef.current.innerHTML =
          `<p class="p-10 text-center text-sm text-muted-foreground">${t('register_page.contract_load_err')}</p>`
      }
      setLoadingPdf(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="flex h-[90vh] max-h-[90dvh] max-w-2xl flex-col gap-0 p-0">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-muted/40 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t('register_page.contract_title')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('register_page.contract_subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary sm:flex">
              <FileText className="h-5 w-5" />
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label={t('register_page.close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={pdfWrapRef}
          className="pdf-secure flex flex-1 select-none flex-col items-center overflow-auto bg-muted/30 p-4"
          onContextMenu={(e) => e.preventDefault()}
          onSelectStart={(e) => e.preventDefault()}
        >
          {loadingPdf && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm">{t('register_page.contract_loading')}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col border-t border-border bg-card px-6 py-4">
          {!scrolledToEnd && (
            <p className="mb-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownToLine className="h-3.5 w-3.5" />
              {t('register_page.contract_read_to_end')}
            </p>
          )}
          <div
            className={cn(
              'transition-opacity duration-300',
              scrolledToEnd ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            <button
              type="button"
              onClick={() => setAgreed(!agreed)}
              className="mb-3 flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  agreed
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-border bg-card'
                )}
              >
                {agreed && <Check className="h-3 w-3" />}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  agreed ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {t('register_page.contract_agree')}
              </span>
            </button>

            <Button
              onClick={onAgree}
              disabled={!agreed}
              variant="success"
              size="lg"
              className="w-full"
            >
              <Check className="h-4 w-4" />
              {t('register_page.contract_continue')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────── REGION/DISTRICT SELECT ─────────────── */

function GeoSelect({ options, value, onChange, placeholder, disabled }) {
  const { t } = useTranslation()
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
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <span className={cn(selected ? 'text-foreground' : 'text-muted-foreground')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-soft-md">
          {options.length === 0 ? (
            <div className="px-3 py-3 text-center text-sm text-muted-foreground">
              {t('register_page.geo_empty')}
            </div>
          ) : (
            options.map((opt) => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-primary-soft text-primary-soft-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────── MAIN REGISTER PAGE ─────────────── */

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading, setUser } = useAuth()

  const DASHBOARD_URL =
    import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.uzintellekt.uz'

  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [regionsLoading, setRegionsLoading] = useState(true)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureData, setSignatureData] = useState(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')
    if (token) {
      tokenStorage.set(token)
      if (refresh) tokenStorage.setRefresh(refresh)
      cleanURLHistory('/register')
    }
  }, [searchParams])

  const [form, setForm] = useState({
    phoneRequired: '',
    phoneOptional: '',
    pseudonym: '',
    region: '',
    district: '',
    street: '',
    houseNumber: '',
  })
  const [regions, setRegions] = useState([])
  const [allDistricts, setAllDistricts] = useState([])
  const [filteredDistricts, setFiltered] = useState([])

  useEffect(() => {
    if (user?.phones?.length && !form.phoneRequired) {
      setForm((p) => ({ ...p, phoneRequired: user.phones[0] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (user && user.isMember) {
      window.location.replace(DASHBOARD_URL)
    }
  }, [authLoading, user, DASHBOARD_URL])

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
        if (err.name !== 'AbortError') {
          setError(t('register_page.err_geo'))
        }
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
    } else {
      setFiltered([])
    }
  }, [form.region, allDistricts])

  const handleChange = (e) => {
    setError(null)
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handlePhoneChange = (e) => {
    setError(null)
    const { name, value } = e.target
    const numericValue = value.replace(/[^\d+]/g, '')
    setForm((p) => ({ ...p, [name]: numericValue }))
  }

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

  const handleContractAgree = () => {
    setShowContractModal(false)
    setShowSignatureModal(true)
  }
  const handleBecomeMember = () => {
    setError(null)
    if (!formComplete()) {
      setError(t('register_page.err_fill'))
      return
    }
    setShowContractModal(true)
  }

  const handleSignatureConfirm = (dataUrl) => {
    setSignatureData(dataUrl)
    setShowSignatureModal(false)
    handleRegister(dataUrl)
  }

  const handleRegister = async (sigData) => {
    if (!formComplete()) {
      setError(t('register_page.err_fill'))
      return
    }
    if (!sigData) {
      setError(t('register_page.err_signature'))
      return
    }
    setError(null)
    setSubmitLoading(true)

    try {
      const sanitizedForm = sanitizeFormData(form)
      const regionObj = regions.find((r) => String(r.id) === sanitizedForm.region)
      const districtObj = filteredDistricts.find(
        (d) => String(d.id) === sanitizedForm.district
      )
      const regionName = regionObj?.name || ''
      const districtName = districtObj?.name || ''

      const phones = [normalizePhone(sanitizedForm.phoneRequired)]
      if (sanitizedForm.phoneOptional && sanitizedForm.phoneOptional.trim()) {
        phones.push(normalizePhone(sanitizedForm.phoneOptional))
      }

      const address = buildAddress({
        regionName,
        districtName,
        street: sanitizedForm.street,
        houseNumber: sanitizedForm.houseNumber,
      })

      const signedPdfBlob = await signContract(
        {
          address,
          phones,
          contractType: 'MEMBERSHIP',
          pseudonym: sanitizedForm.pseudonym || null,
          pseudoname: sanitizedForm.pseudonym || null,
        },
        sigData
      )
      const userData = await getMe()
      setUser(userData)

      downloadBlob(signedPdfBlob, `shartnoma_${Date.now()}.pdf`)

      setSuccess(true)
      setTimeout(() => {
        window.location.replace(DASHBOARD_URL)
      }, 2500)
    } catch (err) {
      setError(
        sanitizeErrorMessage(
          err.message || t('register_page.err_register')
        )
      )
      setSubmitLoading(false)
    }
  }

  const regionOptions = regions
    .filter((r) => r?.id && r?.name)
    .map((r) => ({ value: String(r.id), label: r.name }))
  const districtOptions = filteredDistricts
    .filter((d) => d?.id && d?.name)
    .map((d) => ({ value: String(d.id), label: d.name }))

  const progress = success
    ? 100
    : signatureData
      ? 90
      : formComplete()
        ? 65
        : 30

  const progressText = success
    ? t('register_page.progress_success')
    : signatureData
      ? t('register_page.progress_signed')
      : formComplete()
        ? t('register_page.progress_ready')
        : t('register_page.progress_fill')

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <ContractModal
        open={showContractModal}
        onAgree={handleContractAgree}
        onCancel={() => setShowContractModal(false)}
        form={form}
        regions={regions}
        allDistricts={allDistricts}
      />
      <SignatureModal
        open={showSignatureModal}
        onConfirm={handleSignatureConfirm}
        onCancel={() => setShowSignatureModal(false)}
      />

      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-right text-xs text-muted-foreground">{progressText}</p>
            </div>

            {/* Title */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                <UserPlus className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {success ? t('register_page.title_success') : t('register_page.title')}
              </h1>
              {user && !success && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {[user.lastName, user.firstName, user.middleName]
                    .filter(Boolean)
                    .join(' ') ||
                    user.pinfl ||
                    t('register_page.auth_user_fallback')}
                </span>
              )}
              <p className="text-sm text-muted-foreground">
                {success
                  ? t('register_page.redirecting')
                  : t('register_page.subtitle')}
              </p>
            </div>

            {(loading || submitLoading) && !success && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {submitLoading
                    ? t('register_page.submitting')
                    : t('register_page.loading')}
                </p>
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-soft">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-success">
                  {t('register_page.success_msg')}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !submitLoading && !success && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phoneRequired">
                    {t('register_page.phone_label')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneRequired"
                    type="tel"
                    name="phoneRequired"
                    value={form.phoneRequired}
                    onChange={handlePhoneChange}
                    placeholder={t('register_page.phone_ph')}
                  />
                  {form.phoneRequired && !isValidPhone(form.phoneRequired) && (
                    <p className="text-xs text-destructive">
                      {t('register_page.phone_invalid')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneOptional">{t('register_page.phone_opt_label')}</Label>
                  <Input
                    id="phoneOptional"
                    type="tel"
                    name="phoneOptional"
                    value={form.phoneOptional}
                    onChange={handlePhoneChange}
                    placeholder={t('register_page.phone_opt_ph')}
                  />
                  {form.phoneOptional && !isValidPhone(form.phoneOptional) && (
                    <p className="text-xs text-destructive">{t('register_page.phone_opt_invalid')}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pseudonym">{t('register_page.pseudonym_label')}</Label>
                  <Input
                    id="pseudonym"
                    type="text"
                    name="pseudonym"
                    value={form.pseudonym}
                    onChange={handleChange}
                    placeholder={t('register_page.pseudonym_ph')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {t('register_page.region_label')} <span className="text-destructive">*</span>
                  </Label>
                  {regionsLoading ? (
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                      {t('register_page.loading')}
                    </div>
                  ) : (
                    <GeoSelect
                      options={regionOptions}
                      value={form.region}
                      onChange={(v) => {
                        setError(null)
                        setForm((p) => ({ ...p, region: v }))
                      }}
                      placeholder={t('register_page.region_ph')}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {t('register_page.district_label')} <span className="text-destructive">*</span>
                  </Label>
                  <GeoSelect
                    options={districtOptions}
                    value={form.district}
                    onChange={(v) => {
                      setError(null)
                      setForm((p) => ({ ...p, district: v }))
                    }}
                    placeholder={
                      form.region
                        ? t('register_page.district_ph')
                        : t('register_page.district_ph_region_first')
                    }
                    disabled={!form.region}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="street">
                      {t('register_page.street_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="street"
                      type="text"
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder={t('register_page.street_ph')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="houseNumber">
                      {t('register_page.house_label')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="houseNumber"
                      type="text"
                      name="houseNumber"
                      value={form.houseNumber}
                      onChange={handleChange}
                      placeholder={t('register_page.house_ph')}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary-soft/60 p-3 text-center text-xs leading-relaxed text-muted-foreground">
                  {t('register_page.hint')}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBecomeMember}
                  disabled={!formComplete()}
                >
                  <UserPlus className="h-4 w-4" />
                  {t('register_page.submit_btn')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {t('register_page.have_account')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-primary hover:underline"
          >
            {t('register_page.login_link')}
          </button>
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: t('register_page.tile_secure') },
            { icon: Smartphone, label: t('register_page.tile_oneid') },
            { icon: Check, label: t('register_page.tile_fast') },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
