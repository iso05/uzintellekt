const Board = () => {
  return (
    <section className="pt-28 pb-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <h1 className="text-4xl md:text-5xl font-bold gradient-title pb-6">
          Kuzatuv kengashi
        </h1>

        <p className="text-gray-600 max-w-3xl mb-12">
          Jamiyat faoliyati ustidan nazorat qiluvchi Kuzatuv kengashi a’zolari
          va ularning vakolatlari.
        </p>

        {/* KEYIN: kengash a’zolari */}
        <div className="text-gray-400 italic">
          Kuzatuv kengashi tarkibi tez orada e’lon qilinadi.
        </div>
      </div>
    </section>
  )
}

export default Board
