import { useRef, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { NewsCard } from '@/entities/news'
import { Eyebrow } from '@/shared/ui'

const news = [
  { id: 1, title: "Raqamli huquqlar yig'ilishi", date: '2026-06-04', desc: 'Mualliflik huquqlari muhokamasi.', img: null },
  { id: 2, title: 'Raqamli guvohnoma joriy etildi', date: '2026-06-01', desc: 'Yangi tizim ishga tushdi.', img: null },
  { id: 3, title: 'Hamkorlik uchrashuvi', date: '2026-05-28', desc: 'Xalqaro hamkorlik.', img: null },
  { id: 4, title: 'Yangi platforma', date: '2026-05-20', desc: 'Platforma yangilandi.', img: null },
  { id: 5, title: 'Konferensiya', date: '2026-05-12', desc: 'Soha vakillari uchrashuvi.', img: null },
  { id: 6, title: 'Huquqiy seminar', date: '2026-05-01', desc: "Seminar bo'lib o'tdi.", img: null },
]

const NewsPreview = () => {
  const { t } = useTranslation()
  const scrollRef = useRef(null)
  const [activeDot, setActiveDot] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(3)

  useEffect(() => {
    const update = () => setCardsPerView(window.innerWidth < 768 ? 1 : 3)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const dotsCount = Math.ceil(news.length / cardsPerView)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const pageWidth = el.offsetWidth
    setActiveDot(Math.round(el.scrollLeft / pageWidth))
  }

  const scrollTo = (idx) => {
    scrollRef.current?.scrollTo({
      left: idx * scrollRef.current.offsetWidth,
      behavior: 'smooth',
    })
  }

  return (
    <section id="news" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow align="center">{t('news_block.eyebrow', 'Yangiliklar')}</Eyebrow>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t('news_block.title', "So'nggi yangiliklar")}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t('news_block.subtitle', "Soha yangiliklari va e'lonlar")}
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth"
        >
          {news.map((item) => {
            const localized = {
              ...item,
              title: t(`news_block.item_${item.id}.title`, item.title),
              desc: t(`news_block.item_${item.id}.desc`, item.desc),
              date: item.date,
            }
            return (
              <div key={item.id} className="min-w-full snap-start md:min-w-[calc(33.333%-13.333px)]">
                <NewsCard item={localized} />
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: dotsCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              aria-label={`Sahifa ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                activeDot === idx ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <NavLink
            to="/news"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary"
          >
            {t('news_block.see_all', "Barcha yangiliklar")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </NavLink>
        </div>
      </div>
    </section>
  )
}

export default NewsPreview
