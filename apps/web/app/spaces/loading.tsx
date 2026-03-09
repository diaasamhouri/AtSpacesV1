export default function SpacesLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          <div className="flex gap-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-48" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="h-48 bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
