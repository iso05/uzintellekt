import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { navConfig } from '../../utils/navConfig'
import LanguageSwitcher from '../ui/LanguageSwitcher'

const MobileMenu = ({ open, onClose }) => {
  const [openMain, setOpenMain] = useState(null)
  const [openSub, setOpenSub] = useState(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleScroll = () => onClose()
      window.addEventListener('scroll', handleScroll)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* HEADER */}
      <div className="h-16 px-6 flex items-center justify-between border-b">
        <span className="font-semibold text-lg">Menu</span>
        <button onClick={onClose} className="text-2xl">✕</button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {navConfig.map((item, idx) => (
          <div key={idx}>

            {/* ── DISABLED item ── */}
            {item.disabled ? (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-300 select-none cursor-not-allowed">
                  {item.label}
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                  Tez kunda
                </span>
              </div>

            ) : item.children ? (
              /* ── Dropdown trigger ── */
              <button
                onClick={() => {
                  setOpenMain(openMain === idx ? null : idx)
                  setOpenSub(null)
                }}
                className="w-full flex justify-between items-center text-left font-semibold text-gray-900"
              >
                {item.label}
                <span className="text-xl">{openMain === idx ? '−' : '+'}</span>
              </button>

            ) : (
              /* ── Oddiy link ── */
              <NavLink
                to={item.path}
                onClick={onClose}
                className="block font-semibold text-gray-900"
              >
                {item.label}
              </NavLink>
            )}

            {/* SECOND LEVEL */}
            {!item.disabled && item.children && openMain === idx && (
              <div className="mt-3 ml-4 space-y-3">
                {item.children.map((child, cIdx) => (
                  <div key={cIdx}>
                    {child.children ? (
                      <button
                        onClick={() => setOpenSub(openSub === cIdx ? null : cIdx)}
                        className="w-full flex justify-between items-center text-gray-700 font-medium"
                      >
                        {child.label}
                        <span>{openSub === cIdx ? '−' : '+'}</span>
                      </button>
                    ) : child.file ? (
                      <a
                        href={child.file}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="block text-gray-700"
                      >
                        {child.label}
                      </a>
                    ) : (
                      <NavLink
                        to={child.path}
                        onClick={onClose}
                        className="block text-gray-700"
                      >
                        {child.label}
                      </NavLink>
                    )}

                    {/* THIRD LEVEL */}
                    {child.children && openSub === cIdx && (
                      <div className="mt-2 ml-4 space-y-2">
                        {child.children.map((sub, sIdx) =>
                          sub.file ? (
                            <a
                              key={sIdx}
                              href={sub.file}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={onClose}
                              className="block text-gray-600"
                            >
                              {sub.label}
                            </a>
                          ) : (
                            <NavLink
                              key={sIdx}
                              to={sub.path}
                              onClick={onClose}
                              className="block text-gray-600"
                            >
                              {sub.label}
                            </NavLink>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* LANGUAGE */}
        <div className="pt-6 border-t">
          <LanguageSwitcher variant="mobile" />
        </div>

        {/* REGISTER */}
        <NavLink
          to="/register"
          onClick={onClose}
          className="mt-4 block text-center px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
        >
          Ro'yxatdan o'tish
        </NavLink>

        {/* LOGIN */}
        <NavLink
          to="/login"
          onClick={onClose}
          className="block text-center px-6 py-3 rounded-xl border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition"
        >
          Kirish
        </NavLink>
      </div>
    </div>
  )
}

export default MobileMenu
