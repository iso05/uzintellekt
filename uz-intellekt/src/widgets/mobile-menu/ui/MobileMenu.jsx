import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { navConfig } from '@/utils/navConfig'
import { Button, LanguageSwitcher } from '@/shared/ui'

const ComingSoonBadge = ({ children }) => (
  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
    {children}
  </span>
)

const MobileMenu = ({ open, onClose }) => {
  const { t } = useTranslation()
  const [openMain, setOpenMain] = useState(null)
  const [openSub, setOpenSub] = useState(null)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col bg-background data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('nav.menu', 'Menu')}
          </DialogPrimitive.Title>

          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-base font-semibold text-foreground">
              {t('nav.menu', 'Menu')}
            </span>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Yopish">
                <X className="h-5 w-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {navConfig.map((item, idx) => (
              <div key={idx}>
                {item.disabled ? (
                  <div className="flex items-center justify-between">
                    <span className="cursor-not-allowed text-sm font-semibold text-muted-foreground/60">
                      {t(item.key, item.label)}
                    </span>
                    <ComingSoonBadge>{t('nav.coming_soon', 'Tez kunda')}</ComingSoonBadge>
                  </div>
                ) : item.children ? (
                  <button
                    onClick={() => {
                      setOpenMain(openMain === idx ? null : idx)
                      setOpenSub(null)
                    }}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground"
                  >
                    {t(item.key, item.label)}
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        openMain === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className="block text-sm font-semibold text-foreground"
                  >
                    {t(item.key, item.label)}
                  </NavLink>
                )}

                {!item.disabled && item.children && openMain === idx && (
                  <div className="ml-3 mt-3 space-y-2 border-l border-border pl-3">
                    {item.children.map((child, cIdx) => (
                      <div key={cIdx}>
                        {child.disabled ? (
                          <div className="flex cursor-not-allowed items-center justify-between text-sm text-muted-foreground/60">
                            {t(child.key, child.label)}
                            <ComingSoonBadge>
                              {t('nav.coming_soon', 'Tez kunda')}
                            </ComingSoonBadge>
                          </div>
                        ) : child.children ? (
                          <button
                            onClick={() => setOpenSub(openSub === cIdx ? null : cIdx)}
                            className="flex w-full items-center justify-between text-sm font-medium text-foreground"
                          >
                            {t(child.key, child.label)}
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                openSub === cIdx ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        ) : child.file ? (
                          <a
                            href={child.file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onClose}
                            className="block text-sm text-muted-foreground"
                          >
                            {t(child.key, child.label)}
                          </a>
                        ) : (
                          <NavLink
                            to={child.path}
                            onClick={onClose}
                            className="block text-sm text-muted-foreground"
                          >
                            {t(child.key, child.label)}
                          </NavLink>
                        )}

                        {child.children && openSub === cIdx && (
                          <div className="ml-3 mt-2 space-y-2 border-l border-border pl-3">
                            {child.children.map((sub, sIdx) =>
                              sub.disabled ? (
                                <div
                                  key={sIdx}
                                  className="flex cursor-not-allowed items-center justify-between text-sm text-muted-foreground/60"
                                >
                                  {t(sub.key, sub.label)}
                                  <ComingSoonBadge>
                                    {t('nav.coming_soon', 'Tez kunda')}
                                  </ComingSoonBadge>
                                </div>
                              ) : sub.file ? (
                                <a
                                  key={sIdx}
                                  href={sub.file}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={onClose}
                                  className="block text-sm text-muted-foreground"
                                >
                                  {t(sub.key, sub.label)}
                                </a>
                              ) : (
                                <NavLink
                                  key={sIdx}
                                  to={sub.path}
                                  onClick={onClose}
                                  className="block text-sm text-muted-foreground"
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
              </div>
            ))}

            <NavLink to="/login" onClick={onClose} className="block">
              <Button className="w-full">
                {t('nav.login_join', "A'zo bo'lish/Kirish")}
              </Button>
            </NavLink>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default MobileMenu
