export default function AboutLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-navy-900 h-64 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-96 bg-white/10 rounded animate-pulse" />
      </div>

      {/* Content */}
      <div className="bg-page-bg max-w-4xl mx-auto py-16 px-4 space-y-4">
        <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-navy-100 rounded animate-pulse" />
        <div className="h-8" />
        <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-navy-100 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-navy-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
