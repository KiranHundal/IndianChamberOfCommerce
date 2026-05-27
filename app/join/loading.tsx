export default function JoinLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-navy-900 h-64 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-80 bg-white/10 rounded animate-pulse" />
      </div>

      {/* Pricing cards */}
      <div className="bg-page-bg max-w-4xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg p-8 space-y-4 shadow-sm">
            <div className="h-6 w-40 bg-navy-100 rounded animate-pulse" />
            <div className="h-8 w-24 bg-navy-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-navy-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-navy-100 rounded animate-pulse mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
