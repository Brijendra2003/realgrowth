const bar = "animate-pulse rounded-lg bg-sand";

export function PublicPageSkeleton() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Loading">
      <div className={`${bar} h-4 w-32`} />
      <div className={`${bar} mt-4 h-10 w-2/3 max-w-xl`} />
      <div className={`${bar} mt-3 h-4 w-1/2 max-w-md`} />
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[1.375rem] border border-line bg-paper">
            <div className="aspect-[4/3] animate-pulse bg-sand" />
            <div className="space-y-3 p-5">
              <div className={`${bar} h-6 w-1/3`} />
              <div className={`${bar} h-4 w-3/4`} />
              <div className={`${bar} h-12 w-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className={`${bar} h-4 w-24`} />
      <div className={`${bar} mt-3 h-8 w-72`} />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-28 animate-pulse" />
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="w-full max-w-md" aria-busy="true" aria-label="Loading">
      <div className={`${bar} h-4 w-24`} />
      <div className={`${bar} mt-3 h-10 w-64`} />
      <div className="mt-8 space-y-4">
        <div className={`${bar} h-12 w-full`} />
        <div className={`${bar} h-12 w-full`} />
        <div className="h-12 w-full animate-pulse rounded-full bg-brand-green/20" />
      </div>
    </div>
  );
}
