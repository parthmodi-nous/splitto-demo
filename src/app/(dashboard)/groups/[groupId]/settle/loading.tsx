export default function SettleLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
