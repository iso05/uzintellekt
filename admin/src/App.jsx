import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/features/auth'

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
