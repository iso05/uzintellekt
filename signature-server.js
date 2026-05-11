// signature-server.js
// O'rnatish: npm install express cors
// Ishga tushirish: node signature-server.js
//
// Bu server faqat test uchun — backend tayyor bo'lgach o'chiriladi
// Imzolarni loyiha root'idagi /signatures papkasiga saqlaydi

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json({ limit: '5mb' })) // base64 PNG uchun

// ── /signatures papkasini yaratish (yo'q bo'lsa) ──────────────
const SIGNATURES_DIR = path.join(__dirname, 'docs', 'signatures')
if (!fs.existsSync(SIGNATURES_DIR)) {
  fs.mkdirSync(SIGNATURES_DIR, { recursive: true })
  console.log('📁 /signatures papkasi yaratildi')
}

// ── POST /api/save-signature ───────────────────────────────────
app.post('/api/save-signature', (req, res) => {
  const { signature, filename, timestamp } = req.body

  // Validatsiya
  if (!signature || !filename) {
    return res.status(400).json({ error: 'signature va filename kerak' })
  }

  if (!signature.startsWith('data:image/')) {
    return res.status(400).json({ error: "Noto'g'ri format — faqat rasm qabul qilinadi" })
  }

  // base64 → buffer
  const base64Data = signature.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  // Fayl hajmini tekshirish (100KB limit)
  const sizeKB = buffer.length / 1024
  if (sizeKB > 200) {
    return res.status(413).json({ error: `Fayl juda katta: ${sizeKB.toFixed(1)}KB (max 200KB)` })
  }

  // Faylni saqlash
  // Xavfsiz filename — faqat harflar, raqamlar, _ va - ga ruxsat
  const safeFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_')
  const filepath = path.join(SIGNATURES_DIR, safeFilename)

  fs.writeFile(filepath, buffer, (err) => {
    if (err) {
      console.error('❌ Yozish xatosi:', err)
      return res.status(500).json({ error: 'Faylni saqlashda xatolik' })
    }

    console.log(`✅ Imzo saqlandi: ${safeFilename} (${sizeKB.toFixed(1)}KB) — ${timestamp || new Date().toISOString()}`)

    res.json({
      success: true,
      filename: safeFilename,
      path: `/docs/signatures/${safeFilename}`,
      sizeKB: sizeKB.toFixed(1),
      savedAt: timestamp || new Date().toISOString(),
    })
  })
})

// ── GET /api/signatures — barcha saqlangan imzolar ro'yxati ───
app.get('/api/signatures', (req, res) => {
  fs.readdir(SIGNATURES_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Papkani o\'qishda xatolik' })

    const signatures = files
      .filter((f) => /\.(png|webp|jpg)$/i.test(f))
      .map((f) => {
        const stats = fs.statSync(path.join(SIGNATURES_DIR, f))
        return {
          filename: f,
          path: `/docs/signatures/${f}`,
          sizeKB: (stats.size / 1024).toFixed(1),
          createdAt: stats.birthtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ count: signatures.length, signatures })
  })
})

// ── GET /signatures/:filename — faylni ko'rish ────────────────
app.use('/docs/signatures', express.static(SIGNATURES_DIR))

// ── DELETE /api/signatures/:filename — o'chirish ──────────────
app.delete('/api/signatures/:filename', (req, res) => {
  const safeFilename = req.params.filename.replace(/[^a-zA-Z0-9_\-.]/g, '_')
  const filepath = path.join(SIGNATURES_DIR, safeFilename)

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Fayl topilmadi' })
  }

  fs.unlink(filepath, (err) => {
    if (err) return res.status(500).json({ error: "O'chirishda xatolik" })
    console.log(`🗑️  O'chirildi: ${safeFilename}`)
    res.json({ success: true, deleted: safeFilename })
  })
})

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const files = fs.readdirSync(SIGNATURES_DIR).filter((f) =>
    /\.(png|webp|jpg)$/i.test(f)
  )
  res.json({
    status: 'ok',
    signaturesDir: SIGNATURES_DIR,
    savedCount: files.length,
    port: PORT,
  })
})

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Signature server ishga tushdi`)
  console.log(`   URL:        http://localhost:${PORT}`)
  console.log(`   Papka:      ${SIGNATURES_DIR}`)
  console.log(`   Endpoints:`)
  console.log(`     POST   /api/save-signature   — imzo saqlash`)
  console.log(`     GET    /api/signatures        — ro'yxat`)
  console.log(`     GET    /signatures/:filename  — ko'rish`)
  console.log(`     DELETE /api/signatures/:file  — o'chirish`)
  console.log(`     GET    /api/health            — server holati\n`)
})
