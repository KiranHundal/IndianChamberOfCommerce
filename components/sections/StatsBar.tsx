import AnimatedSection from '@/components/ui/AnimatedSection'

const stats = [
  { value: "100+", label: "Members" },
  { value: "8", label: "Sectors" },
  { value: "4", label: "Counties Served" },
];

export default function StatsBar() {
  return (
    <section className="bg-page-alt py-16 border-y border-ivory-200">
      <div className="max-w-5xl mx-auto px-8 grid grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <AnimatedSection key={stat.label} delay={i}>
            <div className="text-center">
              <p className="font-display text-display md:text-hero-sm text-brand">
                {stat.value}
              </p>
              <p className="font-label text-micro tracking-widest uppercase text-brand/50 mt-2">
                {stat.label}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
