export default function ContactLoading() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-navy-900 h-64 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-8 w-56 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-72 bg-white/10 rounded animate-pulse" />
      </div>

      {/* Two-column layout */}
      <div className="bg-page-bg max-w-6xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-navy-100 rounded animate-pulse" />
          <div className="h-4 w-64 bg-navy-100 rounded animate-pulse" />
          <div className="h-4 w-56 bg-navy-100 rounded animate-pulse" />
          <div className="h-4 w-60 bg-navy-100 rounded animate-pulse" />
        </div>
        {/* Form fields */}
        <div className="space-y-4">
          <div className="h-10 w-full bg-navy-100 rounded animate-pulse" />
          <div className="h-10 w-full bg-navy-100 rounded animate-pulse" />
          <div className="h-28 w-full bg-navy-100 rounded animate-pulse" />
          <div className="h-10 w-32 bg-navy-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
