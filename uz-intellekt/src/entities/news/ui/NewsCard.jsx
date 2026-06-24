import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FileText } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui'
import { formatDate } from '@/shared/lib/utils'

const NewsCard = ({ item }) => {
  const { t, i18n } = useTranslation()
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = item.img && !imgFailed

  return (
    <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-soft-md">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {showImg ? (
          <img
            src={item.img}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-soft/40 text-primary/50">
            <FileText className="h-10 w-10" />
          </div>
        )}
      </div>
      <CardContent className="p-5">
        {item.category && (
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {item.category}
          </span>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date, i18n.language)}</p>

        <NavLink
          to={`/news/${item.id}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {t('news_block.more', 'Batafsil')}
          <ArrowRight className="h-3.5 w-3.5" />
        </NavLink>
      </CardContent>
    </Card>
  )
}

export default NewsCard
