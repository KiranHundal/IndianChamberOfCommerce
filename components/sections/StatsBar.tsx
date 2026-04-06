const stats = [
  { value: "200+", label: "Members" },
  { value: "12", label: "Sectors" },
  { value: "40+", label: "Events/Year" },
  { value: "15", label: "Years" },
];

export default function StatsBar() {
  return (
    <section className="bg-navy-900 border-t border-white/10 py-8">
      <div className="max-w-[75rem] mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-h2 md:text-h1 text-gold-600 italic">
              {stat.value}
            </p>
            <p className="font-label text-micro tracking-widest uppercase text-white/35 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
