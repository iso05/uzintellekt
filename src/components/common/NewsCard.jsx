import { NavLink } from "react-router-dom";

const NewsCard = ({ item }) => {
  return (
    <article className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden">
      
      {/* IMAGE */}
      <div className="h-48 overflow-hidden">
        <img
          src={item.img}
          alt={item.title}
          className="w-full h-full object-cover hover:scale-105 transition"
        />
      </div>

      {/* CONTENT */}
      <div className="p-6">
        <span className="inline-block text-xs text-purple-600 font-medium mb-2">
          {item.category}
        </span>

        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
          {item.title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {item.date}
        </p>

        <NavLink
          to={`/news/${item.id}`}
          className="inline-block mt-5 text-purple-600 font-medium hover:underline"
        >
          Batafsil →
        </NavLink>
      </div>
    </article>
  );
};

export default NewsCard;
