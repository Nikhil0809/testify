export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
);

export const QuestionSkeleton = () => (
  <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
    <div className="flex items-center justify-between gap-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-24" />
    </div>
    <Skeleton className="h-7 w-11/12" />
    <Skeleton className="h-7 w-8/12" />
    <div className="grid gap-4 pt-2 sm:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
    <div className="flex justify-between pt-4">
      <Skeleton className="h-11 w-28 rounded-xl" />
      <Skeleton className="h-11 w-28 rounded-xl" />
    </div>
  </div>
);

export const HistorySkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4"
      >
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 flex-1 min-w-[120px]" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ rows = 6 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <Skeleton className="mb-3 h-4 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
