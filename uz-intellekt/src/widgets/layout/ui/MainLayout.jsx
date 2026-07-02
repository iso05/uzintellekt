import { Outlet } from 'react-router-dom'
import useScrollToTop from '@/hooks/useScrollToTop'
import { Header } from '@/widgets/header'
import { Footer } from '@/widgets/footer'

const MainLayout = () => {
  useScrollToTop()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
