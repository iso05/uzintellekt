import { useRef, useState, useEffect } from 'react'
import NewsCard from '../../components/common/NewsCard'

const news = [
  {
    id: 1,
    title: 'Raqamli huquqlar yig‘ilishi',
    date: 'Iyun 04, 2026',
    desc: 'Mualliflik huquqlari muhokamasi.',
    img: '/images/news1.jpg',
  },
  {
    id: 2,
    title: 'Raqamli guvohnoma joriy etildi',
    date: 'Iyun 01, 2026',
    desc: 'Yangi tizim ishga tushdi.',
    img: '/images/news2.jpg',
  },
  {
    id: 3,
    title: 'Hamkorlik uchrashuvi',
    date: 'May 28, 2026',
    desc: 'Xalqaro hamkorlik.',
    img: '/images/news3.jpg',
  },
  {
    id: 4,
    title: 'Yangi platforma',
    date: 'May 20, 2026',
    desc: 'Platforma yangilandi.',
    img: '/images/news4.jpg',
  },
  {
    id: 5,
    title: 'Konferensiya',
    date: 'May 12, 2026',
    desc: 'Soha vakillari uchrashuvi.',
    img: '/images/news5.jpg',
  },
  {
    id: 6,
    title: 'Huquqiy seminar',
    date: 'May 01, 2026',
    desc: 'Seminar bo‘lib o‘tdi.',
    img: '/images/news6.jpg',
  },
]

const NewsPreview = () => {
  const scrollRef = useRef(null)
  const [activeDot, setActiveDot] = useState(0)
  const [cardsPerView, setCardsPerView] = useState(3)

  /* RESPONSIVE */
  useEffect(() => {
    const update = () => {
      setCardsPerView(window.innerWidth < 768 ? 1 : 3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const dotsCount = Math.ceil(news.length / cardsPerView)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    const pageWidth = el.offsetWidth
    const index = Math.round(el.scrollLeft / pageWidth)
    setActiveDot(index)
  }

  const scrollTo = (idx) => {
    scrollRef.current.scrollTo({
      left: idx * scrollRef.current.offsetWidth,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="news"
      className="relative news-bg py-16 sm:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-title mb-8 sm:mb-14 pb-3">
          So'nggi yangiliklar
        </h2>

        {/* SLIDER */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            flex gap-6 sm:gap-10
            overflow-x-auto
            scroll-smooth
            snap-x snap-mandatory
            no-scrollbar
          "
        >
          {news.map((item) => (
            <div key={item.id} className="min-w-full md:min-w-[33%] snap-start">
              <NewsCard item={item} variant="preview" />
            </div>
          ))}
        </div>

        {/* DOTS */}
        <div className="flex justify-center gap-3 mt-12">
          {Array.from({ length: dotsCount }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`
                w-3 h-3 rounded-full transition
                ${
                  activeDot === idx
                    ? 'bg-purple-600 scale-125'
                    : 'bg-purple-300 hover:bg-purple-400'
                }
              `}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsPreview
