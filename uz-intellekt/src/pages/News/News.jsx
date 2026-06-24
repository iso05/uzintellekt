import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import newsData from '../../data/newsData'
import { NewsCard } from '@/entities/news'
import { Button, Input } from '@/shared/ui'

const categories = ['Barchasi', 'Tadbir', 'Yangilik', 'Seminar']

const News = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Barchasi')
  const [showAll, setShowAll] = useState(false)

  const filteredNews = newsData.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'Barchasi' || item.category === activeCategory
    return matchSearch && matchCategory
  })

  const visibleNews = showAll ? filteredNews : filteredNews.slice(0, 3)

  const labelFor = (cat) => {
    switch (cat) {
      case 'Barchasi':
        return t('news_block.cats.all', 'Barchasi')
      case 'Tadbir':
        return t('news_block.cats.event', 'Tadbir')
      case 'Yangilik':
        return t('news_block.cats.news', 'Yangilik')
      case 'Seminar':
        return t('news_block.cats.seminar', 'Seminar')
      default:
        return cat
    }
  }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t('news_block.title_main', 'Yangiliklar')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t(
              'news_block.desc_main',
              "Platformadagi barcha rasmiy yangiliklar va e'lonlar."
            )}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('news_block.search_placeholder', 'Yangilik qidirish...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowAll(false)
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? 'default' : 'outline'}
                onClick={() => {
                  setActiveCategory(cat)
                  setShowAll(false)
                }}
              >
                {labelFor(cat)}
              </Button>
            ))}
          </div>
        </div>

        {visibleNews.length === 0 ? (
          <p className="mt-20 text-center text-sm text-muted-foreground">
            {t('news_block.no_news', 'Hech qanday yangilik topilmadi')}
          </p>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleNews.map((item) => {
                const localizedItem = {
                  ...item,
                  title: t(`news_block.item_${item.id}.title`, item.title),
                  desc: t(`news_block.item_${item.id}.desc`, item.desc),
                  date: item.date,
                  category: labelFor(item.category),
                }
                return <NewsCard key={item.id} item={localizedItem} />
              })}
            </div>

            {!showAll && filteredNews.length > 3 && (
              <div className="mt-12 text-center">
                <Button size="lg" onClick={() => setShowAll(true)}>
                  {t('news_block.all_news', "Barchasini ko'rish")}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default News
