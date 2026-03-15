import { useTranslation } from 'react-i18next'

// variant="mobile" — qora matn, oq fon uchun
// variant="desktop" — oq matn, shaffof fon uchun (default)
const LanguageSwitcher = ({ variant = 'desktop' }) => {
  const { i18n } = useTranslation()

  if (variant === 'mobile') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400 select-none cursor-not-allowed">
          Til / Language
        </span>
        <span className="text-[11px] bg-purple-100 text-purple-400 px-2 py-0.5 rounded-full font-medium">
          Tez kunda
        </span>
      </div>
    )
  }

  // Desktop — disabled
  return (
    <div className="relative">
      <div className="appearance-none bg-white/5 text-white/30 border border-white/15 rounded-lg px-4 py-1.5 pr-8 text-sm cursor-not-allowed select-none flex items-center gap-2">
        {i18n.language?.toUpperCase() || 'UZ'}
      </div>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/20 text-xs">
        ▼
      </span>
    </div>
  )
}

export default LanguageSwitcher
