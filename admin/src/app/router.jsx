import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import { AdminLayout } from '@/widgets/admin-layout'
import { ProtectedRoute } from '@/features/auth'
import { DashboardPage } from '@/pages/dashboard'
import { ModerationPage } from '@/pages/moderation'
import { WorkDetailPage } from '@/pages/work-detail'
import { UsersPage } from '@/pages/users'
import { UserDetailPage } from '@/pages/user-detail'
import { FilesPage } from '@/pages/files'
import { ContractsPage } from '@/pages/contracts'
import { LoginPage } from '@/pages/login'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/moderation', element: <ModerationPage /> },
          { path: '/moderation/:id', element: <WorkDetailPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/users/:id', element: <UserDetailPage /> },
          { path: '/files', element: <FilesPage /> },
          { path: '/contracts', element: <ContractsPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
