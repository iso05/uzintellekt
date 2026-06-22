import React from 'react';

export default function FieldError({ error }) {
  if (!error) return null;
  return (
    <div style={{
      color: '#C0392B',
      fontSize: '12px',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      textAlign: 'left'
    }}>
      <span>⚠</span>
      <span>{error}</span>
    </div>
  );
}
