// src/router/AppRouter.jsx
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'

import Home        from '../pages/Home/Home'
import Contact     from '../pages/Contact/Contact'
import Login       from '../pages/Auth/Login'
import Register    from '../pages/Auth/Register'
import Dashboard   from '../pages/Dashboard/Dashboard'
import News        from '../pages/News/News'
import NewsDetail  from '../pages/News/NewsDetail'
import Leadership  from '../pages/About/Leadership'
import Structure   from '../pages/About/Structure'
import Board       from '../pages/About/Board'
import About       from '../pages/About/About'
import Partners    from '../pages/About/Partners'
import Depositing  from '../pages/services/Depositing'
import Services    from '../pages/services/Services'

export default function AppRouter() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── PUBLIC — MAIN LAYOUT ─────────────────────────── */}
        <Route element={<MainLayout />}>
          <Route path="/"                    element={<Home />} />
          <Route path="/contact"             element={<Contact />} />
          <Route path="/news"                element={<News />} />
          <Route path="/news/:id"            element={<NewsDetail />} />
          <Route path="/about"               element={<About />} />
          <Route path="/about/leadership"    element={<Leadership />} />
          <Route path="/about/structure"     element={<Structure />} />
          <Route path="/about/board"         element={<Board />} />
          <Route path="/about/partners"      element={<Partners />} />
          <Route path="/services"            element={<Services />} />
          <Route path="/services/depositing" element={<Depositing />} />
        </Route>

        {/* ── AUTH — NO LAYOUT ─────────────────────────────── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── PROTECTED ────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

      </Routes>
    </AuthProvider>
  )
}
