// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getWorks } from '../services/worksApi'
import {
  RiFileTextLine, RiCheckLine, RiTimeLine, RiCloseLine,
  RiAddLine, RiCalendarLine
} from 'react-icons/ri'

const STATE_CONFIG = {
  DRAFT:      { label: "Qoralama",             bg: '#EEF1F6', color: '#5A6478', border: '#C5CDD8' },
  PENDING:    { label: "Ko'rib chiqilmoqda",   bg: '#FEF5E7', color: '#C8922A', border: '#F0C060' },
  REGISTERED: { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#1E7D4A', border: '#7DCB9E' },
  APPROVED:   { label: "Tasdiqlangan",         bg: '#E8F5EE', color: '#1E7D4A', border: '#7DCB9E' },
  REJECTED:   { label: "Rad etilgan",          bg: '#FDEEEE', color: '#C0392B', border: '#F5AAAA' },
  CANCELLED:  { label: "Bekor qilingan",       bg: '#F0F0F0', color: '#9AA5B8', border: '#D0D7E2' },
}

function StatusBadge({ status }) {
  const cfg = STATE_CONFIG[status] || { label: status || 'Noma’lum', bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 3, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`
  } catch (e) {
    return dateStr
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ total: 0, registered: 0, pending: 0, rejected: 0 })
  const [recentWorks, setRecentWorks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      // Count 1: total
      getWorks({ page: 1, size: 1 }).catch(() => ({ totalItems: 0 })),
      // Count 2: registered
      getWorks({ page: 1, size: 1, filters: [{ field: 'state', operator: 'eq', value: 'REGISTERED' }] }).catch(() => ({ totalItems: 0 })),
      // Count 3: pending
      getWorks({ page: 1, size: 1, filters: [{ field: 'state', operator: 'eq', value: 'PENDING' }] }).catch(() => ({ totalItems: 0 })),
      // Count 4: rejected
      getWorks({ page: 1, size: 1, filters: [{ field: 'state', operator: 'eq', value: 'REJECTED' }] }).catch(() => ({ totalItems: 0 })),
      // Recent works (last 5)
      getWorks({ page: 1, size: 5, sort: { selector: 'createdAt', desc: true } }).catch(() => ({ items: [] }))
    ]).then(([totalRes, regRes, pendRes, rejRes, recentRes]) => {
      setStats({
        total: totalRes?.totalItems ?? totalRes?.data?.totalItems ?? 0,
        registered: regRes?.totalItems ?? regRes?.data?.totalItems ?? 0,
        pending: pendRes?.totalItems ?? pendRes?.data?.totalItems ?? 0,
        rejected: rejRes?.totalItems ?? rejRes?.data?.totalItems ?? 0,
      })
      setRecentWorks(recentRes?.items ?? recentRes?.data?.items ?? [])
    }).catch(err => {
      console.error("Dashboard overview load error:", err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const getTodayDateStr = () => {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  }

  const firstName = user?.userType === 'LEGAL'
    ? (user?.legalName || 'Yuridik Tashkilot')
    : (user?.firstName || 'Foydalanuvchi')
  const roleBadge = user?.userType === 'LEGAL' ? 'YURIDIK SHAXS' : 'JISMONIY SHAXS'

  return (
    <div style={S.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .dashboard-row-hover:hover { background-color: #F0F5FB !important; }
        .action-card-hover { transition: all 0.2s ease; cursor: pointer; }
        .action-card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(44,79,138,0.15); }
      `}</style>

      {/* Welcome Block */}
      <div style={S.welcomeCard}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={S.welcomeHeading}>Xush kelibsiz, {firstName}! 👋</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={S.roleBadge}>{roleBadge}</span>
            <span style={S.dateBadge}>
              <RiCalendarLine size={13} style={{ marginRight: 4 }} />
              Bugungi sana: {getTodayDateStr()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div style={S.spinner} />
        </div>
      ) : (
        <div style={S.statsGrid}>
          {/* Card 1: Jami */}
          <div style={S.statCard}>
            <div style={{ ...S.statIcon, background: '#EEF4FB', color: '#2C4F8A' }}>
              <RiFileTextLine size={22} />
            </div>
            <div style={S.statInfo}>
              <span style={S.statValue}>{stats.total}</span>
              <span style={S.statLabel}>Jami asarlar</span>
            </div>
          </div>

          {/* Card 2: Tasdiqlangan */}
          <div style={S.statCard}>
            <div style={{ ...S.statIcon, background: '#E8F5EE', color: '#1E7D4A' }}>
              <RiCheckLine size={22} />
            </div>
            <div style={S.statInfo}>
              <span style={{ ...S.statValue, color: '#1E7D4A' }}>{stats.registered}</span>
              <span style={S.statLabel}>Tasdiqlangan</span>
            </div>
          </div>

          {/* Card 3: Ko'rib chiqilmoqda */}
          <div style={S.statCard}>
            <div style={{ ...S.statIcon, background: '#FEF5E7', color: '#C8922A' }}>
              <RiTimeLine size={22} />
            </div>
            <div style={S.statInfo}>
              <span style={{ ...S.statValue, color: '#C8922A' }}>{stats.pending}</span>
              <span style={S.statLabel}>Ko'rib chiqilmoqda</span>
            </div>
          </div>

          {/* Card 4: Rad etilgan */}
          <div style={S.statCard}>
            <div style={{ ...S.statIcon, background: '#FDEEEE', color: '#C0392B' }}>
              <RiCloseLine size={22} />
            </div>
            <div style={S.statInfo}>
              <span style={{ ...S.statValue, color: '#C0392B' }}>{stats.rejected}</span>
              <span style={S.statLabel}>Rad etilgan</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div 
          onClick={() => navigate('/works/new')} 
          className="action-card-hover" 
          style={{ ...S.actionCard, borderTop: '3px solid #2E7D51', flex: '1 1 100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RiAddLine size={20} color="#2E7D51" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1E2A3B' }}>Yangi asar qo'shish</span>
          </div>
          <span style={{ fontSize: 12.5, color: '#4F5F74', marginTop: 4 }}>Yangi intellektual mulk asarini ro'yxatdan o'tkazish uchun ariza yuborish.</span>
        </div>
      </div>

      {/* Recent Works */}
      <div style={S.card}>
        <h2 style={S.cardTitle}>
          <RiFileTextLine size={18} color="#2C4F8A" />
          So'nggi arizalar
        </h2>

        {loading ? (
          <div style={S.center}><div style={S.spinner} /></div>
        ) : recentWorks.length === 0 ? (
          <div style={S.center}>
            <RiFileTextLine size={40} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, margin: '8px 0' }}>Hozircha arizalar yuborilmagan</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr style={{ background: '#F8FAF5', borderBottom: '1px solid #DDE2EC' }}>
                  <th style={S.th}>Asar nomi</th>
                  <th style={S.th}>Holati</th>
                  <th style={S.th}>Yaratilgan sana</th>
                </tr>
              </thead>
              <tbody>
                {recentWorks.map((w, idx) => {
                  const status = w.state || w.status || 'DRAFT'
                  return (
                    <tr 
                      key={w.id} 
                      className="dashboard-row-hover" 
                      style={{ background: idx % 2 === 1 ? '#FAFBFD' : '#FFFFFF', borderBottom: '1px solid #E8EDF5', cursor: 'pointer' }}
                      onClick={() => navigate('/works')}
                    >
                      <td style={{ ...S.td, fontWeight: 600, color: '#2C4F8A', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.name}>
                        {w.name || '—'}
                      </td>
                      <td style={S.td}>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ ...S.td, color: '#4F5F74', fontSize: 13 }}>
                        {formatDateTime(w.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.cardFooter}>
          <button 
            style={S.viewAllBtn} 
            onClick={() => navigate('/works')}
          >
            Barcha asarlarni ko'rish →
          </button>
        </div>
      </div>
    </div>
  )
}

const S = {
  container: { display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Inter', sans-serif" },
  welcomeCard: {
    background: '#FFFFFF',
    border: '1px solid #DDE2EC',
    borderTop: '3px solid #2C4F8A',
    borderRadius: '6px',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
    padding: '20px 24px',
  },
  welcomeHeading: { fontSize: '20px', fontWeight: 700, color: '#2C4F8A', margin: 0 },
  roleBadge: {
    backgroundColor: '#EEF2FB',
    color: '#2C4F8A',
    border: '1px solid #B0C0DE',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '3px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase'
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#4F5F74',
    fontSize: '12.5px',
    fontWeight: 500,
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: '#FFFFFF',
    border: '1px solid #DDE2EC',
    borderRadius: '6px',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
  },
  statIcon: { width: 44, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statInfo: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '22px', fontWeight: 700, color: '#1E2A3B', lineHeight: 1.2 },
  statLabel: { fontSize: '12px', color: '#4F5F74', fontWeight: 500, marginTop: 4 },
  actionCard: {
    flex: 1,
    minWidth: 260,
    background: '#FFFFFF',
    border: '1px solid #DDE2EC',
    borderRadius: '6px',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #DDE2EC',
    borderTop: '3px solid #2C4F8A',
    borderRadius: '6px',
    boxShadow: '0 1px 6px rgba(44,79,138,0.07)',
    overflow: 'hidden',
    padding: '20px 24px 16px',
  },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '15px', fontWeight: 700, color: '#2C4F8A', margin: '0 0 16px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' },
  spinner: { width: 32, height: 32, borderRadius: '50%', border: '3px solid #DDE2EC', borderTopColor: '#2C4F8A', animation: 'spin 0.8s linear infinite' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: '11.5px', fontWeight: 700, color: '#4F5F74', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #DDE2EC' },
  td: { padding: '11px 16px', fontSize: '13.5px', color: '#1E2A3B', borderBottom: '1px solid #E8EDF5', verticalAlign: 'middle' },
  cardFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: 14 },
  viewAllBtn: { fontSize: '13px', fontWeight: 600, color: '#2C4F8A', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }
}
