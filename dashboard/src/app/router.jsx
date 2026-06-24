import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import { DashboardLayout } from '@/widgets/dashboard-layout'
import { ProtectedRoute } from '@/features/auth'
import { DashboardPage } from '@/pages/dashboard'
import { ProfilePage } from '@/pages/profile'
import { WorksPage } from '@/pages/works'
import { WorkFormPage } from '@/pages/work-form'
import { ContractsPage } from '@/pages/contracts'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/works', element: <WorksPage /> },
          { path: '/works/new', element: <WorkFormPage /> },
          { path: '/works/:id/edit', element: <WorkFormPage /> },
          { path: '/contracts', element: <ContractsPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
