import PublicNavbar from "../../components/PublicNavbar.jsx";

export default function Gallery() {
  return (
    <div>
      <PublicNavbar />
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink font-semibold mb-3">Gallery</h1>
        <p className="text-indigo-500 mb-8">Photos from campus life, events, and Annual Day will go here.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-400 text-xs">
              Upload photo {i + 1}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
