import { Outlet } from 'react-router-dom'
import useScrollToTop from '../../hooks/useScrollToTop'
import TopNavbar from './TopNavbar'
import Footer from './Footer'

const MainLayout = () => {
  // Scroll to top when route changes
  useScrollToTop()
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar always visible */}
      <TopNavbar />

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer always visible */}
      <Footer />
    </div>
  )
}

export default MainLayout
