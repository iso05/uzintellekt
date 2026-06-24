import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { navConfig } from '@/utils/navConfig'

const linkBase =
  'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'

const DesktopMenu = () => {
  const { t } = useTranslation()
  const [openMenu, setOpenMenu] = useState(null)
  const [openSub, setOpenSub] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenMenu(null)
        setOpenSub(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <ul ref={ref} className="flex items-center gap-1">
      {navConfig.map((item, idx) => (
        <li key={idx} className="relative">
          {item.disabled ? (
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
            >
              {t(item.key, item.label)}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t('nav.coming_soon', 'Tez kunda')}
              </span>
            </button>
          ) : item.path && !item.children ? (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-primary-soft text-primary-soft-foreground' : ''}`
              }
              onClick={() => {
                setOpenMenu(null)
                setOpenSub(null)
              }}
            >
              {t(item.key, item.label)}
            </NavLink>
          ) : (
            <button
              onClick={() => {
                setOpenMenu(openMenu === idx ? null : idx)
                setOpenSub(null)
              }}
              className={linkBase}
            >
              {t(item.key, item.label)}
              {item.children && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${openMenu === idx ? 'rotate-180' : ''}`}
                />
              )}
            </button>
          )}

          {!item.disabled && item.children && openMenu === idx && (
            <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border bg-popover py-1.5 text-popover-foreground shadow-soft-md">
              {item.children.map((child, cIdx) => (
                <div key={cIdx} className="relative">
                  {child.disabled ? (
                    <div className="flex cursor-not-allowed items-center justify-between px-3 py-2 text-sm text-muted-foreground/60">
                      {t(child.key, child.label)}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                        {t('nav.coming_soon', 'Tez kunda')}
                      </span>
                    </div>
                  ) : child.children ? (
                    <button
                      onClick={() => setOpenSub(openSub === cIdx ? null : cIdx)}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      {t(child.key, child.label)}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : child.file ? (
                    <a
                      href={child.file}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => {
                        setOpenMenu(null)
                        setOpenSub(null)
                      }}
                    >
                      {t(child.key, child.label)}
                    </a>
                  ) : (
                    <NavLink
                      to={child.path}
                      className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setOpenMenu(null)}
                    >
                      {t(child.key, child.label)}
                    </NavLink>
                  )}

                  {child.children && openSub === cIdx && (
                    <div className="absolute left-full top-0 z-50 ml-1 w-64 overflow-hidden rounded-lg border border-border bg-popover py-1.5 shadow-soft-md">
                      {child.children.map((sub, sIdx) =>
                        sub.disabled ? (
                          <div
                            key={sIdx}
                            className="flex cursor-not-allowed items-center justify-between px-3 py-2 text-sm text-muted-foreground/60"
                          >
                            {t(sub.key, sub.label)}
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                              {t('nav.coming_soon', 'Tez kunda')}
                            </span>
                          </div>
                        ) : sub.file ? (
                          <a
                            key={sIdx}
                            href={sub.file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => {
                              setOpenMenu(null)
                              setOpenSub(null)
                            }}
                          >
                            {t(sub.key, sub.label)}
                          </a>
                        ) : (
                          <NavLink
                            key={sIdx}
                            to={sub.path}
                            className="block px-3 py-2 text-sm text-foreground hover:bg-muted"
                            onClick={() => {
                              setOpenMenu(null)
                              setOpenSub(null)
                            }}
                          >
                            {t(sub.key, sub.label)}
                          </NavLink>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export default DesktopMenu
