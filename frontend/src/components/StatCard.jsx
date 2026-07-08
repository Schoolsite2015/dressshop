export default function StatCard({ label, value, accent = 'navy', sub }) {
  const colors = {
    navy: 'var(--color-navy)',
    maroon: 'var(--color-maroon)',
    gold: 'var(--color-gold)',
  };
  return (
    <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: colors[accent] }} />
      <div className="text-xs uppercase tracking-wide text-black/50 mb-1 pl-2">{label}</div>
      <div className="font-display text-3xl pl-2 font-mono-num">{value}</div>
      {sub && <div className="text-xs text-black/40 pl-2 mt-1">{sub}</div>}
    </div>
  );
}
