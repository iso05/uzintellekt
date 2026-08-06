import { Outlet } from 'react-router-dom'
import { AliveScope } from 'react-activation'
import { AuthProvider } from '@/features/auth'

export default function App() {
  return (
    <AliveScope>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </AliveScope>
  )
}
