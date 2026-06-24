// src/app/router.jsx
import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import WorksList from '../pages/Works/WorksList'
import WorkForm from '../pages/Works/WorkForm'
import ContractsList from '../pages/Contracts/ContractsList'
import NotFound from '../pages/NotFound'

export const router = createBrowserRouter([
  {
    // Root — provides AuthProvider via App
    element: <App />,
    children: [
      {
        // Protected zone — requires token + isMember=true
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/',                 element: <Dashboard /> },
          { path: '/profile',          element: <Profile /> },
          { path: '/works',            element: <WorksList /> },
          { path: '/works/new',        element: <WorkForm /> },
          { path: '/works/:id/edit',   element: <WorkForm /> },
          { path: '/contracts',         element: <ContractsList /> },
          { path: '*',                 element: <NotFound /> },
        ],
      },
    ],
  },
])