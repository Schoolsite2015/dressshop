import PublicNavbar from "../../components/PublicNavbar.jsx";

export default function About() {
  return (
    <div>
      <PublicNavbar />
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink font-semibold mb-6">About Us</h1>
        <p className="text-indigo-600 leading-relaxed mb-4">
          S.N Public School, Pindra, has served students from Pindra and the
          surrounding villages of Varanasi district since 2007, offering a
          CBSE-aligned education from Nursery through Class XII.
        </p>
        <p className="text-indigo-600 leading-relaxed mb-4">
          Our approach pairs strong academic fundamentals with attention to
          each child's discipline, character, and confidence — the qualities
          our founders believed mattered as much as marks.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 mt-10">
          {[
            { k: "Mission", v: "Accessible, quality CBSE education for the children of Pindra and Varanasi district." },
            { k: "Vision", v: "A digitally connected campus where every parent stays informed and every child is known." },
            { k: "Values", v: "Discipline, curiosity, and respect — inside the classroom and out." },
          ].map((b) => (
            <div key={b.k} className="bg-white border border-indigo-100 rounded-xl p-5">
              <p className="font-display text-lg text-marigold-500 mb-2">{b.k}</p>
              <p className="text-sm text-indigo-500">{b.v}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
