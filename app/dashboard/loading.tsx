export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-7">
      <div className="animate-pulse space-y-3">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-200" />
      </div>
      <div className="h-24 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.85fr)]">
        <div className="h-[26rem] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        <div className="h-[26rem] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
      </div>
    </div>
  );
}
