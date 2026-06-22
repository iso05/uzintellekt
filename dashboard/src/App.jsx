// src/App.jsx
import { Outlet } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}