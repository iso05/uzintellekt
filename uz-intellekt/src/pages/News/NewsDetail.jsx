import { useParams, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsData from "../../data/newsData";

const NewsDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const newsItem = newsData.find(
    (item) => item.id === Number(id)
  );

  if (!newsItem) {
    return (
      <section className="pt-32 pb-32 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">
          {t('news_block.no_news', 'Yangilik topilmadi')}
        </h2>
        <NavLink
          to="/news"
          className="inline-block mt-6 text-purple-600 font-medium"
        >
          {t('news_block.back_to_news', '← Yangiliklarga qaytish')}
        </NavLink>
      </section>
    );
  }

  const title = t(`news_block.item_${newsItem.id}.title`, newsItem.title);
  const date = t(`news_block.item_${newsItem.id}.date`, newsItem.date);
  const content = t(`news_block.item_${newsItem.id}.content`, newsItem.content || newsItem.desc);
  const category = newsItem.category === "Tadbir"
    ? t('news_block.cats.event', 'Tadbir')
    : newsItem.category === "Yangilik"
    ? t('news_block.cats.news', 'Yangilik')
    : newsItem.category === "Seminar"
    ? t('news_block.cats.seminar', 'Seminar')
    : newsItem.category;

  return (
    <section className="pt-28 pb-32 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">

        {/* BACK */}
        <NavLink
          to="/news"
          className="inline-block mb-8 text-purple-600 font-medium"
        >
          {t('news_block.back_to_news', '← Yangiliklarga qaytish')}
        </NavLink>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title}
        </h1>

        {/* META */}
        <p className="text-sm text-gray-500 mb-8">
          {date} · {category}
        </p>

        {/* IMAGE */}
        <div className="rounded-2xl overflow-hidden mb-10">
          <img
            src={newsItem.img}
            alt={title}
            className="w-full h-[420px] object-cover"
          />
        </div>

        {/* CONTENT */}
        <div className="text-gray-700 leading-relaxed space-y-5 text-lg">
          {content}
        </div>

      </div>
    </section>
  );
};

export default NewsDetail;
