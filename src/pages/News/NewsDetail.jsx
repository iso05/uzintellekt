import { useParams, NavLink } from "react-router-dom";
import newsData from "../../data/newsData";

const NewsDetail = () => {
  const { id } = useParams();

  const newsItem = newsData.find(
    (item) => item.id === Number(id)
  );

  if (!newsItem) {
    return (
      <section className="pt-32 pb-32 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">
          Yangilik topilmadi
        </h2>
        <NavLink
          to="/news"
          className="inline-block mt-6 text-purple-600 font-medium"
        >
          ← Yangiliklarga qaytish
        </NavLink>
      </section>
    );
  }

  return (
    <section className="pt-28 pb-32 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">

        {/* BACK */}
        <NavLink
          to="/news"
          className="inline-block mb-8 text-purple-600 font-medium"
        >
          ← Yangiliklarga qaytish
        </NavLink>

        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {newsItem.title}
        </h1>

        {/* META */}
        <p className="text-sm text-gray-500 mb-8">
          {newsItem.date} · {newsItem.category}
        </p>

        {/* IMAGE */}
        <div className="rounded-2xl overflow-hidden mb-10">
          <img
            src={newsItem.img}
            alt={newsItem.title}
            className="w-full h-[420px] object-cover"
          />
        </div>

        {/* CONTENT */}
        <div className="text-gray-700 leading-relaxed space-y-5 text-lg">
          {newsItem.content
            ? newsItem.content
            : newsItem.desc}
        </div>

      </div>
    </section>
  );
};

export default NewsDetail;
