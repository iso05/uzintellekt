import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useSEO({ title, description, keywords }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Title
    const defaultTitle = 'UzIntellekt — Intellektual mulk himoyasi'
    document.title = title ? `${title} | UzIntellekt` : defaultTitle

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      'content',
      description || "Intellektual mulkni himoyalash, ro'yxatdan o'tkazish va boshqarish uchun zamonaviy raqamli platforma."
    )

    // Meta Keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
    }

    // OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', title ? `${title} | UzIntellekt` : defaultTitle)

    // OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (!ogDesc) {
      ogDesc = document.createElement('meta')
      ogDesc.setAttribute('property', 'og:description')
      document.head.appendChild(ogDesc)
    }
    ogDesc.setAttribute(
      'content',
      description || "Intellektual mulkni himoyalash, ro'yxatdan o'tkazish va boshqarish uchun zamonaviy raqamli platforma."
    )
  }, [title, description, keywords, i18n.language])
}
