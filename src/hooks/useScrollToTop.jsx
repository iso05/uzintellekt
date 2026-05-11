import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Custom hook to scroll to top when route changes
 * This ensures that when user navigates to a new page,
 * the page starts from the top, not from middle/bottom
 */
const useScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [pathname])
}

export default useScrollToTop
