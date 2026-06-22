import React from 'react'
import { RiAlertLine } from 'react-icons/ri'

export default function AdminWorksList() {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      background: '#FFFFFF',
      borderRadius: '6px',
      border: '1px solid #DDE2EC',
      borderTop: '3px solid #C0392B',
      boxShadow: '0 1px 6px rgba(192,57,43,0.07)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <RiAlertLine size={48} color="#C0392B" style={{ marginBottom: '16px' }} />
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
        Admin panel boshqaruvi
      </h2>
      <p style={{ color: '#4F5F74', fontSize: '14px', margin: '0 0 16px', fontWeight: 500 }}>
        Ma'muriy boshqaruv va asarlar nazorati alohida Admin Panel loyihasida (port 5174) amalga oshiriladi.
      </p>
      <a 
        href="http://localhost:5174" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#C0392B',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '5px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '13.5px',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = '#A93226'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = '#C0392B'}
      >
        Admin panelga o'tish (Port 5174)
      </a>
    </div>
  )
}
