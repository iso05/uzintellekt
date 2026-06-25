import { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileText } from 'lucide-react'
import newsData from '../../data/newsData'
import { formatDate } from '@/shared/lib/utils'

const NewsDetail = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [imgFailed, setImgFailed] = useState(false)

  const newsItem = newsData.find((item) => item.id === Number(id))

  if (!newsItem) {
    return (
      <section className="bg-background py-24 text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('news_block.no_news', 'Yangilik topilmadi')}
        </h2>
        <NavLink
          to="/news"
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('news_block.back_to_news', 'Yangiliklarga qaytish')}
        </NavLink>
      </section>
    )
  }

  const title = t(`news_block.item_${newsItem.id}.title`, newsItem.title)
  const date = formatDate(newsItem.date, i18n.language)
  const content = t(
    `news_block.item_${newsItem.id}.content`,
    newsItem.content || newsItem.desc
  )
  const category =
    newsItem.category === 'Tadbir'
      ? t('news_block.cats.event', 'Tadbir')
      : newsItem.category === 'Yangilik'
        ? t('news_block.cats.news', 'Yangilik')
        : newsItem.category === 'Seminar'
          ? t('news_block.cats.seminar', 'Seminar')
          : newsItem.category

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <NavLink
          to="/news"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('news_block.back_to_news', 'Yangiliklarga qaytish')}
        </NavLink>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {date} · <span className="font-medium text-primary">{category}</span>
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border border-border">
          {newsItem.img && !imgFailed ? (
            <img
              src={newsItem.img}
              alt={title}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="h-[360px] w-full object-cover sm:h-[420px]"
            />
          ) : (
            <div className="flex h-[360px] w-full items-center justify-center bg-primary-soft/40 text-primary/50 sm:h-[420px]">
              <FileText className="h-14 w-14" />
            </div>
          )}
        </div>

        <div className="prose prose-slate mt-8 max-w-none text-base leading-relaxed text-foreground/90">
          {content}
        </div>
      </div>
    </section>
  )
}

export default NewsDetail
