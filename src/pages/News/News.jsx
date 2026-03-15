import { useState } from "react";
import newsData from "../../data/newsData";
import NewsCard from "../../components/common/NewsCard";

const categories = ["Barchasi", "Tadbir", "Yangilik", "Seminar"];

const News = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [showAll, setShowAll] = useState(false);

  const filteredNews = newsData.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      activeCategory === "Barchasi" ||
      item.category === activeCategory;

    return matchSearch && matchCategory;
  });

  // 👇 DEFAULT 3 TA, AKS HOLDA HAMMASI
  const visibleNews = showAll
    ? filteredNews
    : filteredNews.slice(0, 3);

  return (
    <section className="pt-28 pb-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4 pb-2">
            Yangiliklar
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Platformadagi barcha rasmiy yangiliklar va e’lonlar.
          </p>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col md:flex-row gap-4 mb-14">

          {/* SEARCH */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Yangilik qidirish..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowAll(false); // 🔥 search qilinsa yana 3 taga qaytadi
              }}
              className="
                w-full px-5 py-4 rounded-2xl
                border border-gray-300
                focus:ring-2 focus:ring-purple-400
                focus:outline-none
              "
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* FILTER */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowAll(false); // 🔥 filter bosilsa ham 3 taga qaytadi
                }}
                className={`
                  px-5 py-3 rounded-xl text-sm font-medium transition
                  ${
                    activeCategory === cat
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-purple-50"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        {visibleNews.length === 0 ? (
          <p className="text-center text-gray-500 mt-20">
            Hech qanday yangilik topilmadi
          </p>
        ) : (
          <>
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-10
              "
            >
              {visibleNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>

            {/* SHOW ALL BUTTON */}
            {!showAll && filteredNews.length > 3 && (
              <div className="mt-16 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="
                    inline-flex items-center gap-2
                    px-8 py-4
                    rounded-xl
                    bg-purple-600 text-white
                    font-semibold
                    hover:bg-purple-700
                    transition
                    shadow-md
                  "
                >
                  Barchasini ko‘rish
                  <span className="text-lg">↓</span>
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
};

export default News;
